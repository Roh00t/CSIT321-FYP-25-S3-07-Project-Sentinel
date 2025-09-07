// src/components/Navbar.tsx
import { Link } from 'react-router-dom';
import { useUserSession } from '../hooks/useUserSession';
import LogoutButton from './LogoutButton';
import sentinelIcon from '../assets/sentinel-icon.svg';

export default function Navbar() {
  const { isAuthenticated, user_type } = useUserSession();

  // Debug (optional — remove later)
  console.log('User Type:', user_type);
  console.log('Is Authenticated:', isAuthenticated);

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
        {/* NOT LOGGED IN */}
        {!isAuthenticated && (
          <>
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
          </>
        )}

        {/* LOGGED IN AS APP USER */}
        {isAuthenticated && user_type === 'app_user' && (
          <>
            <Link to="/" className="hover:text-blue-300 transition">
              Home
            </Link>
            <Link to="/pricing" className="hover:text-blue-300 transition">
              Pricing
            </Link>
            <Link to="/app/dashboard" className="hover:text-blue-300 transition">
              Dashboard
            </Link>
            <Link to="/app/alerts" className="hover:text-blue-300 transition">
              Alerts
            </Link>
          </>
        )}

        {/* LOGGED IN AS ADMIN */}
        {isAuthenticated && user_type === 'admin' && (
          <>
            <Link to="/admin/dashboard" className="hover:text-blue-300 transition">
              Dashboard
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}