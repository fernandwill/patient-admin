import { ReactNode } from 'react';

interface ContentWrapperProps {
    children: ReactNode;
    title?: string;
}

const ContentWrapper = ({ children, title }: ContentWrapperProps) => {
    return (
        <div className="content-wrapper flex-1 bg-gray-100 flex flex-col min-h-0 overflow-hidden">
            {title && (
                <div className="content-header bg-white shadow-sm py-4 px-6 mb-4">
                    <div className="container-fluid">
                        <div className="row mb-2 flex justify-between items-center">
                            <div className="col-sm-6">
                                <h1 className="m-0 text-2xl font-semibold text-gray-800">{title}</h1>
                            </div>
                            <div className="col-sm-6">
                                <ol className="breadcrumb float-sm-right flex space-x-2 text-sm text-gray-500">
                                    <li className="breadcrumb-item"><a href="/" className="text-blue-600 hover:underline">Home</a></li>
                                    <li className="breadcrumb-item active text-gray-400">/ {title}</li>
                                </ol>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <section className="content flex-1 overflow-y-auto p-6">
                <div className="container-fluid h-full">
                    {children}
                </div>
            </section>
        </div>
    );
};

export default ContentWrapper;
