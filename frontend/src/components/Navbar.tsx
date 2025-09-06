// src/components/Navbar.tsx
import { Link } from 'react-router-dom';
<<<<<<< HEAD
import { useEffect, useState } from 'react';
import axios from 'axios';
import sentinelIcon from '../assets/sentinel-icon.svg';

export default function Navbar() {
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token'); // JWT stored after login
    if (token) {
    axios.get('http://localhost:5000/api/auth/profile', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
      console.log('Profile response:', res.data);
      setUsername(res.data.username); // match your API response key
    })
    .catch(err => {
      console.error('Profile fetch error:', err.response?.data || err);
      setUsername(null);
    });
  }}, []);
=======
import { useUserSession } from '../hooks/useUserSession';
import sentinelIcon from '../assets/sentinel-icon.svg';

export default function Navbar() {
  const { isAuthenticated, user_type } = useUserSession();

  // Debug (optional — remove later)
  console.log('User Type:', user_type);
  console.log('Is Authenticated:', isAuthenticated);
>>>>>>> 113e087731a23ec12e6bf1997c7110ef0d1c44d4

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
<<<<<<< HEAD
        <Link to="/" className="hover:text-blue-300 transition">
          Home
        </Link>
        <Link to="/pricing" className="hover:text-blue-300 transition">
          Pricing
        </Link>

        {username ? (
          <span>{username}'s profile</span>
        ) : (
          <>
=======
        {/* NOT LOGGED IN */}
        {!isAuthenticated && (
          <>
            <Link to="/" className="hover:text-blue-300 transition">
              Home
            </Link>
            <Link to="/pricing" className="hover:text-blue-300 transition">
              Pricing
            </Link>
>>>>>>> 113e087731a23ec12e6bf1997c7110ef0d1c44d4
            <Link to="/register" className="hover:text-blue-300 transition">
              Register
            </Link>
            <Link to="/login" className="hover:text-blue-300 transition">
              Login
            </Link>
          </>
        )}
<<<<<<< HEAD
=======

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
>>>>>>> 113e087731a23ec12e6bf1997c7110ef0d1c44d4
      </div>
    </nav>
  );
}
