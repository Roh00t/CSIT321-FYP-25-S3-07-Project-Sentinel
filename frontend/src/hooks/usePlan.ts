// frontend/src/hooks/usePlan.ts
export type UserPlan = 'Basic' | 'Pro' | 'Team' | null;

export const usePlan = (): UserPlan => {
  if (typeof window === 'undefined') return null;
  
  const plan = localStorage.getItem('plan_type');
  if (plan === 'Basic' || plan === 'Pro' || plan === 'Team') {
    return plan;
  }
  return null;
};