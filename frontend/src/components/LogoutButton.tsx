// src/components/LogoutButton.tsx
import { useNavigate } from 'react-router-dom';

// Helper to notify session change
const notifySessionChange = () => {
  window.dispatchEvent(new Event('sessionchange'));
};

export default function LogoutButton() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_type');
    localStorage.removeItem('username');
    localStorage.removeItem('email');

    // Notify components
    notifySessionChange();

    navigate('/login', { replace: true });
  };

  return (
    <button
      onClick={handleLogout}
      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow transition duration-200 transform hover:scale-[1.02]"
    >
      Logout
    </button>
  );
}