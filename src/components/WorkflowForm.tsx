import { useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent, type FormEvent } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  CircleHelp,
  CloudUpload,
  FileCheck2,
  FileInput,
  FileOutput,
  LockKeyhole,
  RefreshCw,
  Sparkles,
  X,
} from 'lucide-react';
import type { ActiveRun, Catalog, CatalogItem, ServiceDefinition, ServiceId } from '../types';
import StatusPill from './StatusPill';

export interface RunSubmission {
  service: ServiceId;
  body: Record<string, unknown>;
  file?: File;
}

interface WorkflowFormProps {
  service: ServiceDefinition;
  catalog: Catalog;
  catalogErrors: Partial<Record<ServiceId, string>>;
  catalogLoading: boolean;
  busy: boolean;
  activeRun: ActiveRun | null;
  onBack: () => void;
  onSubmit: (submission: RunSubmission) => void;
  onRefreshCatalog: () => void;
  onSaveResult: (fileId: string, name: string) => void;
}

const sampleSchema = JSON.stringify({
  invoice_number: 'INV-1042',
  invoice_date: '2025-10-02',
  vendor: 'Acme Labs',
  total: 1284.5,
  currency: 'USD',
  due_date: null,
}, null, 2);

const sampleRecords = JSON.stringify([
  {
    record_id: 'INV-1042',
    text: 'Invoice from Acme Labs dated 2025-10-02. Total: USD 1,284.50. Payment due 2025-11-01.',
  },
], null, 2);

const ACCEPT: Record<ServiceId, string> = {
  structflow: '',
  analyzedoc: '.pdf,.jpg,.jpeg,.png',
  refineloop: '.xlf,.xliff',
  renderocr: '.pdf,.tif,.tiff,.jpg,.jpeg,.png,.bmp',
  castdoc: '.pdf',
  extractdoc: '.pdf,.docx,.xlsx,.pptx',
};

const FILE_HELP: Record<ServiceId, string> = {
  structflow: '',
  analyzedoc: 'PDF or image · up to 200 MB',
  refineloop: 'XLIFF file · up to 200 MB',
  renderocr: 'PDF, TIFF, JPEG, PNG, or BMP · up to 200 MB',
  castdoc: 'Digital PDF · up to 200 MB',
  extractdoc: 'PDF, DOCX, XLSX, or PPTX · up to 200 MB',
};

function labelForItem(item: CatalogItem): string {
  return item.display_name || item.id;
}

function prettyBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileDrop({
  file,
  accept,
  help,
  onFile,
  onRemove,
}: {
  file: File | null;
  accept: string;
  help: string;
  onFile: (file: File | null) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');

  function setCandidate(candidate?: File) {
    if (!candidate) return;
    if (candidate.size > 200 * 1024 * 1024) {
      setError('This file is larger than the 200 MB upload limit.');
      return;
    }
    const extension = `.${candidate.name.split('.').pop()?.toLowerCase() || ''}`;
    const allowed = accept.split(',').map((value) => value.trim().toLowerCase()).filter(Boolean);
    if (allowed.length > 0 && !allowed.includes(extension)) {
      setError(`This workflow does not support ${extension}. Choose one of: ${allowed.join(', ')}.`);
      return;
    }
    setError('');
    onFile(candidate);
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    setCandidate(event.target.files?.[0]);
    event.target.value = '';
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    setCandidate(event.dataTransfer.files?.[0]);
  }

  return (
    <div>
      {file ? (
        <div className="selected-file">
          <span className="selected-file-icon"><FileCheck2 size={18} /></span>
          <span className="selected-file-copy"><b>{file.name}</b><small>{prettyBytes(file.size)} <i>·</i> Ready to upload</small></span>
          <button className="icon-button remove-file" type="button" onClick={onRemove} aria-label="Remove file"><X size={15} /></button>
        </div>
      ) : (
        <div
          className={`file-drop${dragging ? ' is-dragging' : ''}`}
          onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') inputRef.current?.click(); }}
        >
          <span className="file-drop-icon"><CloudUpload size={19} /></span>
          <span className="file-drop-copy"><b>Drop a file here or <em>browse files</em></b><small>{help}</small></span>
          <input ref={inputRef} type="file" accept={accept} onChange={handleChange} hidden />
        </div>
      )}
      {error && <p className="field-error file-error">{error}</p>}
    </div>
  );
}

function Field({ label, hint, children, className = '' }: { label: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`field ${className}`}>
      <div className="field-label-row"><label>{label}</label>{hint && <span className="field-hint">{hint}</span>}</div>
      {children}
    </div>
  );
}

function RunResult({ run, service, onSaveResult }: { run: ActiveRun; service: ServiceDefinition; onSaveResult: (fileId: string, name: string) => void }) {
  const [copied, setCopied] = useState(false);
  const isActive = ['uploading', 'submitting', 'queued', 'processing'].includes(run.stage);
  const result = run.job?.results || run.job?.summary;
  const outputId = run.job?.output_file_id;
  const resultText = run.resultText || (result ? JSON.stringify(result, null, 2) : '');

  async function copyResult() {
    if (!resultText) return;
    try {
      await navigator.clipboard.writeText(resultText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  const outputExt = service.id === 'analyzedoc' ? 'json'
    : service.id === 'refineloop' ? 'xlf'
      : service.id === 'renderocr' ? String(run.job?.output_format || 'docx')
        : service.id === 'castdoc' ? String(run.job?.output_format || 'docx')
          : service.id === 'extractdoc' ? (run.job?.output_format === 'text' ? 'txt' : String(run.job?.output_format || 'jsonl'))
            : 'jsonl';

  return (
    <section className={`run-result-card${isActive ? ' run-result-active' : ''}`}>
      <div className="run-result-head">
        <div className="run-result-heading">
          <span className={`run-result-icon ${service.accent}`}><service.icon size={17} /></span>
          <span><small>RUN STATUS</small><b>{isActive ? 'Your task is in progress' : run.stage === 'completed' ? 'Task completed' : 'Task failed'}</b></span>
        </div>
        <StatusPill status={run.stage} />
      </div>
      <div className="run-progress-copy"><span>{run.message}</span>{isActive && run.progress > 0 && <b>{Math.round(run.progress)}%</b>}</div>
      {isActive && <div className="run-progress-track"><span style={{ width: run.progress > 0 ? `${Math.min(run.progress, 100)}%` : undefined }} className={run.progress <= 0 ? 'progress-indeterminate' : ''} /></div>}
      {run.job?.job_id && <div className="run-job-id">Job <code>{run.job.job_id}</code></div>}
      {run.stage === 'failed' && run.job?.error && (
        <div className="run-error-detail">{typeof run.job.error === 'string' ? run.job.error : run.job.error.message || 'The job failed.'}</div>
      )}
      {run.stage === 'completed' && (resultText || outputId) && (
        <div className="run-output-block">
          <div className="run-output-head"><span><FileOutput size={15} /> OUTPUT</span>{resultText && <button type="button" className="text-link subtle-link" onClick={copyResult}>{copied ? <><Check size={13} /> Copied</> : 'Copy'}</button>}</div>
          {resultText ? <pre className="run-output-pre">{resultText}</pre> : <div className="output-file-ready"><FileCheck2 size={16} /> Output file is ready to save.</div>}
          {outputId && <button className="button button-secondary save-output-button" type="button" onClick={() => onSaveResult(outputId, `ldx-${service.id}-result.${outputExt}`)}><FileOutput size={15} /> Save output file</button>}
        </div>
      )}
      {run.stage === 'completed' && !resultText && !outputId && <div className="run-complete-note"><Check size={15} /> LDX hub completed this job successfully.</div>}
      {run.job?.usage && <div className="run-usage-note">Usage details included in the job response.</div>}
    </section>
  );
}

export default function WorkflowForm({
  service,
  catalog,
  catalogErrors,
  catalogLoading,
  busy,
  activeRun,
  onBack,
  onSubmit,
  onRefreshCatalog,
  onSaveResult,
}: WorkflowFormProps) {
  const items = catalog[service.id] || [];
  const [selectedItem, setSelectedItem] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState(service.id === 'structflow'
    ? 'Extract the invoice details from each record. Preserve the original currency and use ISO dates where possible.'
    : 'Read the document and extract the requested information accurately. Use null when a value is not present.');
  const [schema, setSchema] = useState(sampleSchema);
  const [records, setRecords] = useState(sampleRecords);
  const [languages, setLanguages] = useState('en');
  const [outputFormat, setOutputFormat] = useState('docx');
  const [domain, setDomain] = useState('');
  const [noteLanguage, setNoteLanguage] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');
  const [maxRevisions, setMaxRevisions] = useState(6);
  const [excludeNumeric, setExcludeNumeric] = useState(false);
  const [removeHyphenation, setRemoveHyphenation] = useState(true);
  const [outputMode, setOutputMode] = useState('full');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (items.length === 0) {
      setSelectedItem('');
      return;
    }
    if (!items.some((item) => item.id === selectedItem)) setSelectedItem(items[0].id);
  }, [items, selectedItem]);

  useEffect(() => {
    setFile(null);
    setFormError('');
    setPrompt(service.id === 'structflow'
      ? 'Extract the invoice details from each record. Preserve the original currency and use ISO dates where possible.'
      : 'Read the document and extract the requested information accurately. Use null when a value is not present.');
  }, [service.id]);

  const selected = useMemo(() => items.find((item) => item.id === selectedItem), [items, selectedItem]);
  const isFileWorkflow = service.id !== 'structflow';
  const currentRun = activeRun?.service === service.id ? activeRun : null;

  function parseObject(raw: string, label: string): Record<string, unknown> | null {
    try {
      const value = JSON.parse(raw) as unknown;
      if (!value || typeof value !== 'object' || Array.isArray(value)) {
        setFormError(`${label} must be a JSON object.`);
        return null;
      }
      return value as Record<string, unknown>;
    } catch {
      setFormError(`${label} contains invalid JSON. Check commas and quotes.`);
      return null;
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError('');
    if (!selectedItem) {
      setFormError(`No ${service.catalogType} is available for ${service.title}. Refresh the catalog or check your API access.`);
      return;
    }
    if (isFileWorkflow && !file) {
      setFormError('Add a file before starting this workflow.');
      return;
    }

    let body: Record<string, unknown> = {};
    if (service.id === 'structflow' || service.id === 'analyzedoc') {
      const exampleOutput = parseObject(schema, 'Example output');
      if (!exampleOutput) return;
      if (!prompt.trim()) {
        setFormError('Add an instruction describing what you want extracted.');
        return;
      }
      if (service.id === 'structflow') {
        let parsedRecords: unknown;
        try {
          parsedRecords = JSON.parse(records);
        } catch {
          setFormError('Input records contain invalid JSON.');
          return;
        }
        if (!Array.isArray(parsedRecords) || parsedRecords.length === 0 || parsedRecords.some((row) => !row || typeof row !== 'object' || Array.isArray(row))) {
          setFormError('Input records must be a non-empty JSON array of objects.');
          return;
        }
        body = { model: selectedItem, system_prompt: prompt.trim(), example_output: exampleOutput, inputs: parsedRecords };
      } else {
        body = { model: selectedItem, system_prompt: prompt.trim(), example_output: exampleOutput, output_format: 'json' };
      }
    } else if (service.id === 'refineloop') {
      body = {
        model: selectedItem,
        exclude_numeric_segments: excludeNumeric,
        remove_hyphenation: removeHyphenation,
        max_revisions: maxRevisions,
        output_mode: outputMode,
        ...(domain.trim() ? { domain: domain.trim() } : {}),
        ...(noteLanguage.trim() ? { note_language: noteLanguage.trim() } : {}),
        ...(customInstructions.trim() ? { custom_instructions: customInstructions.trim() } : {}),
      };
    } else if (service.id === 'renderocr') {
      const languageList = languages.split(',').map((value) => value.trim()).filter(Boolean);
      if (languageList.length === 0) {
        setFormError('Add at least one OCR language code.');
        return;
      }
      body = { engine: selectedItem, languages: languageList, output_format: outputFormat };
    } else if (service.id === 'castdoc') {
      body = { engine: selectedItem, output_format: outputFormat };
    } else {
      body = { engine: selectedItem, output_format: outputFormat };
    }

    onSubmit({
      service: service.id,
      body,
      ...(file ? { file } : {}),
    });
  }

  return (
    <div className="workflow-page">
      <div className="workflow-back-row">
        <button type="button" className="back-link" onClick={onBack}><ArrowLeft size={15} /> All workflows</button>
        <span className="workflow-breadcrumb">Workspace <i>/</i> {service.title}</span>
      </div>
      <div className="workflow-title-row">
        <div>
          <div className="eyebrow"><span className={`eyebrow-icon ${service.accent}`}><service.icon size={13} /></span> LDX HUB WORKFLOW</div>
          <h2>{service.shortTitle}</h2>
          <p>{service.description}</p>
        </div>
        <span className={`workflow-title-icon ${service.accent}`}><service.icon size={21} /></span>
      </div>

      <div className="workflow-layout">
        <form className="workflow-form" onSubmit={handleSubmit}>
          <section className="form-section">
            <div className="form-section-heading"><span className="step-number">01</span><span><b>{isFileWorkflow ? 'Choose your input' : 'Add your records'}</b><small>{isFileWorkflow ? `Upload the source for ${service.title}.` : 'Provide the JSON records you want to structure.'}</small></span></div>
            {isFileWorkflow ? (
              <Field label="Source file" hint={FILE_HELP[service.id]}>
                <FileDrop file={file} accept={ACCEPT[service.id]} help={FILE_HELP[service.id]} onFile={setFile} onRemove={() => setFile(null)} />
              </Field>
            ) : (
              <Field label="Input records" hint="JSON array · one object per record">
                <textarea className="code-textarea records-textarea" value={records} onChange={(event) => setRecords(event.target.value)} spellCheck={false} />
                <div className="textarea-caption"><span><FileInput size={13} /> Sample invoice record included</span><span>JSON</span></div>
              </Field>
            )}
          </section>

          <section className="form-section">
            <div className="form-section-heading"><span className="step-number">02</span><span><b>Select a {service.catalogType}</b><small>Choose from the live LDX hub catalog.</small></span></div>
            <Field label={service.catalogType === 'model' ? 'AI model' : 'Processing engine'} hint={items.length ? `${items.length} available` : undefined}>
              {items.length > 0 ? (
                <div className="select-shell"><select value={selectedItem} onChange={(event) => setSelectedItem(event.target.value)}>
                  {items.map((item) => <option key={item.id} value={item.id}>{labelForItem(item)}{item.provider ? ` · ${item.provider}` : ''}</option>)}
                </select><ChevronDown size={15} /></div>
              ) : (
                <div className="empty-catalog-inline">
                  <span>{catalogLoading ? 'Loading available options…' : catalogErrors[service.id] || `No ${service.catalogType}s found for this workflow.`}</span>
                  <button type="button" onClick={onRefreshCatalog} disabled={catalogLoading}><RefreshCw size={13} className={catalogLoading ? 'spin' : ''} /> Refresh</button>
                </div>
              )}
            </Field>
            {selected?.description && <div className="selected-model-note"><Sparkles size={13} /><span>{selected.description}</span></div>}
          </section>

          {(service.id === 'structflow' || service.id === 'analyzedoc') && (
            <section className="form-section">
              <div className="form-section-heading"><span className="step-number">03</span><span><b>Describe what to extract</b><small>Instructions and an example shape guide the model output.</small></span></div>
              <Field label="Instructions" hint={`${prompt.length} characters`}>
                <textarea className="standard-textarea" value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Describe the fields to extract..." rows={3} />
              </Field>
              <Field label="Example output" hint="Valid JSON object">
                <textarea className="code-textarea schema-textarea" value={schema} onChange={(event) => setSchema(event.target.value)} spellCheck={false} />
                <div className="textarea-caption"><span><CircleHelp size={13} /> Use example values to define the output shape</span><span>JSON</span></div>
              </Field>
            </section>
          )}

          {service.id === 'refineloop' && (
            <section className="form-section">
              <div className="form-section-heading"><span className="step-number">03</span><span><b>Refinement preferences</b><small>Fine-tune how the translation is reviewed.</small></span></div>
              <div className="form-grid two-column">
                <Field label="Subject domain" hint="Optional"><input className="standard-input" value={domain} onChange={(event) => setDomain(event.target.value)} placeholder="e.g. legal, medical, finance" /></Field>
                <Field label="Notes language" hint="Optional"><input className="standard-input" value={noteLanguage} onChange={(event) => setNoteLanguage(event.target.value)} placeholder="e.g. en, ja, ko" /></Field>
                <Field label="Maximum revisions"><div className="select-shell"><select value={maxRevisions} onChange={(event) => setMaxRevisions(Number(event.target.value))}>{Array.from({ length: 10 }, (_, index) => index + 1).map((value) => <option key={value} value={value}>{value} {value === 1 ? 'revision' : 'revisions'}</option>)}</select><ChevronDown size={15} /></div></Field>
                <Field label="Output mode"><div className="select-shell"><select value={outputMode} onChange={(event) => setOutputMode(event.target.value)}><option value="full">Full XLIFF</option><option value="translations">Translations only</option><option value="none">None</option></select><ChevronDown size={15} /></div></Field>
              </div>
              <div className="toggle-row">
                <label className="toggle-control"><input type="checkbox" checked={excludeNumeric} onChange={(event) => setExcludeNumeric(event.target.checked)} /><span className="toggle-track" /><span>Skip numeric-only segments</span></label>
                <label className="toggle-control"><input type="checkbox" checked={removeHyphenation} onChange={(event) => setRemoveHyphenation(event.target.checked)} /><span className="toggle-track" /><span>Remove source hyphenation</span></label>
              </div>
              <Field label="Additional instructions" hint="Optional">
                <textarea className="standard-textarea" rows={3} value={customInstructions} onChange={(event) => setCustomInstructions(event.target.value)} placeholder="Add terminology, tone, or review guidance…" />
              </Field>
            </section>
          )}

          {(service.id === 'renderocr' || service.id === 'castdoc' || service.id === 'extractdoc') && (
            <section className="form-section">
              <div className="form-section-heading"><span className="step-number">03</span><span><b>Choose the output</b><small>Set the file format for your completed result.</small></span></div>
              <div className="form-grid two-column">
                {service.id === 'renderocr' && <Field label="OCR languages" hint="Comma-separated codes · first used"><input className="standard-input" value={languages} onChange={(event) => setLanguages(event.target.value)} placeholder="en, ar, fr" /></Field>}
                <Field label="Output format"><div className="select-shell"><select value={outputFormat} onChange={(event) => setOutputFormat(event.target.value)}>
                  {service.id === 'extractdoc' ? <><option value="text">Plain text</option><option value="jsonl">JSONL</option></> : <><option value="docx">Word · DOCX</option><option value="xlsx">Excel · XLSX</option><option value="pptx">PowerPoint · PPTX</option></>}
                </select><ChevronDown size={15} /></div></Field>
              </div>
            </section>
          )}

          {formError && <div className="form-alert"><CircleHelp size={16} /><span>{formError}</span></div>}
          <div className="form-submit-row">
            <button className="button button-primary" disabled={busy || !selectedItem} type="submit">
              {busy ? <><span className="spinner" /> Working…</> : <>{service.action} <ArrowRight size={16} /></>}
            </button>
            <span><LockKeyhole size={13} /> Runs directly through your LDX hub key</span>
          </div>
        </form>

        <aside className="workflow-rail">
          <div className="rail-card rail-model-card">
            <div className="rail-card-kicker">SELECTED {service.catalogType.toUpperCase()}</div>
            <div className="rail-model-mark"><service.icon size={17} /></div>
            <h3>{selected ? labelForItem(selected) : catalogLoading ? 'Loading catalog…' : 'No selection yet'}</h3>
            <p>{selected?.provider ? `${selected.provider} · ` : ''}{selected?.id || 'Refresh the catalog to see available options.'}</p>
            {selected?.supported_conversions && selected.supported_conversions.length > 0 && (
              <div className="supported-formats"><span>SUPPORTED FORMATS</span><div>{[...new Set(selected.supported_conversions.map((conversion) => conversion.from.toUpperCase()))].map((format) => <i key={format}>{format}</i>)}</div></div>
            )}
          </div>
          <div className="rail-card rail-steps-card">
            <div className="rail-card-kicker">WHAT HAPPENS NEXT</div>
            <div className="process-steps">
              <div className="process-step"><span className="process-step-num">1</span><span><b>Secure upload</b><small>Your file is sent to LDX hub over HTTPS.</small></span></div>
              <div className="process-step"><span className="process-step-num">2</span><span><b>Async processing</b><small>Track the job as it runs in the cloud.</small></span></div>
              <div className="process-step"><span className="process-step-num">3</span><span><b>Save your result</b><small>Review and download the finished output.</small></span></div>
            </div>
          </div>
          <div className="rail-note"><LockKeyhole size={14} /><span>Files are uploaded to LDX hub and may expire according to the service retention policy.</span></div>
        </aside>
      </div>
      {currentRun && <RunResult run={currentRun} service={service} onSaveResult={onSaveResult} />}
    </div>
  );
}
