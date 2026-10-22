import { ArrowDownUp, Command, RefreshCw, Search } from 'lucide-react';
import type { ScreenId } from './Sidebar';

const titles: Record<ScreenId, { title: string; kicker: string }> = {
  workspace: { title: 'Workspace', kicker: 'YOUR PERSONAL DOCUMENT STUDIO' },
  runs: { title: 'Run history', kicker: 'ACTIVITY & RESULTS' },
  catalog: { title: 'Models & engines', kicker: 'LIVE LDX HUB CATALOG' },
  settings: { title: 'Settings', kicker: 'PREFERENCES & ACCESS' },
};

interface TopbarProps {
  screen: ScreenId;
  modelCount: number;
  connected: boolean | null;
  refreshing: boolean;
  onRefresh: () => void;
  onSearch?: () => void;
}

export default function Topbar({ screen, modelCount, connected, refreshing, onRefresh, onSearch }: TopbarProps) {
  const current = titles[screen];
  return (
    <header className="topbar">
      <div className="topbar-heading"><span>{current.kicker}</span><h1>{current.title}</h1></div>
      <div className="topbar-actions">
        <button type="button" className="topbar-search" onClick={onSearch} aria-label="Search catalog">
          <Search size={15} /><span>Quick find</span><kbd><Command size={10} /> K</kbd>
        </button>
        <span className="topbar-divider" />
        <div className="catalog-counter"><span className="counter-orb"><ArrowDownUp size={13} /></span><span><b>{modelCount}</b><small>in catalog</small></span></div>
        <button type="button" className="icon-button topbar-refresh" onClick={onRefresh} disabled={refreshing} aria-label="Refresh catalog" title="Refresh model catalog">
          <RefreshCw size={16} className={refreshing ? 'spin' : ''} />
        </button>
        <span className="topbar-divider topbar-divider-short" />
        <div className={`connection-indicator${connected === false ? ' connection-offline' : ''}`}><span className="status-pulse" /><span>{connected === null ? 'Checking' : connected ? 'Connected' : 'Unavailable'}</span></div>
      </div>
    </header>
  );
}
