import { Activity, ArrowUpRight, Blocks, CircleHelp, Files, LayoutDashboard, Settings2, ShieldCheck } from 'lucide-react';
import BrandMark from './BrandMark';
import type { KeyStatus } from '../types';

export type ScreenId = 'workspace' | 'runs' | 'catalog' | 'settings';

const navigation = [
  { id: 'workspace' as const, label: 'Workspace', icon: LayoutDashboard },
  { id: 'runs' as const, label: 'Runs', icon: Activity },
  { id: 'catalog' as const, label: 'Models & engines', icon: Blocks },
];

interface SidebarProps {
  active: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  keyStatus: KeyStatus;
  onOpenDocs: () => void;
}

export default function Sidebar({ active, onNavigate, keyStatus, onOpenDocs }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand"><BrandMark /></div>
      <button className="workspace-switcher" type="button" onClick={() => onNavigate('workspace')}>
        <span className="switcher-icon"><Files size={16} /></span>
        <span className="switcher-copy"><b>My workspace</b><small>Personal · LDX hub</small></span>
        <span className="switcher-chevron">⌄</span>
      </button>

      <div className="sidebar-section-label">WORKSPACE</div>
      <nav className="sidebar-nav" aria-label="Main navigation">
        {navigation.map(({ id, label, icon: Icon }) => (
          <button key={id} className={`nav-item${active === id ? ' active' : ''}`} onClick={() => onNavigate(id)} type="button">
            <Icon size={17} strokeWidth={1.8} />
            <span>{label}</span>
            {id === 'runs' && active === id && <span className="nav-active-mark" />}
          </button>
        ))}
      </nav>

      <div className="sidebar-spacer" />
      <div className="sidebar-status-card">
        <div className={`status-card-heading${!keyStatus.secureStorage && keyStatus.desktop ? ' status-card-warning' : ''}`}><span className="status-pulse" /> {keyStatus.desktop ? (keyStatus.secureStorage ? 'Key secured locally' : 'Secure storage unavailable') : 'Preview session only'}</div>
        <p>{keyStatus.masked || 'API key connected'}</p>
        <div className="status-card-footer"><ShieldCheck size={13} /> {keyStatus.desktop ? 'Stored in OS credential store' : 'Key remains in memory'}</div>
      </div>
      <div className="sidebar-divider" />
      <button className={`nav-item${active === 'settings' ? ' active' : ''}`} onClick={() => onNavigate('settings')} type="button">
        <Settings2 size={17} strokeWidth={1.8} /><span>Settings</span>
      </button>
      <button className="nav-item nav-help" type="button" onClick={onOpenDocs}>
        <CircleHelp size={17} strokeWidth={1.8} /><span>Help & API docs</span><ArrowUpRight size={13} className="nav-external" />
      </button>
      <div className="sidebar-version">LDX WORKBENCH <span>1.0</span></div>
    </aside>
  );
}
