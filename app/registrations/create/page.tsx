import ContentWrapper from '@/components/layout/ContentWrapper';
import RegistrationForm from '@/components/registrations/RegistrationForm';

export default function CreateRegistrationPage() {
    return (
        <ContentWrapper title="New Registration">
            <div className="max-w-4xl mx-auto">
                <RegistrationForm />
            </div>
        </ContentWrapper>
    );
}
