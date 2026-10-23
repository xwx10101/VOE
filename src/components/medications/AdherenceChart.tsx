/*
 * ✏️ TEAM GUIDE: 14-day adherence trend (Recharts area chart, themed via
 * useChartColors — gradients, custom tooltip, RTL-safe axis order).
 */
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useChartColors } from '@/components/charts/chartTheme';
import { addDaysToKey, formatShortDate, todayKey } from '@/lib/dates';
import type { Lang } from '@/types';

interface ChartTipProps {
  active?: boolean;
  label?: string;
  payload?: Array<{ value: number }>;
  unitLabel: string;
}

function ChartTip({ active, label, payload, unitLabel }: ChartTipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border/80 bg-popover px-3.5 py-2.5 shadow-bloom">
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <p className="text-base font-extrabold">
        {payload[0]!.value}% <span className="text-xs font-semibold text-muted-foreground">{unitLabel}</span>
      </p>
    </div>
  );
}

export function AdherenceChart({ perDay, lang }: { perDay: Array<number | null>; lang: Lang }) {
  const { t } = useTranslation();
  const colors = useChartColors();
  const isRTL = lang === 'ar';

  const data = useMemo(() => {
    const today = todayKey();
    // Carry-forward fill so the area never breaks on dose-free days.
    let last = perDay.find((v) => v !== null) ?? 0;
    return perDay.map((value, i) => {
      if (value !== null) last = value;
      const date = addDaysToKey(today, -(perDay.length - 1 - i));
      return { date: formatShortDate(date, lang), pct: last };
    });
  }, [perDay, lang]);

  return (
    <div dir="ltr" className="h-52 w-full" role="img" aria-label={t('meds.trendTitle')}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 6, bottom: 0, left: -14 }}>
          <defs>
            <linearGradient id="adherenceFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colors.teal} stopOpacity={0.38} />
              <stop offset="100%" stopColor={colors.violet} stopOpacity={0.04} />
            </linearGradient>
            <linearGradient id="adherenceStroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={colors.teal} />
              <stop offset="100%" stopColor={colors.violet} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={colors.grid} strokeDasharray="4 6" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: colors.tick, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
            minTickGap={28}
            reversed={isRTL}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: colors.tick, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => `${v}%`}
            orientation={isRTL ? 'right' : 'left'}
          />
          <Tooltip
            content={<ChartTip unitLabel={t('meds.trendLabel')} />}
            cursor={{ stroke: colors.teal, strokeOpacity: 0.35, strokeDasharray: '4 4' }}
          />
          <Area
            type="monotone"
            dataKey="pct"
            stroke="url(#adherenceStroke)"
            strokeWidth={2.6}
            fill="url(#adherenceFill)"
            dot={false}
            activeDot={{ r: 4.5, strokeWidth: 2, stroke: '#fff' }}
            animationDuration={900}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
