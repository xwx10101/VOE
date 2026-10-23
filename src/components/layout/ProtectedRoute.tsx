/*
 * ✏️ TEAM GUIDE: Route guards driven by the auth store.
 * - ProtectedRoute: must be logged in AND onboarded (all app pages).
 * - OnboardingRoute: must be logged in but NOT yet onboarded.
 * - GuestRoute: only for logged-out visitors (login/register).
 */
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { PageLoader } from '@/components/layout/PageLoader';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const location = useLocation();
  if (status === 'loading') return <PageLoader />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (!user.onboarded) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

export function OnboardingRoute({ children }: { children: React.ReactNode }) {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  if (status === 'loading') return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.onboarded) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export function GuestRoute({ children }: { children: React.ReactNode }) {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  if (status === 'loading') return <PageLoader />;
  if (user) return <Navigate to={user.onboarded ? '/dashboard' : '/onboarding'} replace />;
  return <>{children}</>;
}
