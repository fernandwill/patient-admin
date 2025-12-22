const Footer = () => {
    return (
        <footer className="main-footer bg-navbar border-t border-border py-4 px-6 text-sm text-gray-500 flex justify-between items-center transition-colors duration-300">
            <div className="float-right hidden sm:inline">
                <b>Version</b> 1.2.0
            </div>
            <div>
                <strong>Copyright &copy; 2025 <a href="#" className="text-blue-600 hover:underline">Patient Admin</a>.</strong> All rights reserved.
            </div>
        </footer>
    );
};

export default Footer;
