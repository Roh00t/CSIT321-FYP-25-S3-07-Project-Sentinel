// frontend/src/components/PlanProtectedRoute.tsx
import { Navigate, Outlet } from 'react-router-dom';
import { usePlan } from '../hooks/usePlan';
import { type UserPlan } from '../hooks/usePlan';

interface PlanProtectedRouteProps {
  allowedPlans: UserPlan[];
}

export default function PlanProtectedRoute({ allowedPlans }: PlanProtectedRouteProps) {
  const userPlan = usePlan();

  // If plan not loaded or not allowed, redirect
  if (!userPlan || !allowedPlans.includes(userPlan)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}