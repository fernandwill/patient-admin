"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { apiFetch } from "@/lib/api";

type RegistrationFormValues = {
    registrationDate: string;
    complaint: string;
    patientFullName: string;
    patientDob: string;
    patientGender: string;
    patientPhone: string;
    patientAddress: string;
};

type RegistrationFormInitialData = {
    id: number;
    registrationNo: string;
    patient: {
        id: number;
        full_name: string;
        medical_record_no: string;
        date_of_birth?: string | null;
        gender?: string | null;
        phone?: string | null;
        address?: string | null;
    };
    registrationDate: string;
    registrationDateTime?: string | null;
    notes: string | null;
};

interface RegistrationFormProps {
    initialData?: RegistrationFormInitialData;
    isEdit?: boolean;
}

const parseNotes = (notes: string | null) => {
    if (!notes) return { complaint: "" };

    const lines = notes.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    let complaint = "";

    for (const line of lines) {
        if (line.toLowerCase().startsWith("complaint:")) {
            complaint = line.slice("Complaint:".length).trim();
        }
    }

    if (!complaint) {
        complaint = notes;
    }

    return { complaint };
};

const RegistrationForm = ({ initialData, isEdit = false }: RegistrationFormProps) => {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);


    const today = new Date().toISOString().split("T")[0];
    const parsed = parseNotes(initialData?.notes ?? null);

    const { register, handleSubmit, formState: { errors } } = useForm<RegistrationFormValues>({
        defaultValues: {
            registrationDate: initialData?.registrationDate ?? today,
            complaint: parsed.complaint,
            patientFullName: "",
            patientDob: "",
            patientGender: "",
            patientPhone: "",
            patientAddress: "",
        }
    });

    const onSubmit = async (values: RegistrationFormValues) => {
        setIsSubmitting(true);
        setErrorMessage(null);

        try {
            if (!values.registrationDate) {
                throw new Error("Registration date is required.");
            }

            const notesParts = [];
            if (values.complaint.trim()) {
                notesParts.push(`Complaint: ${values.complaint.trim()}`);
            }
            if (isEdit && !initialData?.id) {
                throw new Error("Missing registration id.");
            }

            const [yyyy, mm, dd] = values.registrationDate.split("-").map(Number);
            if (!yyyy || !mm || !dd) {
                throw new Error("Registration date is invalid.");
            }
            const baseTime = isEdit && initialData?.registrationDateTime
                ? new Date(initialData.registrationDateTime)
                : new Date();
            const registrationDateTime = new Date(
                yyyy,
                mm - 1,
                dd,
                baseTime.getHours(),
                baseTime.getMinutes(),
                baseTime.getSeconds(),
                0
            ).toISOString();

            const response = await apiFetch("/api/registrations", {
                method: isEdit ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(
                    isEdit
                        ? {
                            id: initialData!.id,
                            patientId: initialData?.patient?.id,
                            registrationDate: registrationDateTime,
                            notes: notesParts.length > 0 ? notesParts.join("\n") : null,
                        }
                        : {
                            registrationDate: registrationDateTime,
                            notes: notesParts.length > 0 ? notesParts.join("\n") : null,
                            patient: {
                                fullName: values.patientFullName.trim(),
                                dateOfBirth: values.patientDob,
                                gender: values.patientGender ? values.patientGender : null,
                                phone: values.patientPhone.trim() ? values.patientPhone.trim() : null,
                                address: values.patientAddress.trim() ? values.patientAddress.trim() : null,
                                photoUrl: null,
                            },
                        }
                ),
            });

            if (!response.ok) {
                const body = await response.json().catch(() => null);
                const message = body?.error ?? "Failed to save registration.";
                throw new Error(message);
            }
            router.push("/registrations");
        } catch (err) {
            setErrorMessage(err instanceof Error ? err.message : "Unknown error.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <div className="bg-card rounded shadow-sm border border-border transition-colors duration-300">
                <div className="p-6 border-b border-border bg-navbar rounded-t transition-colors duration-300">
                    <h3 className="text-lg font-medium text-foreground">{isEdit ? "Edit Registration" : "New Registration"}</h3>
                    <p className="mt-1 text-sm text-slate-400">{isEdit ? "Edit patient registration." : "Register a patient for a visit."}</p>
                    {errorMessage ? (
                        <div className="mt-4 p-3 bg-red-50 border-l-4 border-red-400 text-red-700 flex items-center gap-3 animate-in fade-in slide-in-from-top-1">
                            <i className="fas fa-exclamation-triangle"></i>
                            <p className="text-sm font-medium">{errorMessage}</p>
                            <button type="button" onClick={() => setErrorMessage(null)} className="ml-auto text-red-400 hover:text-red-600">
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                    ) : null}
                </div>

                <div className="p-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                    <div className="sm:col-span-6">
                        {isEdit ? (
                            <div className="mt-1 grid grid-cols-1 gap-4 sm:grid-cols-6">
                                <div className="sm:col-span-3">
                                    <label className="block text-sm font-medium text-foreground">Registration No. <span className="text-red-600">*</span></label>
                                    <input
                                        type="text"
                                        value={initialData?.registrationNo ?? ""}
                                        disabled
                                        className="mt-1 block w-full rounded-md border border-border bg-background p-2 text-sm text-slate-400"
                                    />
                                </div>

                                <div className="sm:col-span-3">
                                    <label className="block text-sm font-medium text-foreground">Medical Record No.</label>
                                    <input
                                        type="text"
                                        value={initialData?.patient?.medical_record_no ?? ""}
                                        disabled
                                        className="mt-1 block w-full rounded-md border border-border bg-slate-900/50 p-2 text-sm text-slate-400"
                                    />
                                </div>

                                <div className="sm:col-span-3">
                                    <label className="block text-sm font-medium text-foreground">Full Name <span className="text-red-600">*</span></label>
                                    <input
                                        type="text"
                                        value={initialData?.patient?.full_name ?? ""}
                                        disabled
                                        className="mt-1 block w-full rounded-md border border-border bg-slate-900/50 p-2 text-sm text-foreground"
                                    />
                                </div>

                                <div className="sm:col-span-3">
                                    <label className="block text-sm font-medium text-foreground">Date of Birth <span className="text-red-600">*</span></label>
                                    <input
                                        type="date"
                                        value={(initialData?.patient?.date_of_birth ?? "").toString().split("T")[0]}
                                        disabled
                                        className="mt-1 block w-full rounded-md border border-border bg-slate-900/50 p-2 text-sm text-foreground"
                                    />
                                </div>

                                <div className="sm:col-span-3">
                                    <label className="block text-sm font-medium text-foreground">Gender <span className="text-red-600">*</span></label>
                                    <select
                                        value={(initialData?.patient?.gender ?? "").toString()}
                                        disabled
                                        className="mt-1 block w-full rounded-md border border-border bg-slate-900/50 p-2 text-sm text-foreground"
                                    >
                                        <option value="">Select</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                    </select>
                                </div>

                                <div className="sm:col-span-3">
                                    <label className="block text-sm font-medium text-foreground">Phone</label>
                                    <input
                                        type="tel"
                                        value={(initialData?.patient?.phone ?? "").toString()}
                                        disabled
                                        className="mt-1 block w-full rounded-md border border-border bg-slate-900/50 p-2 text-sm text-foreground"
                                    />
                                </div>

                                <div className="sm:col-span-6">
                                    <label className="block text-sm font-medium text-foreground">Address</label>
                                    <textarea
                                        value={(initialData?.patient?.address ?? "").toString()}
                                        disabled
                                        rows={2}
                                        className="mt-1 block w-full rounded-md border border-border bg-slate-900/50 p-2 text-sm text-foreground"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="mt-1 grid grid-cols-1 gap-4 sm:grid-cols-6">
                                <div className="sm:col-span-3">
                                    <label className="block text-sm font-medium text-foreground">Registration No. <span className="text-red-600">*</span></label>
                                    <input
                                        type="text"
                                        value="Auto-generated on registration."
                                        disabled
                                        className="mt-1 block w-full rounded-md border border-border bg-slate-900/50 p-2 text-sm text-slate-400"
                                    />
                                </div>

                                <div className="sm:col-span-3">
                                    <label className="block text-sm font-medium text-foreground">Medical Record No. <span className="text-red-600">*</span></label>
                                    <input
                                        type="text"
                                        value="Auto-generated on registration."
                                        disabled
                                        className="mt-1 block w-full rounded-md border border-border bg-slate-900/50 p-2 text-sm text-slate-400"
                                    />
                                </div>

                                <div className="sm:col-span-3">
                                    <label htmlFor="patientFullName" className="block text-sm font-medium text-foreground">Full Name <span className="text-red-600">*</span></label>
                                    <input
                                        id="patientFullName"
                                        type="text"
                                        {...register("patientFullName", { required: "Full name is required." })}
                                        className="mt-1 shadow-sm focus:ring-blue-500 focus:border-blue-500 text-foreground bg-background placeholder:text-slate-500 block w-full sm:text-sm border-border rounded-md p-2 border transition-colors"
                                    />
                                    {errors.patientFullName ? (
                                        <p className="mt-1 text-xs text-red-600">{errors.patientFullName.message}</p>
                                    ) : null}
                                </div>

                                <div className="sm:col-span-3">
                                    <label htmlFor="patientDob" className="block text-sm font-medium text-foreground">Date of Birth <span className="text-red-600">*</span></label>
                                    <input
                                        id="patientDob"
                                        type="date"
                                        {...register("patientDob", { required: "Date of birth is required." })}
                                        className="mt-1 shadow-sm focus:ring-blue-500 focus:border-blue-500 text-foreground bg-background placeholder:text-slate-500 block w-full sm:text-sm border-border rounded-md p-2 border transition-colors"
                                    />
                                    {errors.patientDob ? (
                                        <p className="mt-1 text-xs text-red-600">{errors.patientDob.message}</p>
                                    ) : null}
                                </div>

                                <div className="sm:col-span-3">
                                    <label htmlFor="patientGender" className="block text-sm font-medium text-foreground">Gender <span className="text-red-600">*</span></label>
                                    <select
                                        id="patientGender"
                                        {...register("patientGender", { required: "Gender is required." })}
                                        className="mt-1 shadow-sm focus:ring-blue-500 focus:border-blue-500 text-foreground bg-background placeholder:text-slate-500 block w-full sm:text-sm border-border rounded-md p-2 border transition-colors"
                                    >
                                        <option value="">Select</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                    </select>
                                    {errors.patientGender ? (
                                        <p className="mt-1 text-xs text-red-600">{errors.patientGender.message}</p>
                                    ) : null}
                                </div>

                                <div className="sm:col-span-3">
                                    <label htmlFor="registrationDate" className="block text-sm font-medium text-foreground">Registration Date <span className="text-red-600">*</span></label>
                                    <div className="mt-1">
                                        <input
                                            type="date"
                                            id="registrationDate"
                                            {...register("registrationDate", { required: "Registration date is required." })}
                                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 text-foreground bg-background placeholder:text-slate-500 block w-full sm:text-sm border-border rounded-md p-2 border transition-colors"
                                        />
                                    </div>
                                    {errors.registrationDate ? (
                                        <p className="mt-2 text-sm text-red-600">{errors.registrationDate.message}</p>
                                    ) : null}
                                </div>

                                <div className="sm:col-span-6">
                                    <label htmlFor="patientAddress" className="block text-sm font-medium text-foreground">Address</label>
                                    <textarea
                                        id="patientAddress"
                                        rows={2}
                                        {...register("patientAddress")}
                                        className="mt-1 shadow-sm focus:ring-blue-500 focus:border-blue-500 text-foreground bg-background placeholder:text-slate-500 block w-full sm:text-sm border-border rounded-md p-2 border transition-colors"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="sm:col-span-3">
                        <label htmlFor="patientPhone" className="block text-sm font-medium text-foreground">Phone</label>
                        <input
                            id="patientPhone"
                            type="tel"
                            {...register("patientPhone")}
                            className="mt-1 shadow-sm focus:ring-blue-500 focus:border-blue-500 text-foreground bg-background placeholder:text-slate-500 block w-full sm:text-sm border-border rounded-md p-2 border transition-colors"
                        />
                    </div>

                    <div className="sm:col-span-6">
                        <label htmlFor="complaint" className="block text-sm font-medium text-foreground">Complaint</label>
                        <div className="mt-1">
                            <textarea
                                id="complaint"
                                {...register("complaint")}
                                rows={3}
                                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 text-foreground bg-background placeholder:text-slate-500 block w-full sm:text-sm border-border rounded-md p-2 border transition-colors duration-300"
                                placeholder="Describe symptoms..."
                            />
                        </div>
                    </div>
                </div>

                <div className="px-4 py-3 bg-navbar text-right sm:px-6 flex justify-end space-x-3 rounded-b border-t border-border transition-colors duration-300">
                    <Link href="/registrations" className="inline-flex justify-center py-2 px-4 border border-border shadow-sm text-sm font-medium rounded-md text-foreground bg-card hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-300">
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-300"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (isEdit ? "Saving..." : "Registering...") : (isEdit ? "Save" : "Register")}
                    </button>
                </div>
            </div>
        </form>
    );
};

export default RegistrationForm;
