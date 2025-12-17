import ContentWrapper from '@/components/layout/ContentWrapper';
import PatientForm from '@/components/patients/PatientForm';

export default function CreatePatientPage() {
    return (
        <ContentWrapper title="Add New Patient">
            <div className="max-w-4xl mx-auto">
                <PatientForm />
            </div>
        </ContentWrapper>
    );
}
