import { CATALOG_ENDPOINTS, SERVICE_LIST, emptyCatalog } from '../services';
import type {
  Catalog,
  CatalogErrors,
  CatalogItem,
  CatalogResponse,
  ConnectResponse,
  JobRecord,
  KeyStatus,
  RecentRun,
  ServiceId,
  UploadResult,
} from '../types';

const API_BASE = 'https://gw.ldxhub.io';
let previewKey: string | null = null;

function maskKey(key: string): string {
  const tail = key.slice(-4);
  return `••••••••${tail}`;
}

function unwrapObject<T>(value: unknown): T {
  if (value && typeof value === 'object' && 'data' in value) {
    const inner = (value as { data?: unknown }).data;
    if (inner && typeof inner === 'object' && !Array.isArray(inner)) return inner as T;
  }
  return (value ?? {}) as T;
}

function unwrapArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if (Array.isArray(record.data)) return record.data;
    if (Array.isArray(record.items)) return record.items;
    if (Array.isArray(record.results)) return record.results;
  }
  return [];
}

function getErrorMessage(body: unknown, status: number): string {
  if (body && typeof body === 'object') {
    const record = body as Record<string, unknown>;
    const nested = record.error && typeof record.error === 'object'
      ? record.error as Record<string, unknown>
      : undefined;
    const message = nested?.message ?? record.message;
    if (typeof message === 'string' && message.trim()) return message;
    if (typeof record.detail === 'string' && record.detail.trim()) return record.detail;
  }
  if (status === 401) return 'That API key was not accepted. Check it and try again.';
  if (status === 403) return 'This key does not have permission for that operation.';
  if (status === 429) return 'The API is rate-limiting requests. Wait a moment and retry.';
  return `The LDX hub request failed (HTTP ${status}).`;
}

async function fetchJson(path: string, key = previewKey, init: RequestInit = {}): Promise<unknown> {
  const headers = new Headers(init.headers);
  if (key) headers.set('Authorization', `Bearer ${key}`);
  if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, { ...init, headers });
  } catch {
    throw new Error('Could not reach LDX hub. Check your internet connection and try again.');
  }

  const text = await response.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }
  if (!response.ok) throw new Error(getErrorMessage(body, response.status));
  return body;
}

export async function getKeyStatus(): Promise<KeyStatus> {
  if (window.ldx) return window.ldx.getKeyStatus();
  return {
    configured: Boolean(previewKey),
    masked: previewKey ? maskKey(previewKey) : null,
    secureStorage: false,
    desktop: false,
  };
}

export async function connect(key: string): Promise<ConnectResponse> {
  const cleanKey = key.trim();
  if (cleanKey.length < 8) throw new Error('Enter a valid API key to continue.');
  if (window.ldx) return window.ldx.connect(cleanKey);

  await fetchJson('/files', cleanKey);
  previewKey = cleanKey;
  return {
    configured: true,
    masked: maskKey(cleanKey),
    secureStorage: false,
    desktop: false,
  };
}

export async function disconnect(): Promise<KeyStatus> {
  if (window.ldx) return window.ldx.disconnect();
  previewKey = null;
  return {
    configured: false,
    masked: null,
    secureStorage: false,
    desktop: false,
  };
}

function catalogItems(response: unknown): CatalogItem[] {
  return unwrapArray(response).filter(
    (item): item is CatalogItem => Boolean(item && typeof item === 'object' && typeof (item as CatalogItem).id === 'string'),
  );
}

export async function discoverCatalog(): Promise<CatalogResponse> {
  if (window.ldx) return window.ldx.discoverCatalog();
  if (!previewKey) throw new Error('Connect an API key before refreshing the catalog.');

  // A protected request confirms that the locally entered key is still valid.
  await fetchJson('/files');
  const items: Catalog = emptyCatalog();
  const errors: CatalogErrors = {};
  await Promise.all(SERVICE_LIST.map(async ({ id }) => {
    try {
      items[id] = catalogItems(await fetchJson(CATALOG_ENDPOINTS[id]));
    } catch (error) {
      errors[id] = error instanceof Error ? error.message : 'Unable to load this catalog.';
    }
  }));
  return { items, errors, updatedAt: new Date().toISOString() };
}

export async function uploadFile(file: File): Promise<UploadResult> {
  if (!previewKey && !window.ldx) throw new Error('Connect an API key before uploading a file.');
  if (window.ldx) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    return window.ldx.uploadFile({ name: file.name, type: file.type || 'application/octet-stream', bytes });
  }
  const form = new FormData();
  form.append('file', file, file.name);
  return unwrapObject<UploadResult>(await fetchJson('/files', previewKey, { method: 'POST', body: form }));
}

function jobPath(service: ServiceId, jobId?: string): string {
  const base = `/${service}/jobs`;
  return jobId ? `${base}/${encodeURIComponent(jobId)}` : base;
}

export async function createJob(service: ServiceId, body: Record<string, unknown>): Promise<JobRecord> {
  if (window.ldx) return window.ldx.createJob(service, body);
  return unwrapObject<JobRecord>(await fetchJson(jobPath(service), previewKey, {
    method: 'POST',
    body: JSON.stringify(body),
  }));
}

export async function getJob(service: ServiceId, jobId: string): Promise<JobRecord> {
  if (window.ldx) return window.ldx.getJob(service, jobId);
  return unwrapObject<JobRecord>(await fetchJson(jobPath(service, jobId)));
}

export async function listJobs(service: ServiceId): Promise<JobRecord[]> {
  if (window.ldx) return window.ldx.listJobs(service);
  return unwrapArray(await fetchJson(jobPath(service))).filter(
    (item): item is JobRecord => Boolean(item && typeof item === 'object'),
  );
}

async function readTextPreview(response: Response, maxBytes = 512 * 1024): Promise<string> {
  if (!response.body) return response.text();
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let text = '';
  let total = 0;
  let truncated = false;
  while (true) {
    const { value, done } = await reader.read();
    if (done || !value) break;
    const remaining = maxBytes - total;
    if (value.byteLength > remaining) {
      text += decoder.decode(value.subarray(0, remaining), { stream: true });
      truncated = true;
      await reader.cancel();
      break;
    }
    total += value.byteLength;
    text += decoder.decode(value, { stream: true });
  }
  text += decoder.decode();
  return truncated ? `${text}\n\n… Preview limited to 512 KB. Save the output file to view the full result.` : text;
}

export async function readFileText(fileId: string): Promise<string> {
  if (window.ldx) return window.ldx.readFileText(fileId);
  const response = await fetch(`${API_BASE}/files/${encodeURIComponent(fileId)}/content`, {
    headers: previewKey ? { Authorization: `Bearer ${previewKey}` } : undefined,
  });
  if (!response.ok) throw new Error(getErrorMessage(await response.text(), response.status));
  return readTextPreview(response);
}

export async function saveFile(fileId: string, suggestedName: string): Promise<{ saved: boolean; canceled?: boolean; path?: string }> {
  if (window.ldx) return window.ldx.saveFile(fileId, suggestedName);
  const response = await fetch(`${API_BASE}/files/${encodeURIComponent(fileId)}/content`, {
    headers: previewKey ? { Authorization: `Bearer ${previewKey}` } : undefined,
  });
  if (!response.ok) throw new Error(getErrorMessage(await response.text(), response.status));
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = suggestedName || 'ldx-output';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  return { saved: true };
}

export async function openExternal(url: string): Promise<void> {
  if (window.ldx) return window.ldx.openExternal(url);
  window.open(url, '_blank', 'noopener,noreferrer');
}

export async function appVersion(): Promise<string> {
  if (window.ldx) return window.ldx.appVersion();
  return 'Web preview';
}

export function toRecentRun(service: ServiceId, record: JobRecord): RecentRun {
  return {
    job_id: record.job_id,
    service,
    status: record.status || 'unknown',
    model: typeof record.model === 'string' ? record.model : undefined,
    engine: typeof record.engine === 'string' ? record.engine : undefined,
    created_at: typeof record.created_at === 'string' ? record.created_at : undefined,
    updated_at: typeof record.updated_at === 'string' ? record.updated_at : undefined,
    progress: typeof record.progress === 'number' ? record.progress : undefined,
    output_file_id: typeof record.output_file_id === 'string' ? record.output_file_id : undefined,
    error: record.error,
  };
}
