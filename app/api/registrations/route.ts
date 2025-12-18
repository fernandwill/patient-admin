import {NextResponse} from "next/server";
import {query} from "@/lib/db";
import {generateSequence} from "@/lib/sequence";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {patientId, registrationDate, notes} = body || {};

        if (!patientId || !registrationDate) {
            return NextResponse.json(
                {error: "patientId and registrationDate are required."},
                {status: 400}
            );
        }

        const checkPatientExist = await query (
            "SELECT id FROM patients WHERE id = $1 AND deleted_at IS NULL",
            [patientId]
        );
        // api guard to check patient existences
        if (checkPatientExist.rowCount === 0) {
            return NextResponse.json(
                {error: "Patient not found."},
                {status: 404}
            );
        }

        const registrationNo = await generateSequence("REG"); // wait for new daily YYMMDD +  6 digit number to be generated

        const insert = `INSERT INTO registrations (registration_no, patient_id, registration_date, notes) VALUES ($1, $2, $3, $4) RETURNING *;`;
        
    try {
        const {rows} = await query(insert, [
            registrationNo,
            patientId,
            registrationDate,
            notes ?? null,
        ]);
        return NextResponse.json(rows[0], {status: 201});
    } catch (err) {
        const errCode = err as {code?: string};
        if (errCode?.code === "23505") {
            return NextResponse.json({error: "Registration number already exists."}, {status: 409});
            } 
        throw err;
        }
    } catch (err) {
        console.error(err);
        return NextResponse.json({error: "Internal server error."}, {status: 500})
    }
}


export async function GET(req: Request) {
    try {
        const {searchParams} = new URL(req.url);
        const reg = searchParams.get("reg");
        const rm = searchParams.get("rm");
        const name = searchParams.get("name");
        const start = searchParams.get("start");
        const end = searchParams.get("end");
        const limitParam = Number(searchParams.get("limit") ?? "100");
        const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 200) : 100;
        const includeDeleted = searchParams.get("includeDeleted") === "true";

        const conditions: string[] = includeDeleted ? ["p.deleted_at IS NULL"] : ["r.deleted_at IS NULL", "p.deleted_at IS NULL"];
        const params: any[] = [];
        let index = 1;

        if (reg) {
            conditions.push(`r.registration_no ILIKE $${index}`);
            params.push(`%${reg}%`);
            index ++;
        }

        if (rm) {
            conditions.push(`p.medical_record_no ILIKE $${index}`);
            params.push(`%${rm}%`);
            index ++;
        }

        if (name) {
            conditions.push(`p.full_name ILIKE $${index}`);
            params.push(`%${name}%`);
            index ++;
        }

        if (start) {
            conditions.push(`r.registration_date >= $${index}`);
            params.push(start);
            index ++;
        }

        if (end) {
            conditions.push(`r.registration_date <= $${index}`);
            params.push(end);
            index ++;
        }

        const whereClause = conditions.join(" AND ");
        const list = `
          SELECT r.*, p.full_name, p.medical_record_no FROM registrations r JOIN patients p ON p.id = r.patient_id WHERE ${whereClause} ORDER BY r.registration_date DESC LIMIT $${index};
        `;
        params.push(limit);

        const {rows} = await query(list, params);
        return NextResponse.json(rows, {status: 200});
    } catch (err) {
        console.error(err);
        return NextResponse.json({error: "Internal server error."}, {status: 500});
    }
}

export async function PATCH(req: Request) {
    try {
        const body = await req.json();
        const {id, deleted} = body || {};
        const registrationId = Number(id);

        if (!registrationId || Number.isNaN(registrationId)) {
            return NextResponse.json({error: "id is required"}, {status: 400});
        }

        const existingRegistration = await query("SELECT id, patient_id FROM registrations WHERE id = $1", [registrationId]);
        if (existingRegistration.rowCount === 0) {
            return NextResponse.json({error: "Registration not found"}, {status: 404});
        }

        const patientId = existingRegistration.rows[0].patient_id;
        const patient = await query("SELECT id FROM patients WHERE id = $1 AND deleted_at IS NULL", [patientId]);
        if (patient.rowCount === 0) {
            return NextResponse.json({error: "Patient not found or deleted"}, {status: 404});
        }

        const deletedAt = deleted === true ? new Date().toISOString() : null;
        const update = `
            UPDATE registrations
            SET deleted_at = $1, updated_at = NOW()
            WHERE id = $2
            RETURNING *;
        `;

        const {rows} = await query(update, [deletedAt, registrationId]);
        return NextResponse.json(rows[0], {status: 200});
    } catch (err) {
        console.error(err);
        return NextResponse.json({error: "Internal server error."}, {status: 500});
    }
}

export async function PUT(req: Request) {
    try {
        const body = await req.json();
        const {id, patientId, registrationDate, notes} = body || {};
        const registrationId = Number(id);
        
        if (!registrationId || Number.isNaN(registrationId)) {
            return NextResponse.json({error: "id is required."}, {status: 400});
        }

        const existingRegistration = await query("SELECT id, patient_id, deleted_at FROM registrations WHERE id = $1", [registrationId]);
        if (existingRegistration.rowCount === 0) {
            return NextResponse.json({error: "Registration not found."}, {status: 404});
        }
        if (existingRegistration.rows[0].deleted_at) {
            return NextResponse.json({error: "Registration is already deleted."}, {status: 400});
        }

        const fields: string[] = [];
        const params: any[] = [];
        let index = 1;

        if (patientId) {
            const patient = await query("SELECT id FROM patients WHERE id = $1 AND deleted_at IS NULL", [patientId]);
            if (patient.rowCount === 0) {
                return NextResponse.json({error: "Patient not found."}, {status: 404});
            }
            fields.push(`patient_id = $${index}`);
            params.push(patientId);
            index ++;
        }

        if (registrationDate) {
            fields.push(`registration_date = $${index}`);
            params.push(registrationDate);
            index ++;
        }

        if (notes !== undefined) {
            fields.push(`notes = $${index}`);
            params.push(notes ?? null);
            index ++;
        }

        if (fields.length === 0) {
            return NextResponse.json({error: "No fields to update."}, {status: 400});
        }

        fields.push("updated_at = NOW()");
        const sql = `UPDATE registrations SET ${fields.join(", ")} WHERE id = $${index} RETURNING *;`;
        params.push(registrationId);

        const {rows} = await query(sql, params);
        return NextResponse.json(rows[0], {status: 200});
    } catch (err) {
        console.error(err);
        return NextResponse.json({error: "Internal server error."}, {status: 500});
    }
}

export async function DELETE(req: Request) {
    try {
        const {searchParams} =  new URL(req.url);
        const id = Number(searchParams.get("id"));
        if (!id || Number.isNaN(id)) {
            return NextResponse.json({error: "id is required."}, {status: 400});
        }

        const existingRegistration = await query("SELECT id FROM registrations WHERE id = $1", [id]);
        if (existingRegistration.rowCount === 0) {
            return NextResponse.json({error: "Registration not found."}, {status: 404});
        }

        const {rows} = await query("DELETE FROM registrations WHERE id = $1 RETURNING *;", [id]);
        return NextResponse.json(rows[0], {status: 200});
    } catch (err) {
        console.error(err);
        return NextResponse.json({error: "Internal server error."}, {status: 500});
    }
}