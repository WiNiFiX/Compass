const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const {runApp} = require('./bot.js');


let win;
const createWindow = exports.createWindow = () => {
  win = new BrowserWindow({
    width: 50,
    height: 50,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    },
    show: false,
    frame: false,
  })

  win.loadFile('./app/index.html')
  win.once('ready-to-show', () => {
    win.show();
  });
  win.setAlwaysOnTop(true);
  win.setFocusable(false);
  win.setResizable(false);
  win.setClosable(false);
  win.removeMenu();
}

app.whenReady().then(() => {
  createWindow();
  // win.webContents.openDevTools();
  runApp(win);
})


app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
