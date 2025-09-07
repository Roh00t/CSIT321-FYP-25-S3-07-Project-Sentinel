// src/pages/AdminProfilePage.tsx
import { useUserSession } from '../hooks/useUserSession';
import LogoutButton from '../components/LogoutButton';
import { useNavigate } from 'react-router-dom';

export default function AdminProfilePage() {
  const { username } = useUserSession();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-12 px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-5xl font-extrabold text-blue-600">SENTINEL</h1>
        <p className="text-xl text-gray-700 mt-2">Admin Profile</p>
      </div>

      {/* Profile Card */}
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800">Profile Settings</h2>
          <LogoutButton />
        </div>

        {/* Profile Info */}
        <div className="space-y-6">
          <div className="bg-blue-50 p-5 rounded-lg border">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">Username</h3>
            <p className="text-xl font-mono text-blue-900">{username || 'Loading...'}</p>
          </div>

          {/* Placeholder for future fields */}
          <div className="bg-gray-50 p-5 rounded-lg border">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Role</h3>
            <p className="text-xl text-gray-700">Administrator</p>
          </div>

          <div className="bg-gray-50 p-5 rounded-lg border">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Joined</h3>
            <p className="text-xl text-gray-700">—</p>
            <p className="text-sm text-gray-500 mt-1">*(To be implemented)*</p>
          </div>
        </div>

        {/* Edit Profile Button */}
        <div className="mt-8 text-center">
            <button
            onClick={() => navigate('/admin/profile/edit')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow transition duration-200 transform hover:scale-[1.02]"
            >
            Edit Profile
            </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-16 text-center text-gray-500 text-sm">
        © {new Date().getFullYear()} SENTINEL | Admin Profile
      </footer>
    </div>
  );
}