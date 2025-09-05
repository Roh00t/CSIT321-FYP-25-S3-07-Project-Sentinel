import { Link } from 'react-router-dom';
import sentinelIcon from '../assets/sentinel-icon.svg';

export default function Navbar() {
  return (
    <nav className="flex items-center space-x-8 px-6 py-4 bg-gray-800 text-white text-lg font-semibold shadow-md sticky top-0 z-50">
      {/* Logo Section */}
      <div className="flex items-center space-x-3">
        <img 
          src={sentinelIcon}
          alt="Sentinel Logo" 
          className="h-10 w-auto" 
        />
      </div>

      {/* Navigation Links */}
      <div className="flex space-x-6">
        <Link to="/" className="hover:text-blue-300 transition">
          Home
        </Link>
        <Link to="/pricing" className="hover:text-blue-300 transition">
          Pricing
        </Link>
        <Link to="/register" className="hover:text-blue-300 transition">
          Register
        </Link>
        <Link to="/login" className="hover:text-blue-300 transition">
          Login
        </Link>
      </div>
    </nav>
  );
}