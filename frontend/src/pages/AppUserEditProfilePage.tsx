// src/pages/AppUserEditProfilePage.tsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserSession } from '../hooks/useUserSession';

interface EditFormData {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  confirmPassword: string;
}

export default function AppUserEditProfilePage() {
  const { token } = useUserSession();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<EditFormData>({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    confirmPassword: '',
  });

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  // Load current profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const res = await fetch('http://127.0.0.1:5000/api/auth/appuser/profile', {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!res.ok) throw new Error('Failed to load');

        const data = await res.json();
        setFormData({
          username: data.username || '',
          email: data.email || '',
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          password: '',
          confirmPassword: '',
        });
      } catch (err) {
        setError(true);
        setMessage('Could not load profile');
        setTimeout(() => navigate('/login'), 1500);
      }
    };

    fetchProfile();
  }, [token, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    // Validate required fields
    if (!formData.username.trim()) {
      setMessage("Username is required");
      setError(true);
      return;
    }
    if (!formData.first_name.trim()) {
      setMessage("First name is required");
      setError(true);
      return;
    }
    if (!formData.last_name.trim()) {
      setMessage("Last name is required");
      setError(true);
      return;
    }

    // Password match
    if (formData.password && formData.password !== formData.confirmPassword) {
      setMessage("Passwords don't match");
      setError(true);
      return;
    }
    if (formData.password && formData.password.trim().length < 6) {
      setMessage("Password must be at least 6 characters");
      setError(true);
      return;
    }

    setLoading(true);

    // Build payload
    const payload: Partial<EditFormData> = {};
    if (formData.username.trim()) payload.username = formData.username.trim();
    if (formData.email.trim()) payload.email = formData.email.trim();
    if (formData.first_name.trim()) payload.first_name = formData.first_name.trim();
    if (formData.last_name.trim()) payload.last_name = formData.last_name.trim();
    if (formData.password.trim()) payload.password = formData.password.trim();

    if (Object.keys(payload).length === 0) {
      setMessage("No changes to save");
      setError(false);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('http://127.0.0.1:5000/api/auth/appuser/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(data.msg || 'Profile updated!');
        setError(false);

        localStorage.setItem('username', data.username || formData.username);
        if (data.email) localStorage.setItem('email', data.email);
        window.dispatchEvent(new Event('sessionchange'));

        setTimeout(() => navigate('/app/profile'), 1500);
      } else {
        setMessage(data.msg || 'Update failed');
        setError(true);
      }
    } catch (err) {
      setMessage('Network error');
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-12 px-4">
      <div className="text-center mb-8">
        <h1 className="text-5xl font-extrabold text-blue-600">SENTINEL</h1>
        <p className="text-xl text-gray-700 mt-2">Edit Your Profile</p>
      </div>

      <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800">Edit Profile</h2>
          <button
            onClick={() => navigate('/app/profile')}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition"
          >
            Cancel
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
            <input
              type="text"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
            <input
              type="text"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password (optional)</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Leave blank to keep current"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Required if changing password"
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg shadow transition"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>

        {message && (
          <p className={`mt-5 text-sm px-4 py-3 rounded-md text-center ${
            error ? 'bg-red-50 text-red-600 border-red-200' : 'bg-green-50 text-green-600 border-green-200'
          } border`}>
            {message}
          </p>
        )}
      </div>

      <footer className="mt-16 text-center text-gray-500 text-sm">
        © {new Date().getFullYear()} SENTINEL | Edit Profile
      </footer>
    </div>
  );
}