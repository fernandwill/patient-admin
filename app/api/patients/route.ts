import {NextResponse} from "next/server";
import {query} from "@/lib/db";
import {generateSequence} from "@/lib/sequence";

const ALLOWED_GENDER = new Set(["Male", "Female"]);

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {fullName, dateOfBirth, phone, address, photoUrl, gender} = body || {};

        if (!fullName || !dateOfBirth) {
            return NextResponse.json({error: "fullName and dateOfBirth are required."}, {status: 400});
        }

        const patientGender = typeof gender === "string" ? gender.trim() : null;
        if (patientGender && !ALLOWED_GENDER.has(patientGender)) {
            return NextResponse.json({error: "Gender must be male or female."}, {status: 400});
        }
        
        const medicalRecordNo = await generateSequence("RM"); // wait for daily YYMMDD + 3 digit number to be generated
        const insert = `INSERT INTO patients (medical_record_no, full_name, date_of_birth, phone, address, photo_url, gender) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *;`;
        const {rows} = await query(insert, [medicalRecordNo, fullName, dateOfBirth, phone ?? null, address ?? null, photoUrl ?? null, patientGender]);
        return NextResponse.json(rows[0], {status: 201});
    } catch (err) {
        console.error(err);
        return NextResponse.json({error: "Internal server error."}, {status: 500});
    }
}

export async function GET(req: Request) {
    try {
        const {searchParams} = new URL(req.url);
        const name = searchParams.get("name");
        const dob = searchParams.get("dob");
        const rm = searchParams.get("rm");
        const idParam = searchParams.get("id");
        const id = idParam ? Number(idParam) : null;
        const limitParam = Number(searchParams.get("limit") ?? "100");
        const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 200) : 100;

        const conditions: string[] = ["p.deleted_at IS NULL"];
        const params: any[] = [];
        let index = 1;

        if (idParam && (!Number.isFinite(id) || id === 0)) {
            return NextResponse.json({error: "Invalid id parameter."}, {status: 400});
        }

        if (id) {
            conditions.push(`p.id = $${index}`);
            params.push(id);
            index++;
        }

        if (name) {
            conditions.push(`p.full_name ILIKE $${index}`);
            params.push(`%${name}%`);
            index++;
        }

        if (dob) {
            conditions.push(`p.date_of_birth = $${index}`);
            params.push(dob);
            index++;
        }

        if (rm) {
            conditions.push(`p.medical_record_no ILIKE $${index}`);
            params.push(`%${rm}%`);
            index++;
        }

        const whereClause = conditions.join(" AND ");
        const list = `
          -- MAX find the latest registration data per patient
          SELECT p.*, MAX(r.registration_date) AS latest_reg_date
          FROM patients p

          -- LEFT JOIN pulls each patient regist (non-deleted one)
          LEFT JOIN registrations r ON r.patient_id = p.id AND r.deleted_at IS NULL

          WHERE ${whereClause}
          GROUP BY p.id
          
          -- NULLS LAST keep never registered patient at the bottom
          ORDER BY latest_reg_date DESC NULLS LAST, p.created_at DESC
          LIMIT $${index};
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
        const patientId = Number(id);
        if (!patientId || Number.isNaN(patientId)) {
            return NextResponse.json({error: "id is required,"}, {status: 400});
        }
        const existingPatient = await query("SELECT id FROM patients WHERE id = $1", [patientId]);
        if (existingPatient.rowCount === 0) {
            return NextResponse.json({error: "Patient not found."}, {status: 404});
        }
        const deletedAt = deleted === true ? new Date().toISOString() : null;
        const update = `UPDATE patients SET deleted_at = $1, updated_at = NOW() WHERE id = $2 RETURNING *;`;
        const {rows} = await query(update, [deletedAt, patientId]);
        return NextResponse.json(rows[0], {status: 200});
    } catch (err) {
        console.error(err);
        return NextResponse.json({error: "Internal server error."}, {status: 500});
    }
}

export async function PUT(req: Request) {
    try {
        const body = await req.json();
        const {id, fullName, dateOfBirth, phone, address, photoUrl, gender} = body || {};
        const patientId = Number(id);
        if (!patientId || Number.isNaN(patientId)) {
            return NextResponse.json({error: "id is required."}, {status: 400});
        }

        const existingPatient = await query("SELECT id, deleted_at FROM patients WHERE id = $1", [patientId]);
        if (existingPatient.rowCount === 0) {
            return NextResponse.json({error: "Patient not found."}, {status: 404});
        }
        if (existingPatient.rows[0].deleted_at) {
            return NextResponse.json({error: "Cannot update a soft-deleted patient. Please undo the delete."}, {status: 400});
        }

        const fields: string[] = [];
        const params: any[] = [];
        let index = 1;
        const name = fullName?.trim();
        const patientGender = typeof gender === "string" ? gender.trim() : null;

        if (name) {
            fields.push(`full_name = $${index}`);
            params.push(name);
            index++;
        }
        if (dateOfBirth) {
            fields.push(`date_of_birth = $${index}`);
            params.push(dateOfBirth);
            index++;
        }
        if (phone !== undefined) {
            fields.push(`phone = $${index}`);
            params.push(phone ?? null);
            index++;
        }
        if (address !== undefined) {
            fields.push(`address = $${index}`);
            params.push(address ?? null);
            index++;
        }
        if (photoUrl !== undefined) {
            fields.push(`photo_url = $${index}`);
            params.push(photoUrl ?? null);
            index++;
        }
        if (gender !== undefined) {
            if (patientGender && !ALLOWED_GENDER.has(patientGender)) {
                return NextResponse.json({error: "Gender must be male or female."}, {status: 400});
            }
            fields.push(`gender = $${index}`);
            params.push(patientGender);
            index++;
        }
        if (fields.length === 0) {
            return NextResponse.json({error: "No fields to update."}, {status: 400});
        }
        
        fields.push("updated_at = NOW()");
        const sql = `UPDATE patients SET ${fields.join(", ")} WHERE id = $${index} RETURNING *;`;
        params.push(patientId);

        const {rows} = await query(sql, params);
        return NextResponse.json(rows[0], {status: 200});
    } catch (err) {
        console.error(err);
        return NextResponse.json({error: "Internal server error."}, {status: 500});
    }
}

export async function DELETE(req: Request) {
    try {
        const {searchParams} = new URL(req.url);
        const id = Number(searchParams.get("id"));
        if (!id || Number.isNaN(id)) {
            return NextResponse.json({error: "id is required."}, {status: 400});
        }

        const existing = await query ("SELECT id FROM patients WHERE id = $1", [id]);
        if (existing.rowCount === 0) {
            return NextResponse.json({error: "Patient not found."}, {status: 404});
        }
        
        const hasRegistration = await query("SELECT 1 FROM registrations WHERE patient_id = $1 LIMIT 1", [id]);
        const rowCount = hasRegistration.rowCount ?? 0;
        if (rowCount > 0) {
            return NextResponse.json({error: "Cannot delete a patient with existing registrations."}, {status: 409});
        }

        const {rows} = await query("DELETE FROM patients WHERE id = $1 RETURNING *;", [id]);
        return NextResponse.json(rows[0], {status: 200});

    } catch (err) {
        console.error(err);
        return NextResponse.json({error: "Internal server error."}, {status: 500})
    }
}
