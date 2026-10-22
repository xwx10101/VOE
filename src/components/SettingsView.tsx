import { useState, type FormEvent } from 'react';
import { ArrowRight, Check, ChevronRight, CircleHelp, ExternalLink, Eye, EyeOff, KeyRound, LockKeyhole, RefreshCw, ShieldCheck, Trash2 } from 'lucide-react';
import type { ConnectResponse, KeyStatus } from '../types';

interface SettingsViewProps {
  keyStatus: KeyStatus;
  appVersion: string;
  catalogUpdatedAt?: string;
  refreshing: boolean;
  onConnect: (key: string) => Promise<ConnectResponse>;
  onDisconnect: () => Promise<void>;
  onRefreshCatalog: () => void;
  onOpenPortal: () => void;
}

export default function SettingsView({ keyStatus, appVersion, catalogUpdatedAt, refreshing, onConnect, onDisconnect, onRefreshCatalog, onOpenPortal }: SettingsViewProps) {
  const [editing, setEditing] = useState(false);
  const [key, setKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleKeyUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!key.trim()) return;
    setBusy(true);
    setError('');
    setSaved(false);
    try {
      await onConnect(key);
      setKey('');
      setEditing(false);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2400);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to update API key.');
    } finally {
      setBusy(false);
    }
  }

  async function handleDisconnect() {
    setBusy(true);
    setError('');
    try {
      await onDisconnect();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to remove API key.');
    } finally {
      setBusy(false);
      setConfirmDisconnect(false);
    }
  }

  return (
    <div className="settings-page">
      <div className="settings-intro"><span className="eyebrow"><ShieldCheck size={14} /> YOUR CONTROL CENTER</span><h2>Private by design.<br /><span>Simple to manage.</span></h2><p>Manage your API access and workspace preferences. Each person connects their own LDX hub key.</p></div>

      <section className="settings-section">
        <div className="settings-section-heading"><span className="settings-section-icon"><KeyRound size={17} /></span><span><b>API connection</b><small>Bring your own key. Calls are sent directly to LDX hub.</small></span><span className="settings-section-state"><i className="status-pulse" /> KEY SAVED</span></div>
        <div className="settings-card-content">
          {!editing ? (
            <>
              <div className="credential-summary">
                <span className="credential-key-icon"><KeyRound size={17} /></span>
                <span className="credential-copy"><small>ACTIVE API KEY</small><code>{keyStatus.masked || '••••••••••••'}</code></span>
                <span className="credential-verified"><Check size={12} /> Verified</span>
              </div>
              {saved && <div className="inline-success"><Check size={14} /> API key updated and verified.</div>}
              <div className="settings-actions-row">
                <button className="button button-secondary" type="button" onClick={() => { setEditing(true); setError(''); setConfirmDisconnect(false); }}>Update API key <ArrowRight size={15} /></button>
                {!confirmDisconnect ? <button type="button" className="danger-link" onClick={() => setConfirmDisconnect(true)}><Trash2 size={14} /> Remove key</button> : <span className="confirm-remove"><span>Remove saved key?</span><button type="button" onClick={handleDisconnect} disabled={busy}>{busy ? 'Removing…' : 'Confirm'}</button><button type="button" onClick={() => setConfirmDisconnect(false)}>Cancel</button></span>}
              </div>
            </>
          ) : (
            <form className="settings-key-form" onSubmit={handleKeyUpdate}>
              <div className="settings-edit-heading"><span><b>Replace your API key</b><small>Your new key is checked before it replaces the current one.</small></span><button className="text-link" type="button" onClick={() => { setEditing(false); setKey(''); setError(''); }}>Cancel</button></div>
              <div className="key-input-wrap settings-key-input"><KeyRound size={15} /><input type={showKey ? 'text' : 'password'} value={key} onChange={(event) => setKey(event.target.value)} placeholder="Paste your new API key" autoComplete="off" spellCheck={false} /><button type="button" className="icon-button key-visibility" onClick={() => setShowKey((value) => !value)} aria-label={showKey ? 'Hide API key' : 'Show API key'}>{showKey ? <EyeOff size={15} /> : <Eye size={15} />}</button></div>
              {error && <p className="field-error">{error}</p>}
              <button className="button button-primary" type="submit" disabled={busy || !key.trim()}>{busy ? <><span className="spinner" /> Verifying…</> : <>Verify & update <ArrowRight size={15} /></>}</button>
            </form>
          )}
        </div>
      </section>

      <section className="settings-section">
        <div className="settings-section-heading"><span className="settings-section-icon settings-icon-green"><LockKeyhole size={17} /></span><span><b>Privacy & storage</b><small>Credential handling and data retention.</small></span></div>
        <div className="privacy-list">
          <div className="privacy-row"><span className="privacy-row-icon"><LockKeyhole size={15} /></span><span><b>{keyStatus.desktop ? (keyStatus.secureStorage ? 'Encrypted on this device' : 'Secure storage unavailable') : 'Browser preview mode'}</b><small>{keyStatus.desktop ? 'The key is encrypted with your operating system credential store. The app never shows the full saved key.' : 'The preview only keeps the key in memory for this session. The packaged desktop app uses encrypted OS storage.'}</small></span><span className="privacy-row-state">{keyStatus.desktop && keyStatus.secureStorage ? 'ON DEVICE' : 'PREVIEW'}</span></div>
          <div className="privacy-row"><span className="privacy-row-icon"><ShieldCheck size={15} /></span><span><b>Direct API connection</b><small>Requests are sent to gw.ldxhub.io over HTTPS. LDX Workbench does not proxy or store your documents.</small></span><span className="privacy-row-state">HTTPS</span></div>
          <div className="privacy-row"><span className="privacy-row-icon"><CircleHelp size={15} /></span><span><b>File retention</b><small>Uploaded files and job results expire according to the LDX hub service policy.</small></span><button className="text-link privacy-link" type="button" onClick={onOpenPortal}>View docs <ExternalLink size={12} /></button></div>
        </div>
      </section>

      <section className="settings-section">
        <div className="settings-section-heading"><span className="settings-section-icon settings-icon-violet"><RefreshCw size={17} /></span><span><b>Model catalog</b><small>Keep this workspace aligned with LDX hub.</small></span></div>
        <div className="settings-card-content catalog-settings-content"><div><b>Live models & engines</b><small>{catalogUpdatedAt ? `Last synced ${new Date(catalogUpdatedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}` : 'No catalog sync yet. Refresh to discover current options.'}</small></div><button className="button button-secondary" type="button" onClick={onRefreshCatalog} disabled={refreshing}>{refreshing ? <><span className="spinner spinner-small" /> Syncing…</> : <><RefreshCw size={14} /> Refresh catalog</>}</button></div>
      </section>

      <div className="settings-bottom"><button type="button" className="text-link" onClick={onOpenPortal}>LDX hub developer portal <ExternalLink size={13} /></button><span>LDX Workbench {appVersion} <i>·</i> API base gw.ldxhub.io</span><ChevronRight size={14} /></div>
      {error && !editing && <div className="settings-global-error">{error}</div>}
    </div>
  );
}
