const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronLab', {
  getBootstrap: () => ipcRenderer.invoke('lab:get-bootstrap'),
  refreshCatalog: () => ipcRenderer.invoke('lab:refresh-catalog'),
  saveResult: (result) => ipcRenderer.invoke('lab:save-result', result),
  captureWebview: (payload) => ipcRenderer.invoke('lab:capture-webview', payload),
  openDevTools: (webContentsId) => ipcRenderer.invoke('lab:open-devtools', webContentsId),
  showArtifact: (file) => ipcRenderer.invoke('lab:show-artifact', file),
  smokeComplete: (result) => ipcRenderer.send('lab:smoke-complete', result),
  machineComplete: (result) => ipcRenderer.send('lab:machine-complete', result),
});
