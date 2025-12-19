"use client";
import {useEffect, useState} from "react";
import RegistrationForm from "@/components/registrations/RegistrationForm";  
import ContentWrapper from "@/components/layout/ContentWrapper";

type RegistrationApiRow = {
    id: number;
    registration_date: string;
    patient_id: number;
    full_name: string | null;
    medical_record_no: string | null;
    notes: string | null;
    deleted_at: string | null;
};

export default function EditRegistrationPage({params}: {params: {id: string}}) {
    const [registration, setRegistration] = useState<RegistrationApiRow | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const controller = new AbortController();

        const loadRegistration = async () => {
            setIsLoading(true);
            setError(null);

            try {
                if (!params?.id) {
                    throw new Error("Missing registration id.");
                }

                const response = await fetch(`/api/registrations?id=${params.id}`, {
                    signal: controller.signal,
                });

                const payload = await response.json().catch(() => null);
                if (!response.ok) {
                    const message = payload?.error ?? `Request failed (${response.status})`;
                    throw new Error(message);
                }

                const first = Array.isArray(payload) ? payload[0] : null;
                if (!first) {
                    throw new Error("Registration not found.");
                }

                setRegistration(first);
            } catch (err) {
                const name = (err as {name?: string}).name;
                if (name === "AbortError") return;
                setError(err instanceof Error ? err.message : "Unknown error.");
            } finally {
                setIsLoading(false);
            }
        }

        loadRegistration();

        return () => controller.abort();
    }, [params?.id]);

    const initialData = registration
        ? {
            id: registration.id,
            patient: {
                id: registration.patient_id,
                full_name: registration.full_name ?? "",
                medical_record_no: registration.medical_record_no ?? "",
            },
            registrationDate: (registration.registration_date ?? "").split("T")[0],
            notes: registration.notes ?? null,
        }
        : undefined;

    return (
        <ContentWrapper title={`Edit Registration #${params.id}`}>
            <div className="max-w-4xl mx-auto">
                {isLoading ? (
                    <div className="rounded border border-gray-200 bg-white p-4 text-sm text-gray-500">
                        Loading registration...
                    </div>
                ) : error ? (
                    <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        {error}
                    </div>
                ) : initialData ? (
                    <RegistrationForm initialData={initialData} isEdit={true}/>
                ) : (
                    <div className="rounded border border-gray-200 bg-white p-4 text-sm text-gray-500">
                        Registration not found.
                    </div>
                )}
            </div>
        </ContentWrapper>
    );
}
