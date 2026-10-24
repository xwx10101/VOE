import { ArrowUpRight, BellRing, CheckCircle2, Moon, Users } from 'lucide-react';
import { ScoreRing } from '@/components/shared/ScoreRing';
import { DEMO_MOOD_TREND, DEMO_RESPONSIBILITY, DEMO_MEMBERS } from '@/data/demo';

export function HeroSignalPreview() {
  return (
    <div className="relative">
      <div
        aria-hidden="true"
        className="absolute -inset-6 rounded-[32px] bg-[radial-gradient(60%_60%_at_50%_30%,rgba(71,230,193,0.18),transparent_70%)] blur-2xl"
      />
      <div className="relative rounded-card border border-white/[0.12] bg-white/[0.045] p-5 backdrop-blur-sm sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/55">
              Illustrative preview · an example week
            </p>
            <p className="mt-1 font-display text-sm font-semibold text-white">Al Noor household</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-teal/30 bg-teal/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-teal">
            Live model
          </span>
        </div>

        <div className="mt-4 grid gap-5 sm:grid-cols-[auto_1fr] sm:items-center">
          <ScoreRing score={72} statusLabel="Stable with Opportunities" tone="dark" size={148} />
          <div className="space-y-2.5">
            <div className="rounded-control border border-white/10 bg-ink/40 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/55">Primary signal</p>
              <p className="mt-1 text-[13px] font-medium text-white">Exam pressure increased this week</p>
              <p className="mt-1 text-[11px] leading-relaxed text-white/50">
                Two assessments sit within three days of a shared household evening.
              </p>
            </div>
            <div className="rounded-control border border-white/10 bg-ink/40 p-3">
              <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/55">
                <CheckCircle2 aria-hidden="true" className="h-3 w-3 text-teal" /> Strength
              </p>
              <p className="mt-1 text-[13px] font-medium text-white">Family care participation is consistent</p>
            </div>
            <div className="rounded-control border border-gold/25 bg-gold/[0.08] p-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gold">Today’s action</p>
              <p className="mt-1 text-[13px] font-medium text-white">15-minute no-phone family check-in</p>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-control border border-white/10 bg-ink/40 p-3">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/55">
              <Moon aria-hidden="true" className="h-3 w-3" /> Household mood trend
            </p>
            <div className="mt-3 flex h-14 items-end gap-1.5" role="img" aria-label="Seven day household mood trend, rising from 58 on Monday to 72 on Sunday.">
              {DEMO_MOOD_TREND.map((point) => (
                <span key={point.label} className="flex flex-1 flex-col items-center gap-1">
                  <span
                    className="w-full rounded-sm bg-gradient-to-t from-insight/30 to-teal/80"
                    style={{ height: `${(point.value / 100) * 44}px` }}
                  />
                  <span className="text-[9px] text-white/55">{point.label.charAt(0)}</span>
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-control border border-white/10 bg-ink/40 p-3">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/55">
              <Users aria-hidden="true" className="h-3 w-3" /> Responsibility balance
            </p>
            <ul className="mt-2.5 space-y-2">
              {DEMO_RESPONSIBILITY.slice(0, 4).map((row) => {
                const member = DEMO_MEMBERS.find((item) => item.id === row.memberId);
                return (
                  <li key={row.memberId} className="flex items-center gap-2">
                    <span className="w-[52px] shrink-0 text-[10px] text-white/55">
                      {member?.name.split(' ')[0]}
                    </span>
                    <span className="flex h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                      <span className="h-full bg-teal" style={{ width: `${(row.visible / 14) * 100}%` }} />
                      <span className="h-full bg-gold" style={{ width: `${(row.planning / 14) * 100}%` }} />
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3 rounded-control border border-white/10 bg-white/[0.03] px-3 py-2.5">
          <p className="flex items-center gap-2 text-[11px] text-white/60">
            <BellRing aria-hidden="true" className="h-3.5 w-3.5 text-gold" />
            Care reminder · Fatima · 19:00 family call
          </p>
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-teal">
            Backup named <ArrowUpRight aria-hidden="true" className="h-3 w-3" />
          </span>
        </div>
      </div>
      <p className="mt-3 text-center text-[11px] text-white/55">
        Example household data from the guided demo. Not a clinical result.
      </p>
    </div>
  );
}
