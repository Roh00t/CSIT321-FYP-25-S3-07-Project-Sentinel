// src/pages/AdminProfilePage.tsx

import { useState, useEffect } from 'react';
import { useUserSession } from '../hooks/useUserSession';
import LogoutButton from '../components/LogoutButton';
import { useNavigate } from 'react-router-dom';

interface AdminProfile {
  id: number;
  username: string;
  email: string;
  created_at: string | null;
}

export default function AdminProfilePage() {
  const { token } = useUserSession(); // ✅ Use hook
  const navigate = useNavigate();

  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      // ✅ If no token, don't fetch — just exit
      setLoading(false);
      return;
    }

    const abortController = new AbortController(); // ✅ For cleanup

    const fetchProfile = async () => {
      setLoading(true);
      let res;
      try {
        res = await fetch('http://127.0.0.1:5000/api/auth/admin/profile', {
          method: 'GET',
          signal: abortController.signal, // ✅ Connect to abort
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.msg || res.statusText);
        }

        const data = await res.json();
        setProfile(data);

        localStorage.setItem('username', data.username);
        localStorage.setItem('email', data.email);
        window.dispatchEvent(new Event('sessionchange'));

      } catch (err: any) {
        if (err.name === 'AbortError') {
          console.log('Fetch aborted (logout or nav away)');
          return;
        }
        console.error('Profile fetch error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();

    // ✅ Cleanup: abort fetch if component unmounts or token changes
    return () => {
      abortController.abort();
    };
  }, [token, navigate]);

  if (loading) return <p className="text-center">Loading profile...</p>;
  if (error) return <p className="text-red-600 text-center">Error: {error}</p>;
  if (!profile) return <p className="text-center">No data available.</p>;

  return (
    // ... rest of JSX (unchanged)
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
            <p className="text-xl font-mono text-blue-900">{profile.username}</p>
          </div>

          <div className="bg-gray-50 p-5 rounded-lg border">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Role</h3>
            <p className="text-xl text-gray-700">Administrator</p>
          </div>

          <div className="bg-gray-50 p-5 rounded-lg border">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Email</h3>
            <p className="text-xl text-gray-700">{profile.email}</p>
          </div>

          <div className="bg-gray-50 p-5 rounded-lg border">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Joined</h3>
            <p className="text-xl text-gray-700">
              {profile.created_at
                ? new Date(profile.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })
                : 'Unknown'}
            </p>
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