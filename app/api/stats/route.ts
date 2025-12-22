import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
    try {
        // 1. Total Patients (active)
        const patientsCount = await query("SELECT COUNT(*) FROM patients WHERE deleted_at IS NULL");

        // 2. Total Registrations (active)
        const registrationsCount = await query("SELECT COUNT(*) FROM registrations WHERE deleted_at IS NULL");

        // 3. Registrations Today
        const todayCount = await query(
            "SELECT COUNT(*) FROM registrations WHERE deleted_at IS NULL AND registration_date::date = CURRENT_DATE"
        );

        // 4. Recent Activity (Last 5 registrations)
        const recentActivity = await query(`
            SELECT r.id, r.registration_no, r.registration_date, p.full_name, p.medical_record_no
            FROM registrations r
            JOIN patients p ON p.id = r.patient_id
            WHERE r.deleted_at IS NULL
            ORDER BY r.registration_date DESC
            LIMIT 5
        `);

        // 5. Latest Patients (Last 5)
        const latestPatients = await query(`
            SELECT id, full_name, medical_record_no, created_at
            FROM patients
            WHERE deleted_at IS NULL
            ORDER BY created_at DESC
            LIMIT 5
        `);

        return NextResponse.json({
            stats: {
                totalPatients: parseInt(patientsCount.rows[0].count),
                totalRegistrations: parseInt(registrationsCount.rows[0].count),
                todayRegistrations: parseInt(todayCount.rows[0].count),
                // We'll use a placeholder for "New Orders" or similar if needed, 
                // but let's stick to these three for now.
            },
            recentActivity: recentActivity.rows,
            latestPatients: latestPatients.rows
        }, { status: 200 });

    } catch (err) {
        console.error("Stats API Error:", err);
        return NextResponse.json({ error: "Internal server error." }, { status: 500 });
    }
}
