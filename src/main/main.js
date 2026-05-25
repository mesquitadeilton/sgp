const path = require('path');
const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const {
  openDatabase,
  listAllData,
  saveDizimista,
  deleteDizimista,
  saveDevolucao,
  deleteDevolucao,
  saveAmbiente,
  deleteAmbiente,
  saveEventoSala,
  deleteEventoSala,
  replaceAllData,
  saveConfiguracoes
} = require('./database/database');

const APP_TITLE = 'Sistema de Gestão Paroquial - SGP';
const APP_ID = 'br.org.paroquiasantaluzia.sgp';

app.setName('SGP');
app.setAppUserModelId(APP_ID);

function createMainWindow() {
  const mainWindow = new BrowserWindow({
    title: APP_TITLE,
    width: 1280,
    height: 820,
    minWidth: 1024,
    minHeight: 700,
    icon: path.join(__dirname, '..', '..', 'build', 'icon.ico'),
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  Menu.setApplicationMenu(null);
  mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });
}

function registerDatabaseHandlers() {
  ipcMain.handle('db:list', () => listAllData());
  ipcMain.handle('db:save-dizimista', (event, dizimista) => saveDizimista(dizimista));
  ipcMain.handle('db:delete-dizimista', (event, id) => deleteDizimista(id));
  ipcMain.handle('db:save-devolucao', (event, devolucao) => saveDevolucao(devolucao));
  ipcMain.handle('db:delete-devolucao', (event, id) => deleteDevolucao(id));
  ipcMain.handle('db:save-ambiente', (event, ambiente) => saveAmbiente(ambiente));
  ipcMain.handle('db:delete-ambiente', (event, id) => deleteAmbiente(id));
  ipcMain.handle('db:save-evento-sala', (event, evento) => saveEventoSala(evento));
  ipcMain.handle('db:delete-evento-sala', (event, id) => deleteEventoSala(id));
  ipcMain.handle('db:replace-all', (event, data) => replaceAllData(data));
  ipcMain.handle('db:save-configuracoes', (event, configuracoes) => saveConfiguracoes(configuracoes));
}

app.whenReady().then(() => {
  openDatabase();
  registerDatabaseHandlers();
  createMainWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});
