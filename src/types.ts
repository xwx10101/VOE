import type { LucideIcon } from 'lucide-react';

export type ServiceId =
  | 'structflow'
  | 'analyzedoc'
  | 'refineloop'
  | 'renderocr'
  | 'castdoc'
  | 'extractdoc';

export interface CatalogItem {
  id: string;
  display_name?: string;
  description?: string;
  provider?: string;
  supported_conversions?: Array<{ from: string; to: string }>;
}

export type Catalog = Record<ServiceId, CatalogItem[]>;
export type CatalogErrors = Partial<Record<ServiceId, string>>;

export interface CatalogResponse {
  items: Catalog;
  errors: CatalogErrors;
  updatedAt: string;
}

export interface KeyStatus {
  configured: boolean;
  masked: string | null;
  secureStorage: boolean;
  desktop: boolean;
}

export interface ConnectResponse extends KeyStatus {
  message?: string;
}

export interface ServiceDefinition {
  id: ServiceId;
  title: string;
  shortTitle: string;
  subtitle: string;
  description: string;
  action: string;
  icon: LucideIcon;
  accent: string;
  catalogType: 'model' | 'engine';
  accepts: string;
  outputHint: string;
}

export interface JobRecord {
  job_id: string;
  status: string;
  progress?: number;
  model?: string;
  engine?: string;
  file_id?: string;
  output_file_id?: string;
  created_at?: string;
  updated_at?: string;
  completed_at?: string;
  expires_at?: string;
  error?: { code?: string; message?: string; request_id?: string } | string;
  results?: unknown[];
  summary?: Record<string, unknown>;
  usage?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface UploadResult {
  file_id: string;
  filename?: string;
  size?: number;
  expires_at?: string;
}

export interface RecentRun {
  job_id: string;
  service: ServiceId;
  status: string;
  model?: string;
  engine?: string;
  created_at?: string;
  updated_at?: string;
  progress?: number;
  output_file_id?: string;
  error?: JobRecord['error'];
}

export type RunStage = 'uploading' | 'submitting' | 'queued' | 'processing' | 'completed' | 'failed';

export interface ActiveRun {
  service: ServiceId;
  job_id?: string;
  stage: RunStage;
  progress: number;
  message: string;
  job?: JobRecord;
  resultText?: string;
}

export interface KeyBridge {
  getKeyStatus: () => Promise<KeyStatus>;
  connect: (key: string) => Promise<ConnectResponse>;
  disconnect: () => Promise<KeyStatus>;
  discoverCatalog: () => Promise<CatalogResponse>;
  uploadFile: (file: { name: string; type: string; bytes: Uint8Array }) => Promise<UploadResult>;
  createJob: (service: ServiceId, body: Record<string, unknown>) => Promise<JobRecord>;
  getJob: (service: ServiceId, jobId: string) => Promise<JobRecord>;
  listJobs: (service: ServiceId) => Promise<JobRecord[]>;
  readFileText: (fileId: string) => Promise<string>;
  saveFile: (fileId: string, suggestedName: string) => Promise<{ saved: boolean; canceled?: boolean; path?: string }>;
  openExternal: (url: string) => Promise<void>;
  appVersion: () => Promise<string>;
}
