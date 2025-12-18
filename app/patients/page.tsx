"use client";

import ContentWrapper from '@/components/layout/ContentWrapper';
import Link from 'next/link';
import SearchBar from '@/components/ui/SearchBar';
import { useState, useEffect } from 'react';

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
    }

    const [patients, setPatients] = useState<Patient[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showDeleted, setShowDeleted] = useState(false);

    const buildSearchParams = (raw: string) => {
        const trimmed = raw.trim();
        const params = new URLSearchParams();

        if (!trimmed) {
            return params;
        }

        const isDate = /^\d{4}-\d{2}-\d{2}$/.test(trimmed);
        const isDigits = /^\d+$/.test(trimmed);

        if (isDate) {
            params.set("dob", trimmed);
            return params;
        }

        if (isDigits) {
            params.set("rm", trimmed);
            return params;
        }
        params.set("name", trimmed);
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
                    params.set("includeDeleted", "true");
                }
                const url = params.toString() ? `/api/patients?${params}` : "/api/patients";
                const response = await fetch(url, {signal: controller.signal});
                const payload = await response.json().catch(() => null);
                if (!response.ok) {
                    const message = payload?.error ?? `Request failed (${response.status})`;
                    throw new Error(message);
                }
                setPatients(Array.isArray(payload) ? payload : []);
            } catch (err) {
                const name = (err as {name?: string}).name;
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
        const actionLabel = deleted ? "Soft delete" : "Restore";
        if (!window.confirm(`${actionLabel} this patient?`)) return;

        setError(null);

        try {
            const response = await fetch("/api/patients", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({id, deleted}),
            });

            const payload = await response.json().catch(() => null); 

            if (!response.ok) {
                const message = payload?.error ?? `Request failed (${response.status})`;
                throw new Error(message);
            }
            setPatients((prev) => {
                if (!showDeleted && deleted === true) { 
                return prev.filter((patient) => patient.id !== id);
                }
                return prev.map((patient) => (patient.id === id ? payload : patient))
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error.");
        }
    };

    return (
        <ContentWrapper title="Patients">
            <div className="bg-white rounded shadow">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-800">Patient List</h3>
                    <div className="flex space-x-2">
                        <SearchBar onSearch={handleSearch} placeholder="Search Name, RM, DOB..." />
                        <label className="flex items-center gap-2 text-sm text-gray-700">
                            <input type="checkbox" checked={showDeleted} onChange={(e) => setShowDeleted(e.target.checked)} />
                            Show deleted patients
                        </label>
                        <Link href="/patients/create" className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-700 transition-colors flex items-center">
                            <i className="fas fa-plus mr-1"></i> Add New
                        </Link>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No RM</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DOB</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gender</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">Loading patients...</td>
                                </tr>
                            ): error ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-red-600">{error}</td>
                                </tr>
                            ) : patients.length > 0 ? (
                                patients.map((patient) => (
                                    <tr key={patient.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{patient.medical_record_no}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{patient.full_name}</td>                                                                                    
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{patient.date_of_birth}</td>                                                                                
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{patient.gender ?? "-"}</td>                                                                                
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{patient.address ?? "-"}</td>                                                                               
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"> 
                                            {patient.deleted_at ? (
                                                <button type="button" className="text-green-600 hover:text-green-900" onClick={() => handleSoftDelete(patient.id, false)}>
                                                    <i className="fas fa-undo"></i>
                                                </button>
                                            ) : (
                                                <>
                                                <Link href={`/patients/${patient.id}`} className="text-blue-600 hover:text-blue-900 mr-3">
                                                    <i className="fas fa-edit"></i>
                                                </Link>
                                                <button type="button" className="text-red-600 hover:text-red-900" onClick={() => handleSoftDelete(patient.id, true)}>
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

                <div className="p-4 border-t border-gray-200 flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                        Showing {patients.length} entries
                    </div>
                    <div className="flex space-x-1">
                        <button className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50">Previous</button>
                        <button className="px-3 py-1 bg-blue-600 text-white border border-blue-600 rounded text-sm">1</button>
                        <button className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50">Next</button>
                    </div>
                </div>
            </div>
        </ContentWrapper>
    );
}
