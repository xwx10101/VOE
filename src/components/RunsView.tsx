import { useMemo, useState } from 'react';
import { Activity, ArrowDownToLine, ArrowUpRight, Clock3, FileOutput, RefreshCw, Search, X } from 'lucide-react';
import type { JobRecord, RecentRun, ServiceId } from '../types';
import { SERVICE_BY_ID } from '../services';
import StatusPill from './StatusPill';

interface RunsViewProps {
  runs: RecentRun[];
  loading: boolean;
  error: string;
  updatedAt?: string;
  onRefresh: () => void;
  onView: (run: RecentRun) => void;
  detail: { service: ServiceId; record: JobRecord } | null;
  detailLoading: boolean;
  onCloseDetail: () => void;
  onSaveResult: (fileId: string, name: string) => void;
}

function formatDate(value?: string) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
}

function detailText(record: JobRecord): string {
  const value = record.results || record.summary || record;
  try { return JSON.stringify(value, null, 2); } catch { return String(value); }
}

function getOutputName(service: ServiceId, record: JobRecord) {
  const format = typeof record.output_format === 'string' ? record.output_format : '';
  const extension = service === 'analyzedoc' ? 'json'
    : service === 'refineloop' ? 'xlf'
      : service === 'renderocr' || service === 'castdoc' ? (format || 'docx')
        : service === 'extractdoc' ? (format === 'text' ? 'txt' : format || 'jsonl')
          : 'jsonl';
  return `ldx-${service}-result.${extension}`;
}

function RunDetailDialog({
  serviceId,
  record,
  loading,
  onClose,
  onSaveResult,
}: {
  serviceId: ServiceId;
  record: JobRecord | null;
  loading: boolean;
  onClose: () => void;
  onSaveResult: (fileId: string, name: string) => void;
}) {
  const service = SERVICE_BY_ID[serviceId];
  const Icon = service.icon;
  const [copied, setCopied] = useState(false);
  const result = record ? detailText(record) : '';

  async function copy() {
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="modal-scrim" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="run-detail-modal" role="dialog" aria-modal="true" aria-labelledby="run-detail-title">
        <header className="run-detail-header"><span className={`run-detail-icon ${service.accent}`}><Icon size={17} /></span><span className="run-detail-title"><small>RUN DETAILS</small><h3 id="run-detail-title">{service.title}</h3></span><button type="button" className="icon-button" onClick={onClose} aria-label="Close"><X size={17} /></button></header>
        {loading || !record ? <div className="run-detail-loading"><span className="spinner" /> Loading job details…</div> : (
          <>
            <div className="run-detail-meta">
              <div><small>STATUS</small><StatusPill status={record.status} /></div>
              <div><small>JOB ID</small><code>{record.job_id}</code></div>
              <div><small>CREATED</small><span>{formatDate(record.created_at)}</span></div>
              {(record.model || record.engine) && <div><small>{record.model ? 'MODEL' : 'ENGINE'}</small><code>{String(record.model || record.engine)}</code></div>}
            </div>
            {record.error && <div className="run-error-detail">{typeof record.error === 'string' ? record.error : record.error.message || 'The job failed.'}</div>}
            <div className="run-detail-output-head"><span><FileOutput size={15} /> JOB RESPONSE</span><button type="button" className="text-link" onClick={copy}>{copied ? 'Copied' : 'Copy JSON'}</button></div>
            <pre className="run-detail-json">{result}</pre>
            {record.output_file_id && <button type="button" className="button button-primary" onClick={() => onSaveResult(String(record.output_file_id), getOutputName(serviceId, record))}><ArrowDownToLine size={15} /> Save output file</button>}
          </>
        )}
      </section>
    </div>
  );
}

export default function RunsView({
  runs,
  loading,
  error,
  updatedAt,
  onRefresh,
  onView,
  detail,
  detailLoading,
  onCloseDetail,
  onSaveResult,
}: RunsViewProps) {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => runs.filter((run) => {
    const service = SERVICE_BY_ID[run.service];
    const search = `${service.title} ${run.job_id} ${run.model || ''} ${run.engine || ''} ${run.status}`.toLowerCase();
    return search.includes(query.toLowerCase());
  }), [runs, query]);
  const activeCount = runs.filter((run) => ['queued', 'processing'].includes(run.status.toLowerCase())).length;

  return (
    <div className="runs-page">
      <div className="runs-hero">
        <div><span className="eyebrow"><Activity size={14} /> YOUR API ACTIVITY</span><h2>Every run,<br /><span>in the loop.</span></h2><p>Track async jobs created with your LDX hub key. Open any run for its latest status and result.</p></div>
        <div className="runs-summary-card"><span className="runs-summary-icon"><Clock3 size={17} /></span><span><b>{runs.length}</b><small>recent jobs</small></span><i /><span><b>{activeCount}</b><small>in progress</small></span></div>
      </div>
      <div className="runs-toolbar">
        <div className="runs-toolbar-title"><b>Recent jobs</b><span>{updatedAt ? `Synced ${new Date(updatedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : 'Across all services'}</span></div>
        <div className="runs-toolbar-actions"><label className="catalog-search"><Search size={14} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search jobs…" /></label><button type="button" className="catalog-refresh-button" onClick={onRefresh} disabled={loading}>{loading ? <span className="spinner spinner-small" /> : <RefreshCw size={14} className={loading ? 'spin' : ''} />} {loading ? 'Refreshing' : 'Refresh jobs'}</button></div>
      </div>
      {error && <div className="catalog-error-banner"><Activity size={15} /><span>{error}</span><button type="button" onClick={onRefresh}>Retry</button></div>}
      <div className="runs-table-wrap">
        <div className="runs-table-header"><span>WORKFLOW</span><span>MODEL / ENGINE</span><span>JOB ID</span><span>CREATED</span><span>STATUS</span><span /></div>
        {loading && runs.length === 0 ? (
          <div className="runs-loading"><span className="spinner" /><span>Loading job history from LDX hub…</span></div>
        ) : filtered.length ? filtered.map((run) => {
          const service = SERVICE_BY_ID[run.service];
          const Icon = service.icon;
          return (
            <button type="button" className="runs-table-row" key={`${run.service}-${run.job_id}`} onClick={() => onView(run)}>
              <span className="run-service-cell"><i className={`run-service-icon ${service.accent}`}><Icon size={15} /></i><b>{service.title}</b></span>
              <span className="run-model-cell">{run.model || run.engine || <i>—</i>}</span>
              <code className="run-id-cell">{run.job_id}</code>
              <span className="run-date-cell">{formatDate(run.created_at)}</span>
              <StatusPill status={run.status} />
              <span className="run-open-icon"><ArrowUpRight size={14} /></span>
            </button>
          );
        }) : (
          <div className="runs-empty"><span className="runs-empty-icon"><FileOutput size={19} /></span><b>{query ? 'No matching jobs' : 'No jobs yet'}</b><p>{query ? 'Try a different search term.' : 'Start a workflow to see the job status and result here.'}</p><button className="text-link" type="button" onClick={onRefresh}><RefreshCw size={13} /> Refresh history</button></div>
        )}
      </div>
      <div className="runs-footnote"><span>Job results are retained by LDX hub for a limited time.</span><button type="button" className="text-link" onClick={onRefresh}>Refresh history <ArrowUpRight size={13} /></button></div>
      {detail && <RunDetailDialog serviceId={detail.service} record={detail.record} loading={detailLoading} onClose={onCloseDetail} onSaveResult={onSaveResult} />}
    </div>
  );
}
