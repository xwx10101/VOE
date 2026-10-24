import { Component, lazy, Suspense, useEffect, type ErrorInfo, type ReactNode } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { AppShell } from '@/components/layout/AppShell';
import { ErrorState, LoadingSkeleton } from '@/components/shared/Feedback';

const Landing = lazy(() => import('@/pages/Landing'));
const Onboarding = lazy(() => import('@/pages/Onboarding'));
const Assessment = lazy(() => import('@/pages/Assessment'));
const Results = lazy(() => import('@/pages/Results'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Coach = lazy(() => import('@/pages/Coach'));
const PlanPage = lazy(() => import('@/pages/PlanPage'));
const Schedule = lazy(() => import('@/pages/Schedule'));
const Student = lazy(() => import('@/pages/Student'));
const Care = lazy(() => import('@/pages/Care'));
const Memories = lazy(() => import('@/pages/Memories'));
const Trust = lazy(() => import('@/pages/Trust'));
const Demo = lazy(() => import('@/pages/Demo'));

const TITLES: Record<string, string> = {
  '/': 'FamilyMind AI — Understand the signals. Strengthen the family.',
  '/onboarding': 'Household setup · FamilyMind AI',
  '/assessment': 'Family assessment · FamilyMind AI',
  '/results': 'Explainable results · FamilyMind AI',
  '/dashboard': 'Family dashboard · FamilyMind AI',
  '/coach': 'AI Family Coach · FamilyMind AI',
  '/plan': 'Weekly family plan · FamilyMind AI',
  '/schedule': 'Smart schedule · FamilyMind AI',
  '/student': 'Student Support · FamilyMind AI',
  '/care': 'Older Adult Care · FamilyMind AI',
  '/memories': 'Family Memory Vault · FamilyMind AI',
  '/trust': 'Trust, privacy & ethics · FamilyMind AI',
  '/demo': 'Guided judge demo · FamilyMind AI',
};

function RouteEffects() {
  const { pathname } = useLocation();
  useEffect(() => {
    document.title = TITLES[pathname] ?? 'FamilyMind AI';
  }, [pathname]);
  return null;
}

class AppErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Never log private family content — only the error name and component stack.
    console.error('FamilyMind render error:', error.name, info.componentStack?.slice(0, 300));
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="container-page py-16">
          <ErrorState onRetry={() => window.location.reload()} />
        </div>
      );
    }
    return this.props.children;
  }
}

function PageFallback() {
  return (
    <div className="container-page py-16">
      <LoadingSkeleton rows={4} />
    </div>
  );
}

export default function App() {
  return (
    <AppErrorBoundary>
      <RouteEffects />
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Landing />} />
            <Route path="/onboarding" element={<Onboarding />} />
          </Route>
          <Route element={<AppShell />}>
            <Route path="/assessment" element={<Assessment />} />
            <Route path="/results" element={<Results />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/coach" element={<Coach />} />
            <Route path="/plan" element={<PlanPage />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/student" element={<Student />} />
            <Route path="/care" element={<Care />} />
            <Route path="/memories" element={<Memories />} />
            <Route path="/trust" element={<Trust />} />
          </Route>
          <Route path="/demo" element={<Demo />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </AppErrorBoundary>
  );
}

function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-canvas px-5 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-3 font-display text-2xl font-semibold text-ink">This page is not part of the demo</h1>
      <p className="mt-2 max-w-md text-sm text-muted">
        The route you tried does not exist. Return to the overview or open the guided demonstration.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <a href="/" className="btn-primary">
          Back to overview
        </a>
        <a href="/demo" className="btn-ghost">
          Launch demo
        </a>
      </div>
    </div>
  );
}
