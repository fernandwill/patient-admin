"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSidebar } from '@/context/SidebarContext';

const Sidebar = () => {
    const pathname = usePathname();
    const { isCollapsed } = useSidebar();

    const navItems = [
        { href: "/", label: "Dashboard", icon: "fas fa-tachometer-alt" },
        { href: "/registrations", label: "Patient Registrations", icon: "fas fa-file-medical" },
        { href: "/patients", label: "Patient Lists", icon: "fas fa-users" },
    ];

    return (
        <aside className={`main-sidebar bg-sidebar text-white min-h-screen flex-shrink-0 hidden md:flex flex-col transition-all duration-300 shadow-xl border-r border-border ${isCollapsed ? "w-20" : "w-64"
            }`}>
            <div className="brand-link h-14 flex items-center justify-center border-b border-border overflow-hidden relative">
                {!isCollapsed ? (
                    <span className="text-xl font-bold tracking-tight transition-all duration-300 whitespace-nowrap">
                        Patient Admin
                    </span>
                ) : (
                    <span className="text-xl font-bold text-blue-500 transition-all duration-300">
                        PA
                    </span>
                )}
            </div>

            <div className="sidebar flex-1 overflow-y-auto overflow-x-hidden">
                <nav className="mt-4 px-2">
                    <ul className="nav nav-sidebar flex-col space-y-1">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <li key={item.href} className="nav-item">
                                    <Link
                                        href={item.href}
                                        title={isCollapsed ? item.label : ""}
                                        className={`nav-link flex items-center rounded-md transition-all duration-200 group h-12 ${isActive
                                            ? "bg-blue-600 text-white shadow-md"
                                            : "text-gray-400 hover:bg-gray-700 hover:text-white"
                                            } ${isCollapsed ? "justify-center px-0" : "px-4"}`}
                                    >
                                        <div className={`flex items-center justify-center flex-shrink-0 ${isCollapsed ? "w-full" : "w-8 mr-3"}`}>
                                            <i className={`nav-icon ${item.icon} text-lg transition-transform group-hover:scale-110 ${isActive ? "text-white" : "text-gray-500 group-hover:text-white"
                                                }`}></i>
                                        </div>
                                        {!isCollapsed && (
                                            <p className="font-medium whitespace-nowrap transition-all duration-300 opacity-100 flex-1">
                                                {item.label}
                                            </p>
                                        )}
                                        {!isCollapsed && isActive && (
                                            <div className="w-1.5 h-1.5 bg-white rounded-full shadow-sm"></div>
                                        )}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>
            </div>
        </aside>
    );
};

export default Sidebar;
