import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  appVersion as readAppVersion,
  connect as connectApiKey,
  createJob,
  discoverCatalog,
  disconnect as disconnectApiKey,
  getJob,
  getKeyStatus,
  listJobs,
  openExternal,
  readFileText,
  saveFile,
  toRecentRun,
  uploadFile,
} from './lib/api';
import { emptyCatalog, SERVICE_LIST } from './services';
import type { ActiveRun, Catalog, CatalogErrors, JobRecord, KeyStatus, RecentRun, ServiceId } from './types';
import BrandMark from './components/BrandMark';
import CatalogView from './components/CatalogView';
import KeySetup from './components/KeySetup';
import RunsView from './components/RunsView';
import SettingsView from './components/SettingsView';
import Sidebar, { type ScreenId } from './components/Sidebar';
import Toast, { type ToastMessage } from './components/Toast';
import Topbar from './components/Topbar';
import Workspace from './components/Workspace';
import type { RunSubmission } from './components/WorkflowForm';

const DOCS_URL = 'https://gw.portal.ldxhub.io/api';

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function stageFromStatus(status?: string): ActiveRun['stage'] {
  const normalized = (status || '').toLowerCase();
  if (normalized === 'completed' || normalized === 'success') return 'completed';
  if (normalized === 'failed' || normalized === 'error') return 'failed';
  if (normalized === 'processing' || normalized === 'running') return 'processing';
  return 'queued';
}

function normalizeProgress(value?: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  return value > 0 && value <= 1 ? value * 100 : value;
}

function messageForStage(stage: ActiveRun['stage'], service: ServiceId) {
  if (stage === 'uploading') return 'Uploading your file securely to LDX hub…';
  if (stage === 'submitting') return 'Submitting your job to LDX hub…';
  if (stage === 'queued') return 'Queued by LDX hub. Waiting for processing…';
  if (stage === 'processing') return `${SERVICE_LIST.find((item) => item.id === service)?.title || 'Your workflow'} is processing your request…`;
  if (stage === 'completed') return 'Your output is ready to review.';
  return 'The job did not complete successfully.';
}

function SplashScreen() {
  return (
    <main className="boot-screen">
      <BrandMark />
      <span className="spinner boot-spinner" />
      <p>Preparing your workspace…</p>
    </main>
  );
}

export default function App() {
  const [booting, setBooting] = useState(true);
  const [bootError, setBootError] = useState('');
  const [keyStatus, setKeyStatus] = useState<KeyStatus | null>(null);
  const [screen, setScreen] = useState<ScreenId>('workspace');
  const [pendingService, setPendingService] = useState<ServiceId | null>(null);
  const [catalog, setCatalog] = useState<Catalog>(emptyCatalog());
  const [catalogErrors, setCatalogErrors] = useState<CatalogErrors>({});
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogUpdatedAt, setCatalogUpdatedAt] = useState<string>();
  const [apiHealthy, setApiHealthy] = useState<boolean | null>(null);
  const [activeRun, setActiveRun] = useState<ActiveRun | null>(null);
  const [runs, setRuns] = useState<RecentRun[]>([]);
  const [runsLoading, setRunsLoading] = useState(false);
  const [runsError, setRunsError] = useState('');
  const [runsUpdatedAt, setRunsUpdatedAt] = useState<string>();
  const [runDetail, setRunDetail] = useState<{ service: ServiceId; record: JobRecord } | null>(null);
  const [runDetailLoading, setRunDetailLoading] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [version, setVersion] = useState('1.0.0');

  const notify = useCallback((kind: ToastMessage['kind'], title: string, detail?: string) => {
    setToast({ id: Date.now(), kind, title, detail });
  }, []);

  const refreshCatalog = useCallback(async () => {
    setCatalogLoading(true);
    try {
      const discovered = await discoverCatalog();
      setApiHealthy(true);
      setCatalog(discovered.items);
      setCatalogErrors(discovered.errors);
      setCatalogUpdatedAt(discovered.updatedAt);
      const count = Object.values(discovered.items).reduce((total, values) => total + values.length, 0);
      if (count > 0) notify('success', 'Catalog synced', `${count} models and engines found.`);
      if (count === 0 && Object.keys(discovered.errors).length) notify('error', 'Catalog could not be loaded', 'Check your connection and API access, then retry.');
    } catch (error) {
      setApiHealthy(false);
      const message = error instanceof Error ? error.message : 'Unable to refresh the LDX hub catalog.';
      setCatalogErrors(Object.fromEntries(SERVICE_LIST.map((service) => [service.id, message])) as CatalogErrors);
      notify('error', 'Catalog sync failed', message);
    } finally {
      setCatalogLoading(false);
    }
  }, [notify]);

  const loadRuns = useCallback(async (silent = false) => {
    if (!silent) setRunsLoading(true);
    setRunsError('');
    try {
      const responses = await Promise.allSettled(SERVICE_LIST.map(async (service) => {
        const entries = await listJobs(service.id);
        return entries.map((record) => toRecentRun(service.id, record));
      }));
      const resolved = responses.filter((result): result is PromiseFulfilledResult<RecentRun[]> => result.status === 'fulfilled');
      const rejectedCount = responses.length - resolved.length;
      const allRuns = resolved.flatMap((result) => result.value).sort((left, right) => {
        const leftDate = left.created_at ? new Date(left.created_at).getTime() : 0;
        const rightDate = right.created_at ? new Date(right.created_at).getTime() : 0;
        return rightDate - leftDate;
      });
      setRuns(allRuns);
      setRunsUpdatedAt(new Date().toISOString());
      if (rejectedCount === responses.length) setRunsError('Unable to load job history. Verify your API key and try again.');
      else if (rejectedCount > 0) setRunsError(`${rejectedCount} service${rejectedCount === 1 ? '' : 's'} could not return history. Showing available jobs.`);
    } catch (error) {
      setRunsError(error instanceof Error ? error.message : 'Unable to load job history.');
    } finally {
      setRunsLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    Promise.all([getKeyStatus(), readAppVersion()]).then(([status, appVersion]) => {
      if (!mounted) return;
      setKeyStatus(status);
      setVersion(appVersion);
      setBooting(false);
      if (status.configured) void refreshCatalog();
    }).catch((error) => {
      if (!mounted) return;
      setBootError(error instanceof Error ? error.message : 'Unable to read saved credentials.');
      setKeyStatus({ configured: false, masked: null, secureStorage: false, desktop: Boolean(window.ldx) });
      setBooting(false);
    });
    return () => { mounted = false; };
  }, [refreshCatalog]);

  useEffect(() => {
    if (screen === 'runs' && keyStatus?.configured) void loadRuns();
  }, [screen, keyStatus?.configured, loadRuns]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setScreen('catalog');
      }
    }
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  const connectKey = useCallback(async (key: string) => {
    const result = await connectApiKey(key);
    setKeyStatus(result);
    setApiHealthy(true);
    setBootError('');
    void refreshCatalog();
    return result;
  }, [refreshCatalog]);

  const removeKey = useCallback(async () => {
    const result = await disconnectApiKey();
    setKeyStatus(result);
    setApiHealthy(false);
    setCatalog(emptyCatalog());
    setCatalogErrors({});
    setCatalogUpdatedAt(undefined);
    setRuns([]);
    setActiveRun(null);
    setScreen('workspace');
    notify('success', 'API key removed', 'This device is disconnected from LDX hub.');
  }, [notify]);

  const startRun = useCallback(async ({ service, body: requestBody, file }: RunSubmission) => {
    if (activeRun && ['uploading', 'submitting', 'queued', 'processing'].includes(activeRun.stage)) {
      notify('info', 'A job is already running', 'Wait for it to finish before starting another workflow.');
      return;
    }
    let runBody = { ...requestBody };
    setActiveRun({ service, stage: file ? 'uploading' : 'submitting', progress: 0, message: messageForStage(file ? 'uploading' : 'submitting', service) });

    try {
      if (file) {
        const upload = await uploadFile(file);
        runBody.file_id = upload.file_id;
      }
      setActiveRun({ service, stage: 'submitting', progress: 0, message: messageForStage('submitting', service) });
      let job = await createJob(service, runBody);
      if (!job.job_id) throw new Error('LDX hub accepted the request but did not return a job ID.');
      const jobId = job.job_id;
      job = { ...job, ...('output_format' in runBody ? { output_format: runBody.output_format } : {}) };
      let stage = stageFromStatus(job.status);
      setActiveRun({ service, job_id: jobId, stage, progress: normalizeProgress(job.progress), message: messageForStage(stage, service), job });

      const startedAt = Date.now();
      while (stage !== 'completed' && stage !== 'failed') {
        if (Date.now() - startedAt > 30 * 60 * 1000) {
          setActiveRun({ service, job_id: jobId, stage: 'processing', progress: normalizeProgress(job.progress), message: 'This job is still running. Check Run history for the latest status.', job });
          notify('info', 'Job is taking longer than usual', 'It will continue processing on LDX hub. Check Run history for updates.');
          break;
        }
        await delay(2500);
        job = await getJob(service, jobId);
        if (!job.job_id) job.job_id = jobId;
        job = { ...job, ...('output_format' in runBody ? { output_format: runBody.output_format } : {}) };
        stage = stageFromStatus(job.status);
        setActiveRun({
          service,
          job_id: jobId,
          stage,
          progress: normalizeProgress(job.progress),
          message: messageForStage(stage, service),
          job,
        });
      }

      if (stage === 'completed') {
        let resultText: string | undefined;
        const outputId = typeof job.output_file_id === 'string' ? job.output_file_id : undefined;
        const textServices: ServiceId[] = ['analyzedoc', 'structflow', 'extractdoc', 'refineloop'];
        if (outputId && textServices.includes(service)) {
          try {
            resultText = await readFileText(outputId);
          } catch {
            // The output remains downloadable even if the preview request cannot be completed.
          }
        }
        setActiveRun({ service, job_id: jobId, stage: 'completed', progress: 100, message: messageForStage('completed', service), job, resultText });
        notify('success', 'Workflow completed', `${SERVICE_LIST.find((item) => item.id === service)?.title || 'Your job'} is ready.`);
        void loadRuns(true);
      } else if (stage === 'failed') {
        setActiveRun({ service, job_id: jobId, stage: 'failed', progress: normalizeProgress(job.progress), message: messageForStage('failed', service), job });
        const failure = typeof job.error === 'string' ? job.error : job.error?.message;
        notify('error', 'Workflow failed', failure || 'Open the run details for more information.');
        void loadRuns(true);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'The workflow could not be completed.';
      setActiveRun((current) => current ? {
        ...current,
        stage: 'failed',
        message,
        job: current.job ? { ...current.job, error: { message } } : { job_id: '', status: 'failed', error: { message } },
      } : null);
      notify('error', 'Unable to start workflow', message);
    }
  }, [activeRun, loadRuns, notify]);

  const viewRun = useCallback(async (run: RecentRun) => {
    const placeholder = { ...run, job_id: run.job_id } as JobRecord;
    setRunDetail({ service: run.service, record: placeholder });
    setRunDetailLoading(true);
    try {
      const record = await getJob(run.service, run.job_id);
      setRunDetail({ service: run.service, record });
    } catch (error) {
      notify('error', 'Could not load run details', error instanceof Error ? error.message : 'Try refreshing job history.');
      setRunDetail(null);
    } finally {
      setRunDetailLoading(false);
    }
  }, [notify]);

  const saveOutput = useCallback(async (fileId: string, name: string) => {
    try {
      const result = await saveFile(fileId, name);
      if (result.saved) notify('success', 'Output saved', result.path || name);
    } catch (error) {
      notify('error', 'Download failed', error instanceof Error ? error.message : 'Unable to save the output file.');
    }
  }, [notify]);

  const modelCount = useMemo(() => Object.values(catalog).reduce((total, items) => total + items.length, 0), [catalog]);

  if (booting || !keyStatus) return <SplashScreen />;
  if (!keyStatus.configured) {
    return <>
      <KeySetup onConnect={connectKey} initialError={bootError} onOpenDocs={() => void openExternal(DOCS_URL)} />
      <Toast toast={toast} onClose={() => setToast(null)} />
    </>;
  }

  return (
    <div className="app-shell">
      <Sidebar active={screen} onNavigate={setScreen} keyStatus={keyStatus} onOpenDocs={() => void openExternal(DOCS_URL)} />
      <div className="app-main">
        <Topbar screen={screen} modelCount={modelCount} connected={apiHealthy} refreshing={catalogLoading} onRefresh={() => void refreshCatalog()} onSearch={() => setScreen('catalog')} />
        <main className="main-scroll-area" key={screen}>
          {screen === 'workspace' && <Workspace
            catalog={catalog}
            catalogErrors={catalogErrors}
            catalogLoading={catalogLoading}
            activeRun={activeRun}
            onRefreshCatalog={() => void refreshCatalog()}
            onStartRun={(submission) => void startRun(submission)}
            onSaveResult={(fileId, name) => void saveOutput(fileId, name)}
            initialService={pendingService}
            onInitialServiceOpened={() => setPendingService(null)}
          />}
          {screen === 'catalog' && <CatalogView
            catalog={catalog}
            errors={catalogErrors}
            loading={catalogLoading}
            updatedAt={catalogUpdatedAt}
            onRefresh={() => void refreshCatalog()}
            onOpenService={(service) => { setPendingService(service); setScreen('workspace'); }}
          />}
          {screen === 'runs' && <RunsView
            runs={runs}
            loading={runsLoading}
            error={runsError}
            updatedAt={runsUpdatedAt}
            onRefresh={() => void loadRuns()}
            onView={(run) => void viewRun(run)}
            detail={runDetail}
            detailLoading={runDetailLoading}
            onCloseDetail={() => setRunDetail(null)}
            onSaveResult={(fileId, name) => void saveOutput(fileId, name)}
          />}
          {screen === 'settings' && <SettingsView
            keyStatus={keyStatus}
            appVersion={version}
            catalogUpdatedAt={catalogUpdatedAt}
            refreshing={catalogLoading}
            onConnect={connectKey}
            onDisconnect={removeKey}
            onRefreshCatalog={() => void refreshCatalog()}
            onOpenPortal={() => void openExternal(DOCS_URL)}
          />}
        </main>
      </div>
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
