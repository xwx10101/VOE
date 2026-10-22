import { useState, type FormEvent } from 'react';
import { ArrowRight, Eye, EyeOff, KeyRound, LockKeyhole, ShieldCheck, Sparkles } from 'lucide-react';
import BrandMark from './BrandMark';
import type { ConnectResponse } from '../types';

interface KeySetupProps {
  onConnect: (key: string) => Promise<ConnectResponse>;
  initialError?: string;
  onOpenDocs: () => void;
}

export default function KeySetup({ onConnect, initialError, onOpenDocs }: KeySetupProps) {
  const [key, setKey] = useState('');
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(initialError || '');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!key.trim()) {
      setError('Paste your LDX hub API key to continue.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await onConnect(key);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to connect with this key.');
    } finally {
      setBusy(false);
    }
  }

  const desktopApp = Boolean(window.ldx);

  return (
    <main className="setup-page">
      <div className="setup-glow setup-glow-one" />
      <div className="setup-glow setup-glow-two" />
      <header className="setup-topbar">
        <BrandMark />
        <span className="setup-local-label"><span className="local-dot" /> PRIVATE DESKTOP WORKSPACE</span>
      </header>

      <section className="setup-content">
        <div className="setup-copy">
          <div className="eyebrow"><Sparkles size={14} /> DOCUMENT WORKFLOWS, UNBLOCKED</div>
          <h1>Make every<br /><span>document useful.</span></h1>
          <p className="setup-lede">
            One focused workspace for extracting, analyzing, refining, and converting documents with LDX hub.
          </p>
          <div className="setup-feature-list">
            <div><span className="feature-icon"><ShieldCheck size={17} /></span><span><b>Your key stays yours</b><small>Stored encrypted on this device in the desktop app.</small></span></div>
            <div><span className="feature-icon"><Sparkles size={17} /></span><span><b>Models discovered for you</b><small>Live model and engine catalog from LDX hub.</small></span></div>
          </div>
          <div className="setup-disclaimer">
            <span className="disclaimer-dot" />
            LDX hub provides document processing APIs. This workspace is not a general-purpose chat or code-generation API client.
          </div>
        </div>

        <div className="key-card">
          <div className="key-card-orb"><KeyRound size={20} /></div>
          <div className="key-card-title">
            <span className="eyebrow">GET STARTED</span>
            <h2>Connect your API key</h2>
            <p>Enter your personal LDX hub key to connect this workspace.</p>
          </div>
          <form onSubmit={handleSubmit} className="key-form">
            <label htmlFor="api-key">API key</label>
            <div className={`key-input-wrap${error ? ' has-error' : ''}`}>
              <KeyRound size={16} />
              <input
                autoFocus
                id="api-key"
                value={key}
                onChange={(event) => setKey(event.target.value)}
                type={visible ? 'text' : 'password'}
                autoComplete="off"
                spellCheck={false}
                placeholder="Paste your API key"
                aria-describedby={error ? 'key-error' : undefined}
              />
              <button className="icon-button key-visibility" type="button" onClick={() => setVisible((value) => !value)} aria-label={visible ? 'Hide API key' : 'Show API key'}>
                {visible ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {error && <p className="field-error" id="key-error">{error}</p>}
            <button className="button button-primary button-full" disabled={busy || !key.trim()} type="submit">
              {busy ? <><span className="spinner" /> Verifying key…</> : <>Connect workspace <ArrowRight size={16} /></>}
            </button>
          </form>
          <div className="key-card-divider"><span /> <small>KEY SECURITY</small> <span /></div>
          <div className="secure-note">
            <LockKeyhole size={15} />
            <span>{desktopApp ? 'Encrypted by your operating system’s credential store. Never written to app logs.' : 'Browser preview keeps the key in memory for this session only. The desktop app encrypts it using your operating system’s credential store.'}</span>
          </div>
          <div className="key-card-footer">
            <span>Need a key?</span>
            <button type="button" className="text-link" onClick={onOpenDocs}>Visit the LDX hub developer portal <ArrowRight size={13} /></button>
          </div>
        </div>
      </section>
      <footer className="setup-footer"><span>LDX WORKBENCH <i>·</i> DESKTOP</span><span>By connecting, your key is sent only to LDX hub for verification.</span></footer>
    </main>
  );
}
