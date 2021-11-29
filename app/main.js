const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const {runApp} = require('./bot.js');


let win;
const createWindow = exports.createWindow = () => {
  win = new BrowserWindow({
    fullscreen: true,
    show: false,
    webPreferences: {
      contextIsolation: false,
  	  nodeIntegration: true
    },
    frame: false,
    transparent: true
  })

  win.loadFile('./app/index.html')
  win.setAlwaysOnTop(true);
  win.setFocusable(false);
  win.setResizable(false);
  win.setClosable(false);
  win.setIgnoreMouseEvents(true);
  win.removeMenu();

  win.once('ready-to-show', () => {
    win.show();
  })
}

app.whenReady().then(() => {
  createWindow();
  // win.webContents.openDevTools();
  runApp(win);
})


app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
