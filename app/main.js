const { app, BrowserWindow, ipcMain, Menu, Tray, nativeImage, shell, Notification } = require('electron');
const path = require('path');
const { startApp, stopApp } = require('./bot.js');

let win, tray, icon;

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
      resolve(win);
    });
  });
};

const getOptions = () => {
  // get options
}

const errorNote = ({message}) => {
  new Notification({
    title: `Error`,
    body: message,
    critical: 'critical',
    icon
  }).show();
};

const updateMenu = () => {
  tray.setContextMenu(createMenu());
};

const closeWin = () => {
  win.destroy();
  win = null;
  updateMenu();
}

const createMenu = () => {
  const template = [
    {
      label: 'Start Compass',
      click() {
        createGameWindow()
        .then(startApp)
        .catch(e => {
          errorNote(e);
          closeWin();
        });
        updateMenu();
      },
      enabled: !win
    },
    {
      label: 'Stop compass',
      click() {
          stopApp();
          closeWin();
      },
      enabled: !!win
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
      click() {
        stopApp();
        app.quit();
      }
    }
  ];

  return Menu.buildFromTemplate(template);
};

const createTray = () => {
  icon = nativeImage.createFromPath(path.join(__dirname, '/img/arr.png'));
  tray = new Tray(icon);
  tray.setToolTip('lol');
  tray.setContextMenu(createMenu());
};


app.whenReady().then(() => {
  createTray();
})

app.on('window-all-closed', (event) => {
  event.preventDefault();
})
