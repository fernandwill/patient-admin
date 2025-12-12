import {NextResponse} from "next/server";
import {query} from "@/lib/db";
import {generateSequence} from "@/lib/sequence";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {fullName, dateOfBirth, phone, address, photoUrl} = body || {};

        if (!fullName || !dateOfBirth) {
            return NextResponse.json({error: "fullName and dateOfBirth are required."}, {status: 400});
        }
        
        const medicalRecordNo = await generateSequence("RM"); // wait for daily YYMMDD + 3 digit number to be generated
        const insert = `INSERT INTO patients (medical_record_no, full_name, date_of_birth, phone, address, photo_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;`;
        const {rows} = await query(insert, [medicalRecordNo, fullName, dateOfBirth, phone ?? null, address ?? null, photoUrl ?? null]);
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
        const limitParam = Number(searchParams.get("limit") ?? "100");
        const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 200) : 100;

        const conditions: string[] = ["deleted_at IS NULL"];
        const params: any[] = [];
        let index = 1;

        if (name) {
            conditions.push(`full_name ILIKE $${index}`);
            params.push(`%${name}%`);
            index += 1;
        }

        if (dob) {
            conditions.push(`date_of_birth = $${index}`);
            params.push(dob);
            index += 1;
        }

        if (rm) {
            conditions.push(`medical_record_no ILIKE $${index}`);
            params.push(`%${rm}%`);
            index += 1;
        }

        const whereClause = conditions.join(" AND ");
        const list = `
          SELECT * FROM patients
          WHERE ${whereClause}
          ORDER BY created_at DESC
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
