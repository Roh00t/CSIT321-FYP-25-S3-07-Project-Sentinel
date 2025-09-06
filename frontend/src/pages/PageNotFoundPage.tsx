// src/pages/PageNotFoundPage.tsx
import { Link } from 'react-router-dom';

export default function PageNotFoundPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-12 px-4 flex flex-col items-center justify-center">
      {/* Main Content */}
      <div className="text-center max-w-md mx-auto">
        {/* 404 Illustration */}
        <div className="mb-8">
          <svg
            className="mx-auto w-24 h-24 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-6xl font-extrabold text-blue-600 mb-4">404</h1>

        {/* Message */}
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Page Not Found</h2>
        <p className="text-gray-600 mb-8">
          Sorry, the page you’re looking for doesn’t exist or has been moved.
        </p>

        {/* Button */}
        <Link
          to="/"
          className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow transition duration-200 transform hover:scale-[1.02]"
        >
          Go Back Home
        </Link>
      </div>

      {/* Footer */}
      <footer className="mt-16 text-center text-gray-500 text-sm">
        © {new Date().getFullYear()} SENTINEL | Page Not Found
      </footer>
    </div>
  );
}