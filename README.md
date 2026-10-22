# LDX Workbench

A desktop workspace for the document-processing services exposed by LDX hub. Each user connects their own API key; the app discovers the current model and engine catalogs from the API and submits asynchronous jobs against the selected service.

> **Scope note:** the supplied `https://gw.portal.ldxhub.io/api` URL documents LDX hub's document APIs, not a general-purpose chat/completions API. It exposes StructFlow, AnalyzeDoc, RefineLoop, RenderOCR, CastDoc, ExtractDoc, and an MCP endpoint. This app provides a focused interface for those supported workflows; it is not an exact Claude Code/"Cloud Code" clone and does not offer arbitrary coding-agent chat through this API. Catalog metadata is public, while actual job access is checked by LDX hub when a job is submitted.

## Workflows

- **AnalyzeDoc** — analyze a PDF or image and return schema-guided JSON.
- **StructFlow** — structure JSON text records into a user-defined output shape.
- **ExtractDoc** — extract ordered text from PDF and Office files as text or JSONL.
- **RenderOCR** — OCR scanned files to editable DOCX, XLSX, or PPTX.
- **CastDoc** — convert digital PDFs to Office formats.
- **RefineLoop** — refine XLIFF translations with configurable review preferences.

The workspace also includes live model/engine discovery, async job polling, run history, result preview/download, and settings to verify, replace, or remove the API key.

## Run locally

```bash
npm install
npm run dev
```

For the Electron desktop shell during development, use two processes through the convenience script:

```bash
npm run desktop:dev
```

The first launch asks for an LDX hub API key. The app validates it with the authenticated `GET /files` endpoint before saving it. The API key is encrypted through Electron `safeStorage` and the operating system credential store; it is never written to the repository or app logs. In a browser-only preview, the key is held in memory for that session and is not persisted.

## Build

```bash
npm run build
npm run dist:win
```

`dist:win` packages a Windows x64 portable `.exe` in `release/`. To build a Windows installer instead, run `npm run dist:win:installer`. `npm run dist:linux` creates an AppImage. Windows builds should be produced and smoke-tested on Windows for the most reliable signing and installer behavior.

## API and data handling

- The API base URL is `https://gw.ldxhub.io`, as specified by the LDX hub documentation.
- Model/engine discovery uses `/structflow/models`, `/analyzedoc/models`, `/refineloop/models`, `/renderocr/engines`, `/castdoc/engines`, and `/extractdoc/engines`.
- File uploads and job creation/status requests use the authenticated LDX hub endpoints over HTTPS.
- Files are sent to LDX hub for processing. Their retention/expiry follows the service policy; refer to the [LDX hub API docs](https://gw.portal.ldxhub.io/api).
- The Electron renderer has no Node integration. API credentials and network requests are handled through a narrow, allow-listed IPC bridge in the main process.
