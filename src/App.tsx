/*
 * ✏️ TEAM GUIDE: App root — router with animated transitions + auth hydration.
 * Transition strategy: the outer <Routes> is keyed by "zone" (public pages by
 * path; the authenticated shell by the constant 'app'), so navigating between
 * app pages keeps the shell mounted while AppShell animates the inner outlet.
 */
import { useEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from 'sonner';
import { AnimatedLayout } from '@/components/layout/AnimatedLayout';
import { AppShell } from '@/components/layout/AppShell';
import { GuestRoute, OnboardingRoute, ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { useAuthStore } from '@/stores/authStore';
import { useUiStore } from '@/stores/uiStore';
import { Landing } from '@/pages/Landing';
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';
import { Onboarding } from '@/pages/Onboarding';
import { Dashboard } from '@/pages/Dashboard';
import { Medications } from '@/pages/Medications';
import { Schedule } from '@/pages/Schedule';
import { ModulePlaceholder } from '@/pages/ModulePlaceholder';
import { Settings } from '@/pages/Settings';
import { NotFound } from '@/pages/NotFound';

const SHELL_PREFIXES = [
  '/dashboard',
  '/medications',
  '/meals',
  '/schedule',
  '/safety',
  '/assistant',
  '/settings',
];

/** Reset scroll position on every navigation. */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);
  return null;
}

function AppRoutes() {
  const location = useLocation();
  const inShell = SHELL_PREFIXES.some((p) => location.pathname.startsWith(p));
  const routeKey = inShell ? 'app' : location.pathname;
  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={routeKey}>
        <Route
          path="/"
          element={
            <AnimatedLayout>
              <Landing />
            </AnimatedLayout>
          }
        />
        <Route
          path="/login"
          element={
            <GuestRoute>
              <AnimatedLayout>
                <Login />
              </AnimatedLayout>
            </GuestRoute>
          }
        />
        <Route
          path="/register"
          element={
            <GuestRoute>
              <AnimatedLayout>
                <Register />
              </AnimatedLayout>
            </GuestRoute>
          }
        />
        <Route
          path="/onboarding"
          element={
            <OnboardingRoute>
              <AnimatedLayout>
                <Onboarding />
              </AnimatedLayout>
            </OnboardingRoute>
          }
        />

        {/* Authenticated app (shell persists across these routes) */}
        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route
            path="/dashboard"
            element={
              <AnimatedLayout>
                <Dashboard />
              </AnimatedLayout>
            }
          />
          <Route
            path="/medications"
            element={
              <AnimatedLayout>
                <Medications />
              </AnimatedLayout>
            }
          />
          <Route
            path="/meals"
            element={
              <AnimatedLayout>
                <ModulePlaceholder moduleId="meals" phase={4} />
              </AnimatedLayout>
            }
          />
          <Route
            path="/schedule"
            element={
              <AnimatedLayout>
                <Schedule />
              </AnimatedLayout>
            }
          />
          <Route
            path="/safety"
            element={
              <AnimatedLayout>
                <ModulePlaceholder moduleId="safety" phase={4} />
              </AnimatedLayout>
            }
          />
          <Route
            path="/assistant"
            element={
              <AnimatedLayout>
                <ModulePlaceholder moduleId="assistant" phase={5} />
              </AnimatedLayout>
            }
          />
          <Route
            path="/settings"
            element={
              <AnimatedLayout>
                <Settings />
              </AnimatedLayout>
            }
          />
        </Route>

        <Route
          path="*"
          element={
            <AnimatedLayout>
              <NotFound />
            </AnimatedLayout>
          }
        />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  const theme = useUiStore((s) => s.theme);

  useEffect(() => {
    void useAuthStore.getState().hydrate();
  }, []);

  return (
    <BrowserRouter>
      <ScrollToTop />
      <AppRoutes />
      <Toaster
        theme={theme}
        position="top-center"
        richColors
        closeButton
        toastOptions={{ style: { fontFamily: 'inherit' } }}
      />
    </BrowserRouter>
  );
}
