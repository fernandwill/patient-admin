"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { apiFetch } from "@/lib/api";

interface PatientFormProps {
    initialData?: any;
    isEdit?: boolean;
}

type PatientFormValues = {
    name: string;
    dob: string;
    gender: string;
    address: string;
    phone: string;
}

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const PatientForm = ({ initialData, isEdit = true }: PatientFormProps) => {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [photoUrl, setPhotoUrl] = useState<string | null>(initialData?.photoUrl ?? null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const { register, handleSubmit, formState: { errors } } = useForm<PatientFormValues>({
        defaultValues: {
            name: initialData?.name ?? "",
            dob: initialData?.dob ?? "",
            gender: initialData?.gender ?? "",
            address: initialData?.address ?? "",
            phone: initialData?.phone ?? "",
        },
    });

    const onSubmit = async (values: PatientFormValues) => {
        setIsSubmitting(true);
        setErrorMessage(null);
        setUploadError(null); // Clear any previous upload errors when submitting the whole form

        try {
            if (!isEdit) {
                throw new Error("Create patient is disabled. Use Registration form.");
            }
            if (!initialData?.id) {
                throw new Error("Missing patient id.");
            }
            const payload: Record<string, unknown> = {
                id: initialData.id,
                fullName: values.name.trim(),
                dateOfBirth: values.dob,
                gender: values.gender ? values.gender.trim() : null,
                address: values.address.trim() ? values.address.trim() : null,
                phone: values.phone.trim() ? values.phone.trim() : null,
                photoUrl: photoUrl ?? null,
            };

            const response = await apiFetch("/api/patients", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const body = await response.json().catch(() => null);
                const message = body?.error ?? "Failed to save patient.";
                throw new Error(message);
            }

            router.push("/patients");
        } catch (err) {
            setErrorMessage(err instanceof Error ? err.message : "Unknown error.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadError(null);
        setErrorMessage(null); // Clear form errors when starting a new upload

        if (!ALLOWED_PHOTO_TYPES.has(file.type)) {
            setUploadError("Only JPEG, PNG, or WEBP is allowed.");
            e.target.value = "";
            return;
        }

        if (file.size > MAX_IMAGE_SIZE) {
            setUploadError("Photo size must be less than 5MB.");
            e.target.value = "";
            return;
        }

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await apiFetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            const payload = await response.json().catch(() => null);

            if (!response.ok) {
                const message = payload?.error ?? `Failed to upload photo. (${response.status})`;
                throw new Error(message);
            }

            setPhotoUrl(payload.url ?? null);
        } catch (err) {
            setUploadError(err instanceof Error ? err.message : "Unknown error.");
        } finally {
            setIsUploading(false);
            e.target.value = "";
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <div className="bg-white rounded shadow-sm">
                <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Edit Patient</h3>
                    <p className="mt-1 text-sm text-gray-500">Edit patient information.</p>
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
                        <div className="mt-1 grid grid-cols-1 gap-4 sm:grid-cols-6">
                            <div className="sm:col-span-6 flex flex-col items-center">
                                <label className="block text-sm font-medium text-gray-700">Profile Photo</label>
                                <div className="mt-3 flex flex-col items-center gap-3">
                                    <span className="inline-block h-24 w-24 rounded-full overflow-hidden bg-gray-100 border border-gray-200">
                                        {photoUrl ? (
                                            <img src={photoUrl} alt="patient_pp" className="h-full w-full object-cover" />
                                        ) : (
                                            <svg className="h-full w-full text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 0 018 0z" />
                                            </svg>
                                        )}
                                    </span>
                                    <label className={`inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 ${isUploading ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}>
                                        <input type="file" accept="image/jpeg, image/png, image/webp" className="hidden" onChange={handlePhotoChange} disabled={isUploading} />
                                        {isUploading ? "Uploading..." : "Upload"}
                                    </label>
                                </div>
                                {uploadError ? (
                                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-600 text-xs flex items-center gap-2">
                                        <i className="fas fa-info-circle"></i>
                                        <span>{uploadError}</span>
                                    </div>
                                ) : null}
                            </div>

                            <div className="sm:col-span-3">
                                <label className="block text-sm font-medium text-gray-700">Medical Record No.</label>
                                <input
                                    type="text"
                                    value={(initialData?.medicalRecordNo ?? "").toString()}
                                    disabled
                                    className="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 p-2 text-sm text-gray-400"
                                />
                            </div>

                            <div className="sm:col-span-3">
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name <span className="text-red-600">*</span></label>
                                <div className="mt-1">
                                    <input
                                        type="text"
                                        id="name"
                                        {...register("name", { required: "Full name is required." })}
                                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 text-gray-800 placeholder:text-gray-400 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                                        placeholder="John Doe"
                                    />
                                    {errors.name ? (
                                        <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
                                    ) : null}
                                </div>
                            </div>

                            <div className="sm:col-span-3">
                                <label htmlFor="dob" className="block text-sm font-medium text-gray-700">Date of Birth <span className="text-red-600">*</span></label>
                                <div className="mt-1">
                                    <input
                                        type="date"
                                        id="dob"
                                        {...register("dob", { required: "Date of birth is required." })}
                                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 text-gray-800 placeholder:text-gray-400 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                                    />
                                    {errors.dob ? (
                                        <p className="mt-1 text-xs text-red-600">{errors.dob.message}</p>
                                    ) : null}
                                </div>
                            </div>

                            <div className="sm:col-span-3">
                                <label htmlFor="gender" className="block text-sm font-medium text-gray-700">Gender</label>
                                <div className="mt-1">
                                    <select
                                        id="gender"
                                        {...register("gender")}
                                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 text-gray-800 placeholder:text-gray-400 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                                    >
                                        <option value="">Select Gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                    </select>
                                    {errors.gender ? (
                                        <p className="mt-1 text-xs text-red-600">{errors.gender.message}</p>
                                    ) : null}
                                </div>
                            </div>

                            <div className="sm:col-span-6">
                                <label htmlFor="address" className="block text-sm font-medium text-gray-700">Address</label>
                                <div className="mt-1">
                                    <textarea
                                        id="address"
                                        {...register("address")}
                                        rows={3}
                                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 text-gray-800 placeholder:text-gray-400 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                                        placeholder="Address..."
                                    />
                                    {errors.address ? (
                                        <p className="mt-1 text-xs text-red-600">{errors.address.message}</p>
                                    ) : null}
                                </div>
                            </div>

                            <div className="sm:col-span-3">
                                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone Number</label>
                                <div className="mt-1">
                                    <input
                                        type="tel"
                                        id="phone"
                                        {...register("phone", {
                                            validate: (value) => {
                                                if (!value || !value.trim()) return true;
                                                if (!/^\+?\d+$/.test(value.trim())) {
                                                    return "Invalid phone number format."
                                                }
                                                const phoneNoLength = value.trim().startsWith("+") ? value.trim().slice(1) : value.trim();
                                                if (phoneNoLength.length < 8 || phoneNoLength.length > 15) {
                                                    return "Phone number must be between 8 and 15 digits."
                                                }
                                                return true;
                                            }
                                        })}
                                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 text-gray-800 placeholder:text-gray-400 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                                        placeholder="+62 812 3456 7890"
                                    />
                                    {errors.phone ? (
                                        <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                <div className="px-4 py-3 bg-gray-50 text-right sm:px-6 flex justify-end space-x-3">
                    <Link href="/patients" className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Saving..." : "Save"}
                    </button>
                </div>
            </div>
        </form>
    );
};

export default PatientForm;
