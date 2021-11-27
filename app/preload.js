const { ipcRenderer, contextBridge, shell } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer,
  shell
});
