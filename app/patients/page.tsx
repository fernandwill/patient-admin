"use client";

import ContentWrapper from '@/components/layout/ContentWrapper';
import Link from 'next/link';
import SearchBar from '@/components/ui/SearchBar';
import PatientDetailModal from '@/components/patients/PatientDetailModal';
import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { formatRegTime, formatDoB } from '@/lib/formatters';

export default function PatientsPage() {
    type Patient = {
        id: number;
        medical_record_no: string;
        full_name: string;
        date_of_birth: string;
        gender: string | null;
        phone: string | null;
        address: string | null;
        photo_url: string | null;
        deleted_at: string | null;
        latest_reg_date: string | null;
    }

    const [patients, setPatients] = useState<Patient[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showDeleted, setShowDeleted] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

    const buildSearchParams = (raw: string) => {
        const trimmed = raw.trim();
        const params = new URLSearchParams();

        if (!trimmed) {
            return params;
        }

        params.set("queue", trimmed);
        return params;
    }

    useEffect(() => {
        const controller = new AbortController();

        const loadPatients = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const params = buildSearchParams(searchQuery);
                if (showDeleted) {
                    params.set("deletedOnly", "true");
                }
                const url = params.toString() ? `/api/patients?${params}` : "/api/patients";
                const response = await apiFetch(url, { signal: controller.signal });
                const payload = await response.json().catch(() => null);
                if (!response.ok) {
                    const message = payload?.error ?? `Request failed (${response.status})`;
                    throw new Error(message);
                }
                setPatients(Array.isArray(payload) ? payload : []);
            } catch (err) {
                const name = (err as { name?: string }).name;
                if (name === "AbortError") return;
                setError(err instanceof Error ? err.message : "Unknown error.");
            } finally {
                setIsLoading(false);
            }
        }

        loadPatients();

        return () => {
            controller.abort();
        }
    }, [searchQuery, showDeleted]);

    const handleSearch = (value: string) => {
        setSearchQuery(value);
    }

    const handleSoftDelete = async (id: number, deleted: boolean) => {
        const actionLabel = deleted ? "Delete" : "Restore";
        if (!window.confirm(`${actionLabel} this patient?`)) return;

        setError(null);

        try {
            const response = await apiFetch("/api/patients", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ id, deleted }),
            });

            const payload = await response.json().catch(() => null);

            if (!response.ok) {
                const message = payload?.error ?? `Request failed (${response.status})`;
                throw new Error(message);
            }
            setPatients((prev) => {
                // When deleting while viewing non-deleted, or restoring while viewing deleted-only, remove from list
                if ((!showDeleted && deleted === true) || (showDeleted && deleted === false)) {
                    return prev.filter((patient) => patient.id !== id);
                }
                return prev.map((patient) => (patient.id === id ? payload : patient))
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error.");
        }
    };

    const handleHardDelete = async (id: number) => {
        if (!window.confirm("Permanently delete this patient?")) return;
        if (!window.confirm("This action cannot be undone, are you sure?")) return;

        setError(null);

        try {
            const response = await apiFetch(`/api/patients?id=${id}`, {
                method: "DELETE",
            });

            const payload = await response.json().catch(() => null);

            if (!response.ok) {
                const message = payload?.error ?? `Request failed (${response.status})`;
                throw new Error(message);
            }
            setPatients((prev) => prev.filter((patient) => patient.id !== id));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error.");
        }
    };

    return (
        <>
            <ContentWrapper title="Patients">
                <div className="bg-card rounded shadow border border-border transition-colors duration-300">
                    <div className="p-4 border-b border-border flex justify-between items-center bg-navbar transition-colors duration-300">
                        <div className="flex space-x-2">
                            <SearchBar onSearch={handleSearch} placeholder="Search..." />
                            <label className="flex items-center gap-2 text-sm text-foreground">
                                <input type="checkbox" checked={showDeleted} onChange={(e) => setShowDeleted(e.target.checked)} />
                                Show only deleted patients
                            </label>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-border">
                            <thead className="bg-navbar transition-colors duration-300">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No RM</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DOB</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gender</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reg. Date</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-card divide-y divide-border transition-colors duration-300">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">Loading patients...</td>
                                    </tr>
                                ) : error ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-4 text-center text-sm text-red-600">{error}</td>
                                    </tr>
                                ) : patients.length > 0 ? (
                                    patients.map((patient) => (
                                        <tr key={patient.id} className="group hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors duration-200" onClick={() => setSelectedPatient(patient)}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">{patient.medical_record_no}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{patient.full_name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDoB(patient.date_of_birth)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{patient.gender ?? "-"}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatRegTime(patient.latest_reg_date)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                                {patient.deleted_at ? (
                                                    <>
                                                        <button type="button" className="text-green-600 hover:text-green-900 mr-3 cursor-pointer" onClick={() => handleSoftDelete(patient.id, false)}>
                                                            <i className="fas fa-undo"></i>
                                                        </button>
                                                        <button type="button" className="text-red-600 hover:text-red-900 cursor-pointer" onClick={() => handleHardDelete(patient.id)}>
                                                            <i className="fas fa-trash"></i>
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Link href={`/patients/${patient.id}`} className="text-blue-600 hover:text-blue-900 mr-3">
                                                            <i className="fas fa-edit"></i>
                                                        </Link>
                                                        <button type="button" className="text-red-600 hover:text-red-900 cursor-pointer" onClick={() => handleSoftDelete(patient.id, true)}>
                                                            <i className="fas fa-trash"></i>
                                                        </button>
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">No patients found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-4 border-t border-border flex justify-between items-center bg-navbar transition-colors duration-300">
                        <div className="text-sm text-gray-500">
                            Showing {patients.length} entries
                        </div>
                        <div className="flex space-x-1">
                            <button className="px-3 py-1 border border-border rounded text-sm disabled:opacity-50 text-foreground">Previous</button>
                            <button className="px-3 py-1 bg-blue-600 text-white border border-blue-600 rounded text-sm">1</button>
                            <button className="px-3 py-1 border border-border rounded text-sm disabled:opacity-50 text-foreground">Next</button>
                        </div>
                    </div>
                </div>
            </ContentWrapper>

            <PatientDetailModal
                patient={selectedPatient}
                isOpen={selectedPatient !== null}
                onClose={() => setSelectedPatient(null)}
            />
        </>
    );
}
