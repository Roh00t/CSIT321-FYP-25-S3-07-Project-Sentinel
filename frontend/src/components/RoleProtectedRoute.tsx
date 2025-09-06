// src/components/RoleProtectedRoute.tsx
import { Navigate, Outlet } from 'react-router-dom';

interface RoleProtectedRouteProps {
  allowedRoles: string[];
}

export default function RoleProtectedRoute({ allowedRoles }: RoleProtectedRouteProps) {
  const token = localStorage.getItem('token');
  const user_type = localStorage.getItem('user_type');

  if (!token) {
    return <Navigate to="/login" />;
  }

  if (!allowedRoles.includes(user_type || '')) {
    // Redirect to appropriate dashboard or home
    if (user_type === 'admin') {
      return <Navigate to="/admin/dashboard" />;
    } else if (user_type === 'app_user') {
      return <Navigate to="/app/dashboard" />;
    } else {
      return <Navigate to="/login" />;
    }
  }

  return <Outlet />;
}