// src/pages/RegisterPage.tsx
import { useState } from 'react';
import type { FormEvent } from 'react';

interface RegisterResponse {
  msg?: string;
}

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<boolean>(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);

    try {
      const res = await fetch('http://127.0.0.1:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data: RegisterResponse = await res.json();

      if (res.ok) {
        setMessage(data.msg || 'Registered successfully!');
        setError(false);
      } else {
        setMessage(data.msg || 'Registration failed');
        setError(true);
      }
    } catch (err) {
      setMessage('Network error. Please try again later.');
      setError(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-12 px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-5xl font-extrabold text-blue-600">SENTINEL</h1>
        <p className="text-xl text-gray-700 mt-2">Create Your Account</p>
      </div>

      {/* Registration Card */}
      <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Join SENTINEL</h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              id="username"
              type="text"
              placeholder="Enter your username"
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="Create a password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg shadow transition duration-200 transform hover:scale-[1.02]"
          >
            Register
          </button>
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

      {/* Footer Link */}
      <div className="text-center mt-6 text-gray-600">
        Already have an account?{' '}
        <a href="/login" className="text-blue-600 hover:underline font-medium">
          Log in
        </a>
      </div>

      {/* Global Footer */}
      <footer className="mt-16 text-center text-gray-500 text-sm">
        © {new Date().getFullYear()} SENTINEL | Final Year Project
      </footer>
    </div>
  );
}