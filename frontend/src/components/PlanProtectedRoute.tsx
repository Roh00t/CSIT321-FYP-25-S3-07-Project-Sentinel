// frontend/src/components/PlanProtectedRoute.tsx
import { Navigate, Outlet } from 'react-router-dom';
import { usePlan } from '../hooks/usePlan';
import { type UserPlan } from '../hooks/usePlan';
import { type ReactNode } from 'react';

interface PlanProtectedRouteProps {
  allowedPlans: UserPlan[];
  children?: ReactNode;
}

export default function PlanProtectedRoute({
  allowedPlans,
  children,
}: PlanProtectedRouteProps) {
  const userPlan = usePlan();

  // If plan not loaded or not allowed, redirect
  if (!userPlan || !allowedPlans.includes(userPlan)) {
    return <Navigate to="/app/profile" replace />;
  }

  // If children are provided, render them (inline usage)
  if (children) {
    return <>{children}</>;
  }

  // Otherwise, assume it's being used as a route wrapper (with nested routes)
  return <Outlet />;
}