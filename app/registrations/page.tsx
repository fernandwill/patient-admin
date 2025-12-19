"use client";
import {useState, useEffect} from "react";
import ContentWrapper from "@/components/layout/ContentWrapper";
import Link from "next/link";
import SearchBar from "@/components/ui/SearchBar";

export default function RegistrationsPage() {
    type Registration = {
        id: number;
        registration_no: string;
        registration_date: string;
        patient_id: number;
        full_name: string;
        medical_record_no: string;
        date_of_birth: string | null;
        notes: string | null;
        deleted_at: string | null;
    }

    const [registrations, setRegistrations] = useState<Registration[]>([]);
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

        const isDigits = /^\d+$/.test(trimmed);

        if (isDigits) {
            if (trimmed.length === 12) {
                params.set("reg", trimmed);
            } else {
                if (trimmed.length === 9) {
                    params.set("rm", trimmed);
                }
            }
            return params;
        }
        params.set("name", trimmed);
        return params;
    }

    useEffect(() => {
        const controller = new AbortController();

        const loadRegistrations = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const params = buildSearchParams(searchQuery);
                if (showDeleted) {
                    params.set("deletedOnly", "true");
                }
                const url = params.toString() ? `/api/registrations?${params}` : "/api/registrations";
                const response = await fetch(url, {signal: controller.signal});
                const payload = await response.json().catch(() => null);
                if (!response.ok) {
                    const message = payload?.error ?? `Request failed (${response.status})`;
                    throw new Error(message);
                }
                setRegistrations(Array.isArray(payload) ? payload : []);
            } catch (err) {
                const name = (err as {name?: string}).name;
                if (name === "AbortError") return;
                setError(err instanceof Error ? err.message : "Unknown error.");
            } finally {
                setIsLoading(false);
            }
        }

        loadRegistrations();

        return () => controller.abort();
    }, [searchQuery, showDeleted])

    const handleSearch = (query: string) => {
        setSearchQuery(query);
    };

    const handleSoftDelete = async (id: number, deleted: boolean) => {
        const actionLabel = deleted ? "Soft delete" : "Restore";
        if (!window.confirm(`${actionLabel} this registration?`)) return;

        setError(null);

        try {
            const response = await fetch("/api/registrations", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({id, deleted})
            });

            const payload = await response.json().catch(() => null);

            if (!response.ok) {
                const message = payload?.error ?? `Request failed (${response.status})`;
                throw new Error(message);
            }
            setRegistrations((prev) => {
                if (!showDeleted && deleted === true) {
                    return prev.filter((reg) => reg.id !== id);
                }
                return prev.map((reg) => (reg.id === id ? {...reg, ...payload} : reg));
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error.");
        }
    };

    // format DD-MM-YYYY HH:MM
    const formatRegTime = (value: string) => {
        const date = new Date(value);
        const pad2 = (n: number) => String(n).padStart(2, "0");
        if (Number.isNaN(date.getTime())) return value;
        return `${pad2(date.getDate())}-${pad2(date.getMonth() + 1)}-${date.getFullYear()} ${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
    }

    const formatDoB = (value: string | null) => {
        if (!value) return "-";
        const date = new Date(value);
        const pad2 = (n: number) => String(n).padStart(2, "0");
        if (Number.isNaN(date.getTime())) return value;
        return `${pad2(date.getDate())}-${pad2(date.getMonth() + 1)}-${date.getFullYear()}`;
    }

    return (
        <ContentWrapper title="Registrations">
            <div className="bg-white rounded shadow">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-800">Registration List</h3>
                    <div className="flex space-x-2">
                        <SearchBar onSearch={handleSearch} placeholder="Search Reg No, Name, RM..." />
                        <label className="flex items-center gap-2 text-sm text-gray-700">
                            <input type="checkbox" checked={showDeleted} onChange={(e) => setShowDeleted(e.target.checked)} />
                            Show only deleted registrations
                        </label>
                        <Link href="/registrations/create" className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-700 transition-colors flex items-center">
                            <i className="fas fa-plus mr-1"></i> Register
                        </Link>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reg No</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reg Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DOB</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No RM</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">Loading registrations...</td>
                                </tr>
                            ): error ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-red-600">{error}</td>
                                </tr>
                            ): registrations.length > 0 ? (
                                registrations.map((reg) => (
                                    <tr key={reg.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">{reg.registration_no}</td>                                                                          
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatRegTime(reg.registration_date)}</td>                                                                                    
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{reg.full_name}</td>                                                                                            
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDoB(reg.date_of_birth)}</td>                                                                                    
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{reg.medical_record_no}</td>                                                                                         
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"> 
                                            {reg.deleted_at ? (
                                                <button type="button" className="text-green-600 hover:text-green-900" onClick={() => handleSoftDelete(reg.id, false)}>
                                                    <i className="fas fa-undo"></i>
                                                </button>
                                            ) : (
                                                <>
                                                <Link href={`/registrations/${reg.id}`} className="text-blue-600 hover:text-blue-900 mr-3">
                                                    <i className="fas fa-edit"></i>
                                                </Link>
                                                <button type="button" className="text-red-600 hover:text-red-900" onClick={() => handleSoftDelete(reg.id, true)}>
                                                    <i className="fas fa-trash"></i>
                                                </button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">No registrations found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="p-4 border-t border-gray-200 flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                        Showing {registrations.length} entries
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
