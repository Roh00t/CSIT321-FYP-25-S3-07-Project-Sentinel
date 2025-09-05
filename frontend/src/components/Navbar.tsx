import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="mb-6 flex space-x-6 text-white text-lg font-semibold sticky top-0 z-50 bg-gray-800 shadow-md px-6 py-4">
      <Link to="/">Home</Link>
      <Link to="/register">Register</Link>
      <Link to="/login">Login</Link>
    </nav>
  );
}