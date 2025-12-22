"use client";

import Modal from "@/components/ui/Modal";
import { formatDoB } from "@/lib/formatters";

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
};

interface PatientDetailModalProps {
    patient: Patient | null;
    isOpen: boolean;
    onClose: () => void;
}

const PatientDetailModal = ({ patient, isOpen, onClose }: PatientDetailModalProps) => {
    if (!patient) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Patient Details">
            <div className="space-y-4">
                {/* Profile Image */}
                <div className="flex justify-center">
                    {patient.photo_url ? (
                        <img
                            src={patient.photo_url}
                            alt={patient.full_name}
                            className="w-24 h-24 rounded-full object-cover border-2 border-border"
                        />
                    ) : (
                        <div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center border-2 border-border">
                            <i className="fas fa-user text-3xl text-slate-500"></i>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-500 uppercase">Medical Record No</label>
                        <p className="mt-1 text-sm text-foreground font-medium">{patient.medical_record_no}</p>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 uppercase">Full Name</label>
                        <p className="mt-1 text-sm text-foreground font-medium">{patient.full_name}</p>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 uppercase">Date of Birth</label>
                        <p className="mt-1 text-sm text-foreground">{formatDoB(patient.date_of_birth)}</p>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 uppercase">Gender</label>
                        <p className="mt-1 text-sm text-foreground">{patient.gender ?? "-"}</p>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 uppercase">Phone</label>
                        <p className="mt-1 text-sm text-foreground">{patient.phone ?? "-"}</p>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 uppercase">Latest Registration</label>
                        <p className="mt-1 text-sm text-foreground">{formatDoB(patient.latest_reg_date)}</p>
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-medium text-slate-500 uppercase">Address</label>
                    <p className="mt-1 text-sm text-foreground">{patient.address ?? "-"}</p>
                </div>
                {patient.deleted_at && (
                    <div className="p-3 bg-red-900/20 border border-red-900/50 rounded">
                        <p className="text-sm text-red-400">
                            <i className="fas fa-trash mr-2"></i>
                            Deleted on {formatDoB(patient.deleted_at)}
                        </p>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default PatientDetailModal;
