"use client";

import Modal from "@/components/ui/Modal";

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
};

interface RegistrationDetailModalProps {
    registration: Registration | null;
    isOpen: boolean;
    onClose: () => void;
}

const formatDateTime = (value: string | null) => {
    if (!value) return "-";
    const date = new Date(value);
    const pad2 = (n: number) => String(n).padStart(2, "0");
    if (Number.isNaN(date.getTime())) return value;
    return `${pad2(date.getDate())}-${pad2(date.getMonth() + 1)}-${date.getFullYear()} ${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
};

const formatDate = (value: string | null) => {
    if (!value) return "-";
    const date = new Date(value);
    const pad2 = (n: number) => String(n).padStart(2, "0");
    if (Number.isNaN(date.getTime())) return value;
    return `${pad2(date.getDate())}-${pad2(date.getMonth() + 1)}-${date.getFullYear()}`;
};

const RegistrationDetailModal = ({ registration, isOpen, onClose }: RegistrationDetailModalProps) => {
    if (!registration) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Registration Details">
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase">Registration No</label>
                        <p className="mt-1 text-sm text-gray-900">{registration.registration_no}</p>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase">Registration Date</label>
                        <p className="mt-1 text-sm text-gray-900">{formatDateTime(registration.registration_date)}</p>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase">Patient Name</label>
                        <p className="mt-1 text-sm text-gray-900">{registration.full_name}</p>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase">Medical Record No</label>
                        <p className="mt-1 text-sm text-gray-900">{registration.medical_record_no}</p>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase">Date of Birth</label>
                        <p className="mt-1 text-sm text-gray-900">{formatDate(registration.date_of_birth)}</p>
                    </div>
                </div>
                {registration.notes && (
                    <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase">Notes</label>
                        <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{registration.notes}</p>
                    </div>
                )}
                {registration.deleted_at && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded">
                        <p className="text-sm text-red-700">
                            <i className="fas fa-trash mr-2"></i>
                            Deleted on {formatDateTime(registration.deleted_at)}
                        </p>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default RegistrationDetailModal;
