"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import Link from "next/link";
import {useForm} from "react-hook-form";

type PatientOption = {
    id: number;
    full_name: string;
    medical_record_no: string;
    date_of_birth?: string;
    gender?: string | null;
};

type RegistrationFormValues = {
    patientId: string;
    registrationDate: string;
    complaint: string;
    doctor: string;
}

type RegistrationFormInitialData = {
    id: number;
    patient: {
        id: number;
        full_name: string;
        medical_record_no: string;
    };
    registrationDate: string;
    notes: string | null;
}

interface RegistrationFormProps {
    initialData?: RegistrationFormInitialData;
    isEdit?: boolean;
}

const parseNotes = (notes: string | null) => {
    if (!notes) return {doctor: "", complaint: ""};

    const lines = notes.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    let doctor = "";
    let complaint = "";

    for (const line of lines) {
        if (line.toLowerCase().startsWith("doctor:")) {
            doctor = line.slice("Doctor:".length).trim();
        } else if (line.toLowerCase().startsWith("complaint:")) {
            complaint = line.slice("Complaint:".length).trim();
        }
    }

    if (!doctor && !complaint) {
        complaint = notes;
    }

    return {doctor, complaint};
};

const RegistrationForm = ({initialData, isEdit = false}: RegistrationFormProps) => {
    const [patientSearch, setPatientSearch] = useState(initialData?.patient ? `${initialData.patient.full_name} (${initialData.patient.medical_record_no})` : "");
    const [searchResults, setSearchResults] = useState<PatientOption[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [selectedPatient, setSelectedPatient] = useState<PatientOption | null>(initialData?.patient ? {
        id: initialData.patient.id,
        full_name: initialData.patient.full_name,
        medical_record_no: initialData.patient.medical_record_no,
    } : null);
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const today = new Date().toISOString().split("T")[0];
    const parsed = parseNotes(initialData?.notes ?? null);

    const { register, handleSubmit, formState: { errors }, setValue } = useForm<RegistrationFormValues>({
        defaultValues: {
            patientId: initialData?.patient ? initialData.patient.id.toString() : "",
            registrationDate: initialData?.registrationDate ?? today,
            doctor: parsed.doctor,
            complaint: parsed.complaint,
        }
    });

    const buildPatientSearchParams = (raw: string) => {
        const trimmed = raw.trim();
        const params = new URLSearchParams();

        if (!trimmed) {
            return params;
        }

        const isDigits = /^\d+$/.test(trimmed);
        if (isDigits) {
            params.set("rm", trimmed);
            return params;
        }

        params.set("name", trimmed);
        return params;
    }

    const handlePatientSearch = async () => {
        setIsSearching(true);
        setSearchError(null);
        setSearchResults([]);

        try {
            const params = buildPatientSearchParams(patientSearch);
            const query = params.toString();

            if (!query) {
                throw new Error("Enter a name or medical record number to search.");
            }

            const response = await fetch(`/api/patients?${query}`);
            const payload = await response.json().catch(() => null);

            if (!response.ok) {
                const message = payload?.error ?? `Request failed (${response.status})`;
                throw new Error(message);
            }
            setSearchResults(Array.isArray(payload) ? payload : []);
        } catch (err) {
            setSearchError(err instanceof Error ? err.message : "Unknown error.");
        } finally {
            setIsSearching(false);
        }
    };

    const handleSelectPatient = (patient: PatientOption) => {
        setSelectedPatient(patient);
        setValue("patientId", patient.id.toString(), {shouldValidate: true, shouldDirty: true});
        setPatientSearch(`${patient.full_name} (${patient.medical_record_no})`);
        setSearchResults([]);
        setSearchError(null);
    };

    const onSubmit = async (values: RegistrationFormValues) => {
        setIsSubmitting(true);
        setErrorMessage(null);

        try {
            const patientId = Number(values.patientId);
            if (!patientId || Number.isNaN(patientId)) {
                throw new Error("Patient ID is required.");
            }
            if (!values.registrationDate) {
                throw new Error("Registration date is required.");
            }

            const notesParts = [];
            if (values.doctor.trim()) {
                notesParts.push(`Doctor: ${values.doctor.trim()}`);
            }
            if (values.complaint.trim()) {
                notesParts.push(`Complaint: ${values.complaint.trim()}`);
            }
            if (isEdit && !initialData?.id) {
                throw new Error("Missing registration id.");
            }
            
            const payload = {
                ...(isEdit ? {id: initialData!.id} : {}),
                patientId,
                registrationDate: values.registrationDate,
                notes: notesParts.length > 0 ? notesParts.join("\n") : null,
            };

            const response = await fetch("/api/registrations", {
                method: isEdit ? "PUT" : "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(payload),
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
            <div className="bg-white rounded shadow-sm">
                <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">{isEdit ? "Edit Registration" : "New Registration"}</h3>
                    <p className="mt-1 text-sm text-gray-500">Register a patient for a visit.</p>
                    {errorMessage ? (
                        <p className="mt-2 text-sm text-red-600">{errorMessage}</p>
                    ) : null}
                </div>

                <div className="p-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                    <div className="sm:col-span-6">
                        <label htmlFor="patientId" className="block text-sm font-medium text-gray-700">Patient (Search by Name or RM)</label>
                        <div className="mt-1 flex rounded-md shadow-sm">
                            <input type="hidden" {...register("patientId", {required: "Patient is required."})} />
                            <input
                                type="text"
                                id="patientId"
                                className="focus:ring-blue-500 focus:border-blue-500 flex-1 block w-full rounded-none rounded-l-md sm:text-sm border-gray-300 border p-2"
                                placeholder="Search patient..."
                                value={patientSearch}
                                onChange={(e) => setPatientSearch(e.target.value)}
                            />
                            <button
                                type="button"
                                className="-ml-px relative inline-flex items-center space-x-2 px-4 py-2 border border-gray-300 text-sm font-medium rounded-r-md text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                onClick={handlePatientSearch}
                                disabled={isSearching}
                            >
                                <i className="fas fa-search"></i>
                                <span>{isSearching ? "Searching..." : "Search"}</span>
                            </button>
                        </div>
                        <p className="mt-2 text-sm text-gray-500">Selected:{" "}<span className="font-semibold text-gray-800">{selectedPatient ? `${selectedPatient.full_name} (${selectedPatient.medical_record_no})` : "None"}</span></p>
                        {errors.patientId ? (
                            <p className="mt-2 text-sm text-red-600">{errors.patientId.message}</p>
                        ) : null}
                        {searchError ? (
                            <p className="mt-2 text-sm text-red-600">{searchError}</p>
                        ) : null}
                        {searchResults.length > 0 ? (
                            <ul className="mt-2 divide-y divide-gray-200 rounded border border-gray-200 bg-white">
                                {searchResults.map((patient) => (
                                    <li key={patient.id} className="p-2">
                                        <button
                                            type="button"
                                            onClick={() => handleSelectPatient(patient)}
                                            className="w-full rounded px-2 py-1 text-left hover:bg-gray-50"
                                        >
                                            <div className="text-sm font-medium text-gray-900">{patient.full_name}</div>
                                            <div className="text-sm text-gray-500">{patient.medical_record_no}</div>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        ) : null}
                    </div>

                    <div className="sm:col-span-3">
                        <label htmlFor="registrationDate" className="block text-sm font-medium text-gray-700">Registration Date</label>
                        <div className="mt-1">
                            <input
                                type="date"
                                id="registrationDate"
                                {...register("registrationDate", {required: "Registration date is required."})}
                                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                            />
                        </div>
                        {errors.registrationDate ? (
                            <p className="mt-2 text-sm text-red-600">{errors.registrationDate.message}</p>
                        ) : null}
                    </div>

                    <div className="sm:col-span-3">
                        <label htmlFor="doctor" className="block text-sm font-medium text-gray-700">Doctor</label>
                        <div className="mt-1">
                            <select
                                id="doctor"
                                {...register("doctor")}
                                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                            >
                                <option value="">Select Doctor</option>
                                <option value="Dr. Smith">Dr. Smith</option>
                                <option value="Dr. Jones">Dr. Jones</option>
                            </select>
                        </div>
                    </div>

                    <div className="sm:col-span-6">
                        <label htmlFor="complaint" className="block text-sm font-medium text-gray-700">Chief Complaint</label>
                        <div className="mt-1">
                            <textarea
                                id="complaint"
                                {...register("complaint")}
                                rows={3}
                                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                                placeholder="Describe symptoms..."
                            />
                        </div>
                    </div>
                </div>

                <div className="px-4 py-3 bg-gray-50 text-right sm:px-6 flex justify-end space-x-3">
                    <Link href="/registrations" className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
