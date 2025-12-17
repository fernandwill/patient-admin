"use client";
import {useEffect, useState} from "react";
import ContentWrapper from '@/components/layout/ContentWrapper';
import PatientForm from '@/components/patients/PatientForm';

type PatientFormData = {
    id: number;
    name: string;
    dob: string;
    gender: string;
    address: string;
    phone: string;
    photoUrl: string | null;
}

export default function EditPatientPage({ params }: { params: { id: string } }) {
    const [patient, setPatient] = useState<PatientFormData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const controller = new AbortController();
        const loadPatient = async () => {
            setIsLoading(true);
            setError(null);

            try {
                if (!params?.id) {
                    throw new Error("Missing patient id.");
                }
                const response = await fetch(`/api/patients?id=${params.id}`, {
                    signal: controller.signal,
                });

                const payload = await response.json().catch(() => null);

                if (!response.ok) {
                    const message = payload?.error ?? `Request failed (${response.status})`;
                    throw new Error(message);
                }

                const first = Array.isArray(payload) ? payload[0] : null;

                if (!first) {
                    throw new Error("Patient not found.");
                }

                const mappedPatient: PatientFormData = {
                    id: first.id,
                    name: first.full_name ?? "",
                    dob: first.date_of_birth ?? "",
                    gender: first.gender ?? "",
                    address: first.address ?? "",
                    phone: first.phone ?? "",
                    photoUrl: first.photo_url ?? null,
                };

                setPatient(mappedPatient);
            } catch (err) {
                const name = (err as {name?: string}).name;
                if (name === "AbortError") return;
                setError(err instanceof Error ? err.message : "Unknown error.");
            } finally {
                setIsLoading(false);
            }
        };

        loadPatient();

        return () => {
            controller.abort();
        };
    }, [params?.id]);

    return (
        <ContentWrapper title={`Edit Patient #${params.id}`}>
            <div className="max-w-4xl mx-auto">
                {isLoading ? (
                    <div className="rounded border border-gray-200 bg-white p-4 text-sm text-gray-500">Loading patient...</div>
                ) : error ? (
                    <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
                ) : patient ? (
                    <PatientForm initialData={patient} isEdit={true} />
                ) : (
                    <div className="rounded border border-gray-200 bg-white p-4 text-sm text-gray-500">Patient not found.</div>
                )}
            </div>
        </ContentWrapper>
    );
}
