// src/pages/AdminEditProfilePage.tsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserSession } from '../hooks/useUserSession';

interface ProfileData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface ApiResponse {
  msg: string;
  username?: string;
  email?: string;
}

export default function AdminEditProfilePage() {
  const { token, username: currentUsername } = useUserSession();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<ProfileData>({
    username: currentUsername || '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  // 🔁 Fetch current profile (including email) on mount
  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const res = await fetch('http://127.0.0.1:5000/api/auth/admin/profile', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error('Failed to load profile');

        const data = await res.json();
        setFormData(prev => ({
          ...prev,
          username: data.username,
          email: data.email || '',
        }));
      } catch (err) {
        console.error('Failed to fetch profile:', err);
        setMessage('Could not load profile. Redirecting...');
        setError(true);
        setTimeout(() => navigate('/login'), 1500);
      }
    };

    fetchProfile();
  }, [token, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    // Validate username
    if (!formData.username.trim()) {
      setMessage("Username is required");
      setError(true);
      return;
    }

    // If changing password, validate match
    if (formData.password || formData.confirmPassword) {
      if (formData.password !== formData.confirmPassword) {
        setMessage("Passwords don't match");
        setError(true);
        return;
      }
      if (formData.password.trim().length < 6) {
        setMessage("Password must be at least 6 characters");
        setError(true);
        return;
      }
    }

    setLoading(true);

    // ✅ Build payload: only include non-empty fields
    const payload: Partial<ProfileData> = {};
    if (formData.username.trim() !== currentUsername) {
      payload.username = formData.username.trim();
    }
    if (formData.email.trim()) {
      payload.email = formData.email.trim();
    }
    if (formData.password.trim()) {
      payload.password = formData.password.trim();
    }

    // If nothing to update
    if (Object.keys(payload).length === 0) {
      setMessage("No changes to save");
      setError(false);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('http://127.0.0.1:5000/api/auth/admin/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      const data: ApiResponse = await res.json();

      if (res.ok) {
        setMessage(data.msg || 'Profile updated successfully!');
        setError(false);

        // Update localStorage
        if (data.username) localStorage.setItem('username', data.username);
        if (data.email) localStorage.setItem('email', data.email);
        window.dispatchEvent(new Event('sessionchange'));

        // Redirect after success
        setTimeout(() => {
          navigate('/admin/profile');
        }, 1500);
      } else {
        setMessage(data.msg || 'Update failed');
        setError(true);
      }
    } catch (err) {
      setMessage('Network error. Please try again.');
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-12 px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-5xl font-extrabold text-blue-600">SENTINEL</h1>
        <p className="text-xl text-gray-700 mt-2">Edit Admin Profile</p>
      </div>

      {/* Edit Form Card */}
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800">Edit Profile</h2>
          <button
            onClick={() => navigate('/admin/profile')}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition"
          >
            Cancel
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Username */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Username *
            </label>
            <input
              id="username"
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="Enter your email"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              New Password (optional)
            </label>
            <input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="Leave blank to keep current password"
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm New Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="Required if changing password"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg shadow transition duration-200 transform hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>

        {/* Message Feedback */}
        {message && (
          <p
            className={`mt-5 text-sm px-4 py-3 rounded-md text-center ${
              error
                ? 'bg-red-50 text-red-600 border border-red-200'
                : 'bg-green-50 text-green-600 border border-green-200'
            }`}
          >
            {message}
          </p>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-16 text-center text-gray-500 text-sm">
        © {new Date().getFullYear()} SENTINEL | Edit Admin Profile
      </footer>
    </div>
  );
}