"use client";
import { useState } from "react";
import { exportToExcel, exportToPDF } from "@/lib/export";
import { apiFetch } from "@/lib/api";
import Modal from "@/components/ui/Modal";

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
        <Modal isOpen={isOpen} onClose={onClose} title={`Export to ${type}`}>
            <div className="space-y-4">
                {error && (
                    <div className="p-3 bg-red-900/20 text-red-400 text-sm rounded border border-red-900/50 flex items-center gap-3">
                        <i className="fas fa-exclamation-circle"></i>
                        <span className="flex-1">{error}</span>
                        <button type="button" onClick={() => setError(null)} className="text-red-400 hover:text-red-300">
                            <i className="fas fa-times"></i>
                        </button>
                    </div>
                )}

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">From Date & Time</label>
                    <input
                        type="datetime-local"
                        className="w-full border border-border bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-foreground placeholder:text-slate-500 transition-colors"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        onClick={(e) => e.currentTarget.showPicker()}
                    />
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">To Date & Time</label>
                    <input
                        type="datetime-local"
                        className="w-full border border-border bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-foreground placeholder:text-slate-500 transition-colors"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        onClick={(e) => e.currentTarget.showPicker()}
                    />
                </div>

                <p className="text-xs text-slate-500 italic">
                    Leave blank to export all records (subject to limit).
                </p>

                <div className="pt-4 border-t border-border flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-foreground hover:bg-slate-800 rounded-md transition-colors border border-border"
                        disabled={isExporting}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleExport}
                        className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors flex items-center shadow-sm ${type === "Excel" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
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
        </Modal>
    );
}
