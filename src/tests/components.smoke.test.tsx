// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { ReactElement } from 'react';
import { FamilyProvider } from '@/state/FamilyContext';
import Dashboard from '@/pages/Dashboard';
import Assessment from '@/pages/Assessment';
import Results from '@/pages/Results';
import PlanPage from '@/pages/PlanPage';
import Trust from '@/pages/Trust';
import Student from '@/pages/Student';
import Care from '@/pages/Care';
import Memories from '@/pages/Memories';
import Schedule from '@/pages/Schedule';
import Coach from '@/pages/Coach';

const renderRoute = (ui: ReactElement, path = '/dashboard') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <FamilyProvider>{ui}</FamilyProvider>
    </MemoryRouter>,
  );

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  window.localStorage.clear();
  vi.stubGlobal(
    'matchMedia',
    (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    }),
  );
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return [];
      }
    },
  );
  if (!HTMLDialogElement.prototype.showModal) {
    HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
      this.open = true;
    };
    HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
      this.open = false;
    };
  }
});

describe('page rendering', () => {
  it('renders the dashboard with the demo household and score', async () => {
    renderRoute(<Dashboard />);
    expect(await screen.findByRole('heading', { level: 1, name: /Al Noor family/i })).toBeTruthy();
    expect(screen.getAllByText(/Household Harmony Score/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Best next action/i).length).toBeGreaterThan(0);
  });

  it('renders the assessment with the first question and progress', async () => {
    renderRoute(<Assessment />, '/assessment');
    expect(await screen.findByText(/Question 1 of 8/i)).toBeTruthy();
    expect(screen.getByText(/How often did your family intentionally connect this week\?/i)).toBeTruthy();
    expect(screen.getByRole('progressbar', { name: /Assessment progress/i })).toBeTruthy();
  });

  it('renders the empty results state before any check-in', async () => {
    renderRoute(<Results />, '/results');
    expect(await screen.findByText(/Complete the family check-in first/i)).toBeTruthy();
  });

  it('renders the weekly plan with seven day columns and reasons', async () => {
    renderRoute(<PlanPage />, '/plan');
    expect(await screen.findByRole('heading', { level: 1, name: /Seven days, sized to the household/i })).toBeTruthy();
    expect(screen.getAllByText(/Monday/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Why this action\?/i).length).toBeGreaterThan(4);
  });

  it('renders the trust center with required statements', async () => {
    renderRoute(<Trust />, '/trust');
    expect(await screen.findByRole('heading', { level: 1, name: /Privacy, ethics, and explainability/i })).toBeTruthy();
    expect(screen.getAllByText(/does not diagnose medical or mental-health conditions/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/cannot monitor emergencies/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Private entries are not automatically shared/i)).toBeTruthy();
  });

  it('renders student support without exposing private notes', async () => {
    renderRoute(<Student />, '/student');
    expect(await screen.findByRole('heading', { level: 1, name: /on your terms/i })).toBeTruthy();
    expect(screen.getByText(/Always private/i)).toBeTruthy();
  });

  it('renders care mode with routine confirmations', async () => {
    renderRoute(<Care />, '/care');
    expect(await screen.findByText(/Today’s routines/i)).toBeTruthy();
    expect(screen.getAllByRole('button', { name: /Confirm/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/does not monitor emergencies/i).length).toBeGreaterThan(0);
  });

  it('renders the memory vault with seeded entries', async () => {
    renderRoute(<Memories />, '/memories');
    expect(
      await screen.findByRole('heading', { level: 1, name: /A private place for the week’s wins/i }),
    ).toBeTruthy();
    expect(screen.getByText(/Latifa’s science presentation/i)).toBeTruthy();
  });

  it('renders the schedule with optimisation controls', async () => {
    renderRoute(<Schedule />, '/schedule');
    expect(await screen.findByRole('heading', { level: 1, name: /Balance time and responsibility/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /AI Optimise/i })).toBeTruthy();
    expect(screen.getByText(/Responsibility distribution/i)).toBeTruthy();
  });

  it('renders the coach with scenario chips and a message field', async () => {
    renderRoute(<Coach />, '/coach');
    expect(await screen.findByRole('heading', { level: 1, name: /AI Family Coach/i })).toBeTruthy();
    const input = screen.getByLabelText(/Describe what is happening/i);
    expect(input).toBeTruthy();
    expect(within(screen.getByRole('region', { name: /Coach conversation/i })).getByText(/Start with what feels hardest/i)).toBeTruthy();
  });
});

describe('public and demo entry points', () => {
  it('renders the landing hero without the intro when the session flag is set', async () => {
    window.sessionStorage.setItem('familymind:intro:session:v1', '1');
    const { default: Landing } = await import('@/pages/Landing');
    renderRoute(<Landing />, '/');
    expect(
      await screen.findByRole('heading', { level: 1, name: /Understand the signals/i }),
    ).toBeTruthy();
    expect(screen.getByRole('link', { name: /Start Family Check-In/i })).toBeTruthy();
    expect(screen.getAllByText(/Privacy-conscious/i).length).toBeGreaterThan(0);
    expect(screen.queryByRole('dialog', { name: /FamilyMind AI introduction/i })).toBeNull();
    window.sessionStorage.clear();
  });

  it('renders the guided demo with step navigation', async () => {
    const { default: Demo } = await import('@/pages/Demo');
    renderRoute(<Demo />, '/demo');
    expect(await screen.findByRole('heading', { level: 1, name: /Meet the Al Noor family/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Next step/i })).toBeTruthy();
    expect(screen.getByRole('navigation', { name: /Demo steps/i })).toBeTruthy();
    expect(screen.getByText(/Omar Al Noor/i)).toBeTruthy();
  });
});
