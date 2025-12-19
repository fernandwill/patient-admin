"use client";

import Modal from "@/components/ui/Modal";

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

const formatDate = (value: string | null) => {
    if (!value) return "-";
    const date = new Date(value);
    const pad2 = (n: number) => String(n).padStart(2, "0");
    if (Number.isNaN(date.getTime())) return value;
    return `${pad2(date.getDate())}-${pad2(date.getMonth() + 1)}-${date.getFullYear()}`;
};

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
                            className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                        />
                    ) : (
                        <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                            <i className="fas fa-user text-3xl text-gray-400"></i>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase">Medical Record No</label>
                        <p className="mt-1 text-sm text-gray-900">{patient.medical_record_no}</p>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase">Full Name</label>
                        <p className="mt-1 text-sm text-gray-900">{patient.full_name}</p>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase">Date of Birth</label>
                        <p className="mt-1 text-sm text-gray-900">{formatDate(patient.date_of_birth)}</p>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase">Gender</label>
                        <p className="mt-1 text-sm text-gray-900">{patient.gender ?? "-"}</p>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase">Phone</label>
                        <p className="mt-1 text-sm text-gray-900">{patient.phone ?? "-"}</p>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase">Latest Registration</label>
                        <p className="mt-1 text-sm text-gray-900">{formatDate(patient.latest_reg_date)}</p>
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase">Address</label>
                    <p className="mt-1 text-sm text-gray-900">{patient.address ?? "-"}</p>
                </div>
                {patient.deleted_at && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded">
                        <p className="text-sm text-red-700">
                            <i className="fas fa-trash mr-2"></i>
                            Deleted on {formatDate(patient.deleted_at)}
                        </p>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default PatientDetailModal;
