"use client";

import { useSidebar } from "@/context/SidebarContext";

const Navbar = () => {
    const { toggleSidebar } = useSidebar();

    return (
        <nav className="main-header navbar navbar-expand navbar-white navbar-light bg-navbar border-b border-border h-14 flex items-center justify-between px-4 transition-colors duration-300">
            <ul className="navbar-nav flex items-center space-x-4">
                <li className="nav-item">
                    <button
                        className="nav-link text-gray-500 hover:text-gray-700 focus:outline-none p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        onClick={toggleSidebar}
                        role="button"
                        aria-label="Toggle Sidebar"
                    >
                        <i className="fas fa-bars"></i>
                    </button>
                </li>
                <li className="nav-item hidden sm:inline-block">
                    <a href="/" className="nav-link text-gray-500 hover:text-gray-700 font-medium">Home</a>
                </li>
            </ul>

            <ul className="navbar-nav ml-auto flex items-center space-x-4">
                <li className="nav-item dropdown">
                    <a className="nav-link flex items-center text-gray-500 hover:text-gray-700" data-toggle="dropdown" href="#">
                        <i className="far fa-user mr-2"></i>
                        <span>Admin</span>
                    </a>
                </li>
            </ul>
        </nav>
    );
};

export default Navbar;
