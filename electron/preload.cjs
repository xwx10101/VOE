const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('ldx', {
  getKeyStatus: () => ipcRenderer.invoke('key:status'),
  connect: (key) => ipcRenderer.invoke('key:connect', key),
  disconnect: () => ipcRenderer.invoke('key:disconnect'),
  discoverCatalog: () => ipcRenderer.invoke('catalog:discover'),
  uploadFile: (file) => ipcRenderer.invoke('files:upload', file),
  createJob: (service, body) => ipcRenderer.invoke('jobs:create', service, body),
  getJob: (service, jobId) => ipcRenderer.invoke('jobs:get', service, jobId),
  listJobs: (service) => ipcRenderer.invoke('jobs:list', service),
  readFileText: (fileId) => ipcRenderer.invoke('files:readText', fileId),
  saveFile: (fileId, suggestedName) => ipcRenderer.invoke('files:save', fileId, suggestedName),
  openExternal: (url) => ipcRenderer.invoke('app:openExternal', url),
  appVersion: () => ipcRenderer.invoke('app:version'),
});
