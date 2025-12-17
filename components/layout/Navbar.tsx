const Navbar = () => {
    return (
        <nav className="main-header navbar navbar-expand navbar-white navbar-light bg-white border-b border-gray-200 h-14 flex items-center justify-between px-4">
            <ul className="navbar-nav flex items-center space-x-4">
                <li className="nav-item">
                    <button className="nav-link text-gray-500 hover:text-gray-700 focus:outline-none" data-widget="pushmenu" role="button">
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
