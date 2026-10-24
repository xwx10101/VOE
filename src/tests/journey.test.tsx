// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { ReactElement } from 'react';
import { FamilyProvider } from '@/state/FamilyContext';
import Assessment from '@/pages/Assessment';
import Results from '@/pages/Results';
import PlanPage from '@/pages/PlanPage';
import Schedule from '@/pages/Schedule';
import Memories from '@/pages/Memories';

const renderWithRoutes = (ui: ReactElement, path: string, extra?: ReactElement) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <FamilyProvider>
        <Routes>
          <Route path={path} element={ui} />
          {extra}
        </Routes>
      </FamilyProvider>
    </MemoryRouter>,
  );

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

afterEach(() => cleanup());

describe('assessment journey', () => {
  it('completes the check-in and produces the deterministic 45 result', async () => {
    const { container } = renderWithRoutes(<Assessment />, '/assessment', (
      <Route path="/results" element={<Results />} />
    ));

    const answers = ['once', 'moderate', 'comfortable', 'slightlyUneven', 'high', 'occasionalMissed', 'none', 'inconsistent'];

    for (let index = 0; index < answers.length; index += 1) {
      const input = container.querySelector<HTMLInputElement>(`input[value="${answers[index]}"]`);
      expect(input, `answer ${answers[index]}`).toBeTruthy();
      fireEvent.click(input!);
      fireEvent.click(screen.getByRole('button', { name: /Next question/i }));
    }

    expect(await screen.findByText(/Review the week before you see the result/i)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Show my family result/i }));

    expect(await screen.findByRole('heading', { level: 1, name: /The Al Noor household this week/i })).toBeTruthy();
    expect(screen.getAllByText(/Needs Attention/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/How this score was calculated/i)).toBeTruthy();
  });

  it('blocks progress until a question is answered', async () => {
    renderWithRoutes(<Assessment />, '/assessment');
    fireEvent.click(screen.getByRole('button', { name: /Next question/i }));
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(screen.getByText(/Choose one answer to continue/i)).toBeTruthy();
  });
});

describe('plan interactions', () => {
  it('toggles an action complete and reduces the workload', async () => {
    renderWithRoutes(<PlanPage />, '/plan');
    expect(await screen.findByText(/0\/7/)).toBeTruthy();
    const toggle = screen.getAllByRole('button', { name: /Mark “/i })[0];
    fireEvent.click(toggle);
    expect(await screen.findByText(/1\/7/)).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /Reduce Workload/i }));
    expect(await screen.findByText(/Reduced workload mode is on/i)).toBeTruthy();
  });
});

describe('schedule optimisation', () => {
  it('proposes, applies, and undoes changes', async () => {
    renderWithRoutes(<Schedule />, '/schedule');
    fireEvent.click(await screen.findByRole('button', { name: /AI Optimise/i }));

    expect(await screen.findByText(/Proposed changes/i)).toBeTruthy();
    expect(screen.getByText(/Move Wednesday’s kitchen task/i)).toBeTruthy();
    expect(screen.getByText(/Assign Omar as backup/i)).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /Apply \d+ selected change/i }));
    expect(await screen.findByText(/Undo/i)).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /^Undo$/i }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /AI Optimise/i })).toBeTruthy();
    });
  });
});

describe('memory vault', () => {
  it('adds a validated memory and shows it in the list', async () => {
    renderWithRoutes(<Memories />, '/memories');
    fireEvent.click(await screen.findByRole('button', { name: /Add a memory/i }));

    const dialog = screen.getByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: /^Add memory$/i }));
    expect(await within(dialog).findByRole('alert')).toBeTruthy();

    fireEvent.change(within(dialog).getByLabelText(/Title/i), {
      target: { value: 'A quiet evening walk' },
    });
    fireEvent.change(within(dialog).getByLabelText(/What happened/i), {
      target: { value: 'We walked together after dinner and nobody checked a phone.' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: /^Add memory$/i }));

    expect(await screen.findByText(/A quiet evening walk/i)).toBeTruthy();
  });
});

describe('guided judge demo', () => {
  it('runs from the family introduction to the final statement', async () => {
    const { default: Demo } = await import('@/pages/Demo');
    renderWithRoutes(<Demo />, '/demo');

    const next = () => fireEvent.click(screen.getByRole('button', { name: /Next step/i }));

    expect(await screen.findByRole('heading', { level: 1, name: /Meet the Al Noor family/i })).toBeTruthy();
    next();
    expect(await screen.findByRole('heading', { level: 1, name: /Discover the connected signals/i })).toBeTruthy();
    next();

    expect(await screen.findByRole('heading', { level: 1, name: /Complete the family check-in/i })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Complete the check-in/i }));
    expect(await screen.findByRole('button', { name: /Re-run the check-in/i })).toBeTruthy();
    expect(screen.getAllByText(/Needs Attention/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/−12/i)).toBeTruthy();

    next();
    expect(await screen.findByRole('heading', { level: 1, name: /Understand the recommendation/i })).toBeTruthy();
    expect(screen.getByText(/Why this recommendation\?/i)).toBeTruthy();

    next();
    expect(await screen.findByRole('heading', { level: 1, name: /Generate the weekly plan/i })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Generate the plan/i }));

    next();
    expect(await screen.findByRole('heading', { level: 1, name: /Optimise the schedule/i })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Apply \d+ selected changes/i }));
    expect(await screen.findByText(/Changes applied/i)).toBeTruthy();

    next();
    expect(await screen.findByRole('heading', { level: 1, name: /Review privacy and explainability/i })).toBeTruthy();
    next();

    expect(await screen.findByRole('heading', { level: 1, name: /The final family actions/i })).toBeTruthy();
    expect(screen.getByText(/does not replace the family’s judgment/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /Restart demo/i })).toBeTruthy();
  });
});
