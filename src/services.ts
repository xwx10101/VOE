import {
  Braces,
  FileSearch,
  FileText,
  Languages,
  ScanLine,
  ScanText,
  type LucideIcon,
} from 'lucide-react';
import type { ServiceDefinition, ServiceId } from './types';

export const SERVICE_LIST: ServiceDefinition[] = [
  {
    id: 'analyzedoc',
    title: 'AnalyzeDoc',
    shortTitle: 'Analyze a document',
    subtitle: 'Vision-powered extraction',
    description: 'Read a PDF or image and return the fields you care about as structured JSON.',
    action: 'Analyze document',
    icon: FileSearch,
    accent: 'violet',
    catalogType: 'model',
    accepts: 'PDF, JPG, PNG',
    outputHint: 'Structured JSON',
  },
  {
    id: 'structflow',
    title: 'StructFlow',
    shortTitle: 'Structure text or records',
    subtitle: 'Turn unstructured data into JSON',
    description: 'Extract consistent fields from text records with a schema you define.',
    action: 'Run structured extraction',
    icon: Braces,
    accent: 'blue',
    catalogType: 'model',
    accepts: 'Text records or JSONL',
    outputHint: 'Structured JSON',
  },
  {
    id: 'extractdoc',
    title: 'ExtractDoc',
    shortTitle: 'Extract document text',
    subtitle: 'Fast, ordered text extraction',
    description: 'Pull readable text from PDFs and Office files, ready for downstream workflows.',
    action: 'Extract text',
    icon: FileText,
    accent: 'teal',
    catalogType: 'engine',
    accepts: 'PDF, DOCX, XLSX, PPTX',
    outputHint: 'Text or JSONL',
  },
  {
    id: 'renderocr',
    title: 'RenderOCR',
    shortTitle: 'OCR a scanned document',
    subtitle: 'Scans and images to Office',
    description: 'Convert scanned PDFs or images into editable Office files with layout preserved.',
    action: 'Run OCR conversion',
    icon: ScanLine,
    accent: 'amber',
    catalogType: 'engine',
    accepts: 'PDF, TIFF, JPG, PNG, BMP',
    outputHint: 'DOCX, XLSX, or PPTX',
  },
  {
    id: 'castdoc',
    title: 'CastDoc',
    shortTitle: 'Convert a PDF',
    subtitle: 'PDF to Office, no OCR',
    description: 'Convert a digital PDF to an editable Word, Excel, or PowerPoint file.',
    action: 'Convert PDF',
    icon: ScanText,
    accent: 'rose',
    catalogType: 'engine',
    accepts: 'PDF',
    outputHint: 'DOCX, XLSX, or PPTX',
  },
  {
    id: 'refineloop',
    title: 'RefineLoop',
    shortTitle: 'Refine an XLIFF translation',
    subtitle: 'AI-assisted translation QA',
    description: 'Review and refine translated XLIFF segments while preserving the file structure.',
    action: 'Refine translation',
    icon: Languages,
    accent: 'pink',
    catalogType: 'model',
    accepts: 'XLIFF',
    outputHint: 'Refined XLIFF',
  },
];

export const SERVICE_BY_ID = Object.fromEntries(
  SERVICE_LIST.map((service) => [service.id, service]),
) as Record<ServiceId, ServiceDefinition>;

export const CATALOG_ENDPOINTS: Record<ServiceId, string> = {
  structflow: '/structflow/models',
  analyzedoc: '/analyzedoc/models',
  refineloop: '/refineloop/models',
  renderocr: '/renderocr/engines',
  castdoc: '/castdoc/engines',
  extractdoc: '/extractdoc/engines',
};

export const emptyCatalog = () =>
  Object.fromEntries(SERVICE_LIST.map(({ id }) => [id, []])) as Record<ServiceId, []>;

export const SERVICE_ICONS: Record<ServiceId, LucideIcon> = Object.fromEntries(
  SERVICE_LIST.map(({ id, icon }) => [id, icon]),
) as Record<ServiceId, LucideIcon>;
