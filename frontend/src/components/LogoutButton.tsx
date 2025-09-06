// src/components/LogoutButton.tsx
import { useNavigate } from 'react-router-dom';
import notifySessionChange from '../utils/notifySessionChange';

export default function LogoutButton() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_type');
    localStorage.removeItem('username');

    // Notify other tabs/components of session change
    notifySessionChange();

    navigate('/login');
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