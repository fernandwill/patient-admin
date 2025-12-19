import { NextResponse } from "next/server";
import { getClient, query } from "@/lib/db";
import { generateSequenceWithClient } from "@/lib/sequence";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { patientId, registrationDate, notes, registrationNo, patient } = body || {};

        if ((!patientId && !patient) || !registrationDate) {
            return NextResponse.json(
                { error: "patientId (or patient) and registrationDate are required." },
                { status: 400 }
            );
        }

        if (registrationNo) {
            return NextResponse.json({ error: "registrationNo is system-generated and cannot be provided." }, { status: 400 });
        }

        const client = await getClient();
        try {
            await client.query("BEGIN");

            let finalPatientId = Number(patientId);

            if (patient) {
                const { fullName, dateOfBirth, gender, phone, address, photoUrl } = patient || {};
                if (!fullName || !dateOfBirth) {
                    await client.query("ROLLBACK");
                    return NextResponse.json({ error: "patient.fullName and patient.dateOfBirth are required." }, { status: 400 });
                }

                const patientGender = typeof gender === "string" ? gender.trim() : null;
                if (patientGender && patientGender !== "Male" && patientGender !== "Female") {
                    await client.query("ROLLBACK");
                    return NextResponse.json({ error: "Gender must be male or female." }, { status: 400 });
                }

                const medicalRecordNo = await generateSequenceWithClient(client, "RM");
                const insertPatient = `INSERT INTO patients (medical_record_no, full_name, date_of_birth, phone, address, photo_url, gender) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id;`;
                const patientResult = await client.query(insertPatient, [
                    medicalRecordNo,
                    fullName,
                    dateOfBirth,
                    phone ?? null,
                    address ?? null,
                    photoUrl ?? null,
                    patientGender,
                ]);
                finalPatientId = Number(patientResult.rows[0]?.id);
            }

            if (!finalPatientId || Number.isNaN(finalPatientId)) {
                await client.query("ROLLBACK");
                return NextResponse.json({ error: "patientId is required." }, { status: 400 });
            }

            const checkPatientExist = await client.query(
                "SELECT id FROM patients WHERE id = $1 AND deleted_at IS NULL",
                [finalPatientId]
            );
            if (checkPatientExist.rowCount === 0) {
                await client.query("ROLLBACK");
                return NextResponse.json({ error: "Patient not found." }, { status: 404 });
            }

            const nextRegistrationNo = await generateSequenceWithClient(client, "REG");
            const insert = `INSERT INTO registrations (registration_no, patient_id, registration_date, notes) VALUES ($1, $2, $3, $4) RETURNING *;`;
            const { rows } = await client.query(insert, [
                nextRegistrationNo,
                finalPatientId,
                registrationDate,
                notes ?? null,
            ]);

            await client.query("COMMIT");
            return NextResponse.json(rows[0], { status: 201 });
        } catch (err) {
            await client.query("ROLLBACK");
            const errCode = err as { code?: string };
            if (errCode?.code === "23505") {
                return NextResponse.json({ error: "Registration number already exists." }, { status: 409 });
            }
            throw err;
        } finally {
            client.release();
        }
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Internal server error." }, { status: 500 })
    }
}


export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const queue = searchParams.get("queue");
        const reg = searchParams.get("reg");
        const rm = searchParams.get("rm");
        const name = searchParams.get("name");
        const dob = searchParams.get("dob");
        const start = searchParams.get("start");
        const end = searchParams.get("end");
        // loading single reg by id
        const idParam = searchParams.get("id");
        const id = idParam ? Number(idParam) : null;
        // loading list of regs
        const limitParam = Number(searchParams.get("limit") ?? "100");
        const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 200) : 100;
        const deletedOnly = searchParams.get("deletedOnly") === "true";
        const includeDeleted = searchParams.get("includeDeleted") === "true";

        const conditions: string[] = includeDeleted
            ? ["p.deleted_at IS NULL"]
            : deletedOnly
                ? ["r.deleted_at IS NOT NULL", "p.deleted_at IS NULL"]
                : ["r.deleted_at IS NULL", "p.deleted_at IS NULL"];
        const params: any[] = [];
        let index = 1;

        if (idParam && (!Number.isFinite(id) || id === 0)) {
            return NextResponse.json({ error: "Invalid id parameter." }, { status: 400 });
        }

        if (id) {
            conditions.push(`r.id = $${index}`);
            params.push(id);
            index++;
        }

        // Unified search: queue searches across name, rm, reg, and dob
        const queueTrimmed = typeof queue === "string" ? queue.trim() : "";
        if (queueTrimmed) {
            const orParts: string[] = [];

            const likeIndex = index;
            params.push(`%${queueTrimmed}%`);
            index++;

            orParts.push(`p.full_name ILIKE $${likeIndex}`);
            orParts.push(`p.medical_record_no ILIKE $${likeIndex}`);
            orParts.push(`r.registration_no ILIKE $${likeIndex}`);

            // If the query looks like a date (YYYY-MM-DD), also search by DOB
            if (/^\d{4}-\d{2}-\d{2}$/.test(queueTrimmed)) {
                const dobIndex = index;
                params.push(queueTrimmed);
                index++;

                orParts.push(`p.date_of_birth = $${dobIndex}`);
            }

            conditions.push(`(${orParts.join(" OR ")})`);
        } else {
            // Individual parameter search (legacy support)
            if (reg) {
                conditions.push(`r.registration_no ILIKE $${index}`);
                params.push(`%${reg}%`);
                index++;
            }

            if (rm) {
                conditions.push(`p.medical_record_no ILIKE $${index}`);
                params.push(`%${rm}%`);
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
        }

        if (start) {
            conditions.push(`r.registration_date >= $${index}`);
            params.push(start);
            index++;
        }

        if (end) {
            conditions.push(`r.registration_date <= $${index}`);
            params.push(end);
            index++;
        }

        const whereClause = conditions.join(" AND ");
        const list = `
          SELECT r.*, p.full_name, p.medical_record_no, p.date_of_birth, p.gender, p.phone, p.address FROM registrations r JOIN patients p ON p.id = r.patient_id WHERE ${whereClause} ORDER BY r.registration_date DESC LIMIT $${index};
        `;
        params.push(limit);

        const { rows } = await query(list, params);
        return NextResponse.json(rows, { status: 200 });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Internal server error." }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const body = await req.json();
        const { id, deleted } = body || {};
        const registrationId = Number(id);

        if (!registrationId || Number.isNaN(registrationId)) {
            return NextResponse.json({ error: "id is required" }, { status: 400 });
        }

        const existingRegistration = await query("SELECT id, patient_id FROM registrations WHERE id = $1", [registrationId]);
        if (existingRegistration.rowCount === 0) {
            return NextResponse.json({ error: "Registration not found" }, { status: 404 });
        }

        const patientId = existingRegistration.rows[0].patient_id;
        const patient = await query("SELECT id FROM patients WHERE id = $1 AND deleted_at IS NULL", [patientId]);
        if (patient.rowCount === 0) {
            return NextResponse.json({ error: "Patient not found or deleted" }, { status: 404 });
        }

        const deletedAt = deleted === true ? new Date().toISOString() : null;
        const update = `
            UPDATE registrations
            SET deleted_at = $1, updated_at = NOW()
            WHERE id = $2
            RETURNING *;
        `;

        const { rows } = await query(update, [deletedAt, registrationId]);
        return NextResponse.json(rows[0], { status: 200 });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Internal server error." }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const body = await req.json();
        const { id, patientId, registrationDate, notes } = body || {};
        const registrationId = Number(id);

        if (!registrationId || Number.isNaN(registrationId)) {
            return NextResponse.json({ error: "id is required." }, { status: 400 });
        }

        const existingRegistration = await query("SELECT id, patient_id, deleted_at FROM registrations WHERE id = $1", [registrationId]);
        if (existingRegistration.rowCount === 0) {
            return NextResponse.json({ error: "Registration not found." }, { status: 404 });
        }
        if (existingRegistration.rows[0].deleted_at) {
            return NextResponse.json({ error: "Registration is already deleted." }, { status: 400 });
        }

        const fields: string[] = [];
        const params: any[] = [];
        let index = 1;

        if (patientId) {
            const patient = await query("SELECT id FROM patients WHERE id = $1 AND deleted_at IS NULL", [patientId]);
            if (patient.rowCount === 0) {
                return NextResponse.json({ error: "Patient not found." }, { status: 404 });
            }
            fields.push(`patient_id = $${index}`);
            params.push(patientId);
            index++;
        }

        if (registrationDate) {
            fields.push(`registration_date = $${index}`);
            params.push(registrationDate);
            index++;
        }

        if (notes !== undefined) {
            fields.push(`notes = $${index}`);
            params.push(notes ?? null);
            index++;
        }

        if (fields.length === 0) {
            return NextResponse.json({ error: "No fields to update." }, { status: 400 });
        }

        fields.push("updated_at = NOW()");
        const sql = `UPDATE registrations SET ${fields.join(", ")} WHERE id = $${index} RETURNING *;`;
        params.push(registrationId);

        const { rows } = await query(sql, params);
        return NextResponse.json(rows[0], { status: 200 });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Internal server error." }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = Number(searchParams.get("id"));
        if (!id || Number.isNaN(id)) {
            return NextResponse.json({ error: "id is required." }, { status: 400 });
        }

        const existingRegistration = await query("SELECT id FROM registrations WHERE id = $1", [id]);
        if (existingRegistration.rowCount === 0) {
            return NextResponse.json({ error: "Registration not found." }, { status: 404 });
        }

        const { rows } = await query("DELETE FROM registrations WHERE id = $1 RETURNING *;", [id]);
        return NextResponse.json(rows[0], { status: 200 });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Internal server error." }, { status: 500 });
    }
}
