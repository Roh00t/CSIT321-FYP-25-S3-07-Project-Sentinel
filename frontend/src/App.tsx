import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'

function App() {
  const [token, setToken] = useState('');
  const [formData, setFormData] = useState({ username: '', password: '' });

  const handleLogin = async () => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    const data = await res.json();
    if (data.access_token) {
      setToken(data.access_token);
      localStorage.setItem('token', data.access_token);
    }
  };

  return (
    <div className="p-10">
      <div className="p-10">
        <h1 className="text-4xl font-bold text-blue-600">Hello Tailwind!</h1>
        <p className="text-gray-700 mt-2">If this is blue, Tailwind is working.</p>
      </div>

      <h1 className="text-2xl mb-4">IDS Dashboard</h1>
      {!token ? (
        <div>
          <input
            placeholder="Username"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            className="border p-2 mr-2"
          />
          <input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="border p-2 mr-2"
          />
          <button onClick={handleLogin} className="bg-blue-500 text-white px-4 py-2">
            Login
          </button>
        </div>
      ) : (
        <p>Logged in! Token: {token.substring(0, 20)}...</p>
      )}
    </div>
  );
}

export default App;
