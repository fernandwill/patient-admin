const Footer = () => {
    return (
        <footer className="main-footer bg-white border-t border-gray-200 py-4 px-6 text-sm text-gray-500 flex justify-between items-center">
            <div className="float-right hidden sm:inline">
                <b>Version</b> 1.0.0
            </div>
            <div>
                <strong>Copyright &copy; 2025 <a href="#" className="text-blue-600 hover:underline">Patient Admin</a>.</strong> All rights reserved.
            </div>
        </footer>
    );
};

export default Footer;
