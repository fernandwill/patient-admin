"use client";
import { useState } from "react";
import { exportToExcel, exportToPDF } from "@/lib/export";
import { apiFetch } from "@/lib/api";

interface ExportModalProps {
    type: "Excel" | "PDF";
    isOpen: boolean;
    onClose: () => void;
}

export default function ExportModal({ type, isOpen, onClose }: ExportModalProps) {
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [isExporting, setIsExporting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleExport = async () => {
        setIsExporting(true);
        setError(null);

        try {
            const params = new URLSearchParams();
            if (startDate) params.set("start", startDate);
            if (endDate) params.set("end", endDate);

            const url = params.toString() ? `/api/registrations?${params}` : "/api/registrations";
            const response = await apiFetch(url);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to fetch data for export");
            }

            const fileName = `registrations_${new Date().toISOString().split('T')[0]}`;

            if (type === "Excel") {
                exportToExcel(data, fileName);
            } else {
                exportToPDF(data, fileName, "REGISTRATION REPORT");
            }

            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred during export");
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                    <h3 className="text-lg font-semibold text-gray-800">Export to {type}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 text-red-700 text-sm rounded border border-red-200 flex items-center gap-3">
                            <i className="fas fa-exclamation-circle"></i>
                            <span className="flex-1">{error}</span>
                            <button type="button" onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">From Date & Time</label>
                        <input
                            type="datetime-local"
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">To Date & Time</label>
                        <input
                            type="datetime-local"
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>

                    <p className="text-xs text-gray-500 italic">
                        Leave blank to export all records (subject to limit).
                    </p>
                </div>

                <div className="p-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                        disabled={isExporting}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleExport}
                        className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors flex items-center ${type === "Excel" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
                            }`}
                        disabled={isExporting}
                    >
                        {isExporting ? (
                            <>
                                <i className="fas fa-spinner fa-spin mr-2"></i> Exporting...
                            </>
                        ) : (
                            <>
                                <i className={`fas ${type === "Excel" ? "fa-file-excel" : "fa-file-pdf"} mr-2`}></i> Export
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
