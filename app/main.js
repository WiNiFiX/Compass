const { app, BrowserWindow, ipcMain, Menu, Tray, nativeImage, shell } = require('electron');
const path = require('path');
const { startApp, stopApp } = require('./bot.js');

let win, tray;

const createGameWindow = () => {
  return new Promise((resolve, reject) => {
    win = new BrowserWindow({
      fullscreen: true,
      show: false,
      webPreferences: {
        contextIsolation: false,
        nodeIntegration: true
      },
      frame: false,
      transparent: true
    });

    win.loadFile('./app/index.html');
    win.setAlwaysOnTop(true);
    win.setFocusable(false);
    win.setResizable(false);
    win.setIgnoreMouseEvents(true);
    win.removeMenu();

    win.once('ready-to-show', () => {
      win.show();
      resolve(win);
    });
  });
};


const createTray = () => {
  const icon = nativeImage.createFromPath(path.join(__dirname, '/img/arr.png'));
  tray = new Tray(icon);
  const template = [
    {
      label: 'Start Compass',
      click() {
        createGameWindow()
        .then(startApp)
        .catch(e => console.log(e));
      }
    },
    {
      label: 'Stop compass',
      click() {
        stopApp();
        win.destroy();
      }
    },
    { type: 'separator'},
    {
      label: 'Options'
    },
    { type: 'separator'},
    {
      label: 'About',
      click() {
        shell.openExternal('https://www.youtube.com/olesgeras');
      }
    },
    {
      label: 'Exit',
      role: 'quit'
    }
  ];

  tray.setToolTip('lol');
  tray.setContextMenu(Menu.buildFromTemplate(template));
};


app.whenReady().then(() => {
  createTray();
})

app.on('window-all-closed', (event) => {
  event.preventDefault();
})
