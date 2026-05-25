const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('sgp', {
  platform: 'electron',
  db: {
    list: () => ipcRenderer.invoke('db:list'),
    saveDizimista: dizimista => ipcRenderer.invoke('db:save-dizimista', dizimista),
    deleteDizimista: id => ipcRenderer.invoke('db:delete-dizimista', id),
    saveDevolucao: devolucao => ipcRenderer.invoke('db:save-devolucao', devolucao),
    deleteDevolucao: id => ipcRenderer.invoke('db:delete-devolucao', id),
    saveAmbiente: ambiente => ipcRenderer.invoke('db:save-ambiente', ambiente),
    deleteAmbiente: id => ipcRenderer.invoke('db:delete-ambiente', id),
    saveEventoSala: evento => ipcRenderer.invoke('db:save-evento-sala', evento),
    deleteEventoSala: id => ipcRenderer.invoke('db:delete-evento-sala', id),
    replaceAll: data => ipcRenderer.invoke('db:replace-all', data),
    saveConfiguracoes: configuracoes => ipcRenderer.invoke('db:save-configuracoes', configuracoes)
  }
});
