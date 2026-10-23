/*
 * ✏️ TEAM GUIDE: Recharts theming — reads the design-token CSS variables so
 * charts match light/dark modes automatically. Recomputes on theme change.
 */
import { useMemo } from 'react';
import { useUiStore } from '@/stores/uiStore';

export interface ChartColors {
  teal: string;
  violet: string;
  amber: string;
  sky: string;
  rose: string;
  grid: string;
  tick: string;
  cursor: string;
}

function readVar(name: string): string {
  if (typeof document === 'undefined') return '';
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

const hsl = (name: string, alpha = 1) => `hsl(${readVar(name)} / ${alpha})`;

export function useChartColors(): ChartColors {
  const theme = useUiStore((s) => s.theme);
  return useMemo(
    () => ({
      teal: hsl('--chart-1'),
      violet: hsl('--chart-2'),
      amber: hsl('--chart-3'),
      sky: hsl('--chart-4'),
      rose: hsl('--chart-5'),
      grid: hsl('--border', 0.7),
      tick: hsl('--muted-foreground'),
      cursor: hsl('--muted', 0.55),
    }),
    // theme class is applied synchronously before this state update renders
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [theme],
  );
}
