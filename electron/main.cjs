const { app, BrowserWindow, ipcMain, safeStorage, dialog, shell } = require('electron');
const fs = require('node:fs');
const path = require('node:path');

const API_BASE = 'https://gw.ldxhub.io';
const SERVICE_IDS = ['structflow', 'analyzedoc', 'refineloop', 'renderocr', 'castdoc', 'extractdoc'];
const CATALOG_PATHS = {
  structflow: '/structflow/models',
  analyzedoc: '/analyzedoc/models',
  refineloop: '/refineloop/models',
  renderocr: '/renderocr/engines',
  castdoc: '/castdoc/engines',
  extractdoc: '/extractdoc/engines',
};
const KEY_FILE = () => path.join(app.getPath('userData'), 'ldx-credential.bin');
let mainWindow;

function maskKey(key) {
  return `••••••••${key.slice(-4)}`;
}

function safeStorageReady() {
  return Boolean(safeStorage && safeStorage.isEncryptionAvailable());
}

function readKey() {
  const file = KEY_FILE();
  if (!fs.existsSync(file)) return null;
  if (!safeStorageReady()) {
    throw new Error('The operating system credential store is unavailable. Unlock your system keychain and restart the app.');
  }
  try {
    return safeStorage.decryptString(fs.readFileSync(file));
  } catch {
    throw new Error('The saved API key could not be decrypted. Re-enter your key in Settings.');
  }
}

function assertService(service) {
  if (!SERVICE_IDS.includes(service)) throw new Error('Unknown LDX hub service.');
  return service;
}

function safeId(id, label) {
  const value = String(id ?? '');
  if (!/^[a-zA-Z0-9_-]{1,220}$/.test(value)) throw new Error(`Invalid ${label}.`);
  return value;
}

function unwrapData(value) {
  if (value && typeof value === 'object' && !Array.isArray(value) && 'data' in value) {
    return value.data;
  }
  return value;
}

function formatApiError(body, status) {
  if (body && typeof body === 'object') {
    const nested = body.error && typeof body.error === 'object' ? body.error : null;
    const message = nested?.message || body.message || body.detail;
    if (typeof message === 'string' && message.trim()) return message;
  }
  if (status === 401) return 'That API key was not accepted. Check it and try again.';
  if (status === 403) return 'This key does not have permission for that operation.';
  if (status === 429) return 'The API is rate-limiting requests. Wait a moment and retry.';
  return `The LDX hub request failed (HTTP ${status}).`;
}

async function requestJson(pathname, options = {}, explicitKey) {
  const key = explicitKey || readKey();
  if (!key) throw new Error('Add an LDX hub API key in Settings to continue.');

  const headers = new Headers(options.headers || {});
  headers.set('Authorization', `Bearer ${key}`);
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  let response;
  try {
    response = await fetch(`${API_BASE}${pathname}`, {
      ...options,
      headers,
      signal: options.signal || AbortSignal.timeout(120000),
    });
  } catch (error) {
    if (error && error.name === 'TimeoutError') throw new Error('The request timed out. Try again or use a smaller file.');
    throw new Error('Could not reach LDX hub. Check your internet connection and try again.');
  }

  const text = await response.text();
  let result = null;
  if (text) {
    try {
      result = JSON.parse(text);
    } catch {
      result = text;
    }
  }
  if (!response.ok) throw new Error(formatApiError(result, response.status));
  return result;
}

async function fetchCatalog() {
  const key = readKey();
  if (!key) throw new Error('Add an LDX hub API key in Settings to continue.');

  // The model/engine endpoints are public; this protected request validates the key first.
  await requestJson('/files', {}, key);
  const items = Object.fromEntries(SERVICE_IDS.map((id) => [id, []]));
  const errors = {};

  await Promise.all(SERVICE_IDS.map(async (service) => {
    try {
      const response = await requestJson(CATALOG_PATHS[service], {}, key);
      const data = unwrapData(response);
      if (Array.isArray(data)) {
        items[service] = data.filter((entry) => entry && typeof entry.id === 'string');
      } else {
        items[service] = [];
      }
    } catch (error) {
      errors[service] = error instanceof Error ? error.message : 'Unable to load this catalog.';
    }
  }));

  return { items, errors, updatedAt: new Date().toISOString() };
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 940,
    minWidth: 1024,
    minHeight: 720,
    backgroundColor: '#111116',
    title: 'LDX Workbench',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      devTools: !app.isPackaged,
    },
  });
  mainWindow.setMenu(null);
  mainWindow.setMenuBarVisibility(false);

  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  mainWindow.webContents.on('will-navigate', (event, target) => {
    const current = mainWindow.webContents.getURL();
    const targetBase = target.split('#')[0];
    const currentBase = current.split('#')[0];
    const devAllowed = !app.isPackaged && /^http:\/\/(localhost|127\.0\.0\.1):5173(?:\/|$)/.test(target);
    if (targetBase !== currentBase && !devAllowed) event.preventDefault();
  });

  if (!app.isPackaged) {
    const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://127.0.0.1:5173';
    mainWindow.loadURL(devUrl);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('key:status', () => {
  const key = readKey();
  return {
    configured: Boolean(key),
    masked: key ? maskKey(key) : null,
    secureStorage: safeStorageReady(),
    desktop: true,
  };
});

ipcMain.handle('key:connect', async (_event, rawKey) => {
  const key = String(rawKey || '').trim();
  if (key.length < 8) throw new Error('Enter a valid API key to continue.');
  await requestJson('/files', {}, key);
  if (!safeStorageReady()) {
    throw new Error('Secure storage is unavailable. Unlock the operating system credential store, then restart LDX Workbench.');
  }
  const encrypted = safeStorage.encryptString(key);
  const file = KEY_FILE();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temporary = `${file}.tmp`;
  fs.writeFileSync(temporary, encrypted, { mode: 0o600 });
  fs.renameSync(temporary, file);
  return {
    configured: true,
    masked: maskKey(key),
    secureStorage: true,
    desktop: true,
  };
});

ipcMain.handle('key:disconnect', () => {
  const file = KEY_FILE();
  if (fs.existsSync(file)) fs.unlinkSync(file);
  return { configured: false, masked: null, secureStorage: safeStorageReady(), desktop: true };
});

ipcMain.handle('catalog:discover', fetchCatalog);

ipcMain.handle('files:upload', async (_event, file) => {
  const name = path.basename(String(file?.name || 'upload'));
  const mimeType = String(file?.type || 'application/octet-stream');
  if (!file?.bytes) throw new Error('Choose a file to upload.');
  const bytes = Buffer.from(file.bytes);
  if (bytes.length === 0) throw new Error('The selected file is empty.');
  if (bytes.length > 200 * 1024 * 1024) throw new Error('Files must be 200 MB or smaller.');

  const form = new FormData();
  form.append('file', new Blob([bytes], { type: mimeType }), name);
  const result = await requestJson('/files', { method: 'POST', body: form, signal: AbortSignal.timeout(10 * 60 * 1000) });
  return unwrapData(result);
});

ipcMain.handle('jobs:create', async (_event, rawService, body) => {
  const service = assertService(rawService);
  const result = await requestJson(`/${service}/jobs`, {
    method: 'POST',
    body: JSON.stringify(body || {}),
  });
  return unwrapData(result);
});

ipcMain.handle('jobs:get', async (_event, rawService, rawJobId) => {
  const service = assertService(rawService);
  const jobId = safeId(rawJobId, 'job ID');
  const result = await requestJson(`/${service}/jobs/${encodeURIComponent(jobId)}`);
  return unwrapData(result);
});

ipcMain.handle('jobs:list', async (_event, rawService) => {
  const service = assertService(rawService);
  const result = await requestJson(`/${service}/jobs`);
  const data = unwrapData(result);
  return Array.isArray(data) ? data : [];
});

function checkFileId(rawFileId) {
  return safeId(rawFileId, 'file ID');
}

async function readTextPreview(response, maxBytes = 512 * 1024) {
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

ipcMain.handle('files:readText', async (_event, rawFileId) => {
  const fileId = checkFileId(rawFileId);
  const key = readKey();
  if (!key) throw new Error('Add an LDX hub API key in Settings to continue.');
  const response = await fetch(`${API_BASE}/files/${encodeURIComponent(fileId)}/content`, {
    headers: { Authorization: `Bearer ${key}` },
    signal: AbortSignal.timeout(120000),
  });
  if (!response.ok) {
    let body = null;
    try { body = await response.json(); } catch { /* no JSON error body */ }
    throw new Error(formatApiError(body, response.status));
  }
  return readTextPreview(response);
});

ipcMain.handle('files:save', async (_event, rawFileId, rawName) => {
  const fileId = checkFileId(rawFileId);
  const filename = path.basename(String(rawName || 'ldx-output')).replace(/[\\/:*?"<>|]/g, '_');
  const key = readKey();
  if (!key) throw new Error('Add an LDX hub API key in Settings to continue.');

  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Save LDX output',
    defaultPath: filename,
  });
  if (result.canceled || !result.filePath) return { saved: false, canceled: true };

  let response;
  try {
    response = await fetch(`${API_BASE}/files/${encodeURIComponent(fileId)}/content`, {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(120000),
    });
  } catch {
    throw new Error('Could not reach LDX hub while downloading the result.');
  }
  if (!response.ok) {
    let body = null;
    try { body = await response.json(); } catch { /* no JSON error body */ }
    throw new Error(formatApiError(body, response.status));
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  await fs.promises.writeFile(result.filePath, bytes);
  return { saved: true, path: result.filePath };
});

ipcMain.handle('app:openExternal', async (_event, rawUrl) => {
  let url;
  try {
    url = new URL(String(rawUrl));
  } catch {
    throw new Error('That link is not valid.');
  }
  const allowedHosts = new Set(['gw.portal.ldxhub.io', 'gw.ldxhub.io', 'ldxlab.io']);
  if (url.protocol !== 'https:' || !allowedHosts.has(url.hostname)) {
    throw new Error('This app can only open official LDX hub links.');
  }
  await shell.openExternal(url.toString());
});

ipcMain.handle('app:version', () => app.getVersion());
