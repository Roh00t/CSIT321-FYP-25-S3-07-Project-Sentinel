// src/components/RoleProtectedRoute.tsx
import { Navigate, Outlet } from 'react-router-dom';

interface RoleProtectedRouteProps {
  allowedRoles: string[];
}

export default function RoleProtectedRoute({ allowedRoles }: RoleProtectedRouteProps) {
  const token = localStorage.getItem('token');
  const user_type = localStorage.getItem('user_type');

  if (!token || !user_type) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user_type)) {
    // Redirect based on known role
    if (user_type === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (user_type === 'app_user') {
      return <Navigate to="/app/dashboard" replace />;
    } else {
      // Unknown role → force login
      localStorage.removeItem('token');
      localStorage.removeItem('user_type');
      return <Navigate to="/login" replace />;
    }
  }

  return <Outlet />;
}