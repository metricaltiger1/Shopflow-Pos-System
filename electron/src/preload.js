// electron/src/preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getBackendUrl: () => ipcRenderer.invoke('get-backend-url'),
  isBackendReady: () => ipcRenderer.invoke('is-backend-ready'),
  restartBackend: () => ipcRenderer.invoke('restart-backend'),
  isElectron: () => true
});