/*
 * ✏️ TEAM GUIDE: App root — router with animated page transitions, auth
 * hydration on boot, scroll restoration and the global toast system.
 * Phase 2 mounts the authenticated app shell (sidebar) around app routes.
 */
import { useEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from 'sonner';
import { AnimatedLayout } from '@/components/layout/AnimatedLayout';
import { GuestRoute, OnboardingRoute, ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { useAuthStore } from '@/stores/authStore';
import { useUiStore } from '@/stores/uiStore';
import { Landing } from '@/pages/Landing';
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';
import { Onboarding } from '@/pages/Onboarding';
import { Dashboard } from '@/pages/Dashboard';
import { NotFound } from '@/pages/NotFound';

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
  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
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
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AnimatedLayout>
                <Dashboard />
              </AnimatedLayout>
            </ProtectedRoute>
          }
        />
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
