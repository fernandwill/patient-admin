import Link from 'next/link';

const Sidebar = () => {
    return (
        <aside className="main-sidebar bg-gray-800 text-white min-h-screen w-64 flex-shrink-0 hidden md:flex flex-col transition-all duration-300">
            <div className="brand-link h-14 flex items-center justify-center border-b border-gray-700">
                <span className="text-xl font-bold">Patient Admin</span>
            </div>

            <div className="sidebar flex-1 overflow-y-auto">
                <nav className="mt-2 px-2">
                    <ul className="nav nav-pills nav-sidebar flex-col space-y-1" data-widget="treeview" role="menu" data-accordion="false">
                        <li className="nav-item">
                            <Link href="/" className="nav-link flex items-center px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-white rounded-md transition-colors">
                                <i className="nav-icon fas fa-tachometer-alt mr-3"></i>
                                <p>Dashboard</p>
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link href="/patients" className="nav-link flex items-center px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-white rounded-md transition-colors">
                                <i className="nav-icon fas fa-users mr-3"></i>
                                <p>Patients</p>
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link href="/registrations" className="nav-link flex items-center px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-white rounded-md transition-colors">
                                <i className="nav-icon fas fa-file-medical mr-3"></i>
                                <p>Registrations</p>
                            </Link>
                        </li>
                    </ul>
                </nav>
            </div>
        </aside>
    );
};

export default Sidebar;
