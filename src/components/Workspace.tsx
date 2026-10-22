import { ArrowRight, ArrowUpRight, Boxes, CircleHelp, Sparkles, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { ActiveRun, Catalog, ServiceId } from '../types';
import { SERVICE_LIST } from '../services';
import StatusPill from './StatusPill';
import WorkflowForm, { type RunSubmission } from './WorkflowForm';

interface WorkspaceProps {
  catalog: Catalog;
  catalogErrors: Partial<Record<ServiceId, string>>;
  catalogLoading: boolean;
  activeRun: ActiveRun | null;
  onRefreshCatalog: () => void;
  onStartRun: (submission: RunSubmission) => void;
  onSaveResult: (fileId: string, name: string) => void;
  initialService?: ServiceId | null;
  onInitialServiceOpened?: () => void;
}

function RunBanner({ run }: { run: ActiveRun }) {
  const definition = SERVICE_LIST.find((item) => item.id === run.service)!;
  const isRunning = ['uploading', 'submitting', 'queued', 'processing'].includes(run.stage);
  return (
    <div className={`workspace-run-banner${isRunning ? ' is-running' : ''}`}>
      <span className={`workspace-run-icon ${definition.accent}`}><definition.icon size={17} /></span>
      <span className="workspace-run-copy"><small>{isRunning ? 'CURRENTLY RUNNING' : 'LATEST RUN'}</small><b>{definition.title} <i>·</i> {run.message}</b></span>
      <StatusPill status={run.stage} />
      {isRunning && <span className="mini-progress"><i style={{ width: run.progress > 0 ? `${run.progress}%` : undefined }} /></span>}
    </div>
  );
}

export default function Workspace({
  catalog,
  catalogErrors,
  catalogLoading,
  activeRun,
  onRefreshCatalog,
  onStartRun,
  onSaveResult,
  initialService,
  onInitialServiceOpened,
}: WorkspaceProps) {
  const [selectedService, setSelectedService] = useState<ServiceId | null>(initialService || null);

  useEffect(() => {
    if (initialService) {
      setSelectedService(initialService);
      onInitialServiceOpened?.();
    }
  }, [initialService, onInitialServiceOpened]);
  const modelCount = Object.values(catalog).reduce((total, group) => total + group.length, 0);
  const workflow = selectedService ? SERVICE_LIST.find((item) => item.id === selectedService) : null;

  if (workflow) {
    return <WorkflowForm
      key={workflow.id}
      service={workflow}
      catalog={catalog}
      catalogErrors={catalogErrors}
      catalogLoading={catalogLoading}
      activeRun={activeRun}
      busy={Boolean(activeRun && ['uploading', 'submitting', 'queued', 'processing'].includes(activeRun.stage))}
      onBack={() => setSelectedService(null)}
      onSubmit={onStartRun}
      onRefreshCatalog={onRefreshCatalog}
      onSaveResult={onSaveResult}
    />;
  }

  return (
    <div className="workspace-home">
      <section className="workspace-hero">
        <div className="workspace-hero-copy">
          <div className="eyebrow"><Sparkles size={14} /> BUILT FOR YOUR DOCUMENTS</div>
          <h2>Good work starts<br />with <span>clearer inputs.</span></h2>
          <p>Choose a workflow and let LDX hub do the heavy lifting. Your models and engines stay in sync with the live API catalog.</p>
          <div className="hero-metrics">
            <div><span className="metric-icon"><Boxes size={15} /></span><span><b>{modelCount}</b><small>catalog options</small></span></div>
            <span className="metric-divider" />
            <div><span className="metric-icon metric-icon-green"><Zap size={15} /></span><span><b>6</b><small>ready workflows</small></span></div>
          </div>
        </div>
        <div className="workspace-hero-art" aria-hidden="true">
          <div className="hero-art-ring ring-one" />
          <div className="hero-art-ring ring-two" />
          <div className="hero-art-core"><Sparkles size={31} strokeWidth={1.4} /></div>
          <span className="hero-art-node node-one"><Boxes size={15} /></span>
          <span className="hero-art-node node-two"><Zap size={14} /></span>
          <span className="hero-art-node node-three"><ArrowUpRight size={14} /></span>
          <i className="hero-art-dot" />
        </div>
        <div className="hero-footer"><span><i className="hero-footer-dot" /> CONNECTED TO LDX HUB</span><button type="button" onClick={onRefreshCatalog} disabled={catalogLoading}>{catalogLoading ? 'Syncing…' : 'Sync catalog'} <ArrowUpRight size={13} /></button></div>
      </section>

      {activeRun && <RunBanner run={activeRun} />}

      <div className="section-heading-row">
        <div><span className="section-overline">PICK A WORKFLOW</span><h3>What would you like to do?</h3></div>
        <button type="button" className="subtle-action" onClick={onRefreshCatalog} disabled={catalogLoading}>{catalogLoading ? <span className="spinner spinner-small" /> : <ArrowUpRight size={14} />} Browse live catalog</button>
      </div>
      {catalogErrors && Object.keys(catalogErrors).length === SERVICE_LIST.length && !catalogLoading && (
        <div className="catalog-warning"><CircleHelp size={15} /> Catalogs could not be loaded. Check your key and connection, then sync again.</div>
      )}
      <div className="workflow-cards-grid">
        {SERVICE_LIST.map((service, index) => {
          const Icon = service.icon;
          const count = catalog[service.id]?.length || 0;
          return (
            <button type="button" className={`workflow-card workflow-card-${service.accent}`} key={service.id} onClick={() => setSelectedService(service.id)} style={{ animationDelay: `${index * 45}ms` }}>
              <div className="workflow-card-top"><span className={`workflow-card-icon ${service.accent}`}><Icon size={18} strokeWidth={1.8} /></span><span className="workflow-card-count">{catalogLoading && count === 0 ? <i className="count-skeleton" /> : `${count} ${service.catalogType === 'model' ? 'models' : 'engines'}`}</span></div>
              <div className="workflow-card-content"><span>{service.subtitle}</span><h4>{service.shortTitle}</h4><p>{service.description}</p></div>
              <div className="workflow-card-bottom"><span>{service.accepts}</span><span className="workflow-card-arrow"><ArrowRight size={15} /></span></div>
            </button>
          );
        })}
      </div>
      <div className="workspace-footnote"><span className="footnote-icon"><CircleHelp size={14} /></span><span>Jobs run asynchronously on LDX hub. Your API usage and billing are managed by your own key.</span><button onClick={onRefreshCatalog} type="button">Refresh catalog</button></div>
    </div>
  );
}
