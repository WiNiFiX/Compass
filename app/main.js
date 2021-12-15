const {
        app,
        BrowserWindow,
        ipcMain,
        Menu,
        Tray,
        nativeImage,
        shell,
        Notification,
        desktopCapturer
       } = require('electron');
const path = require('path');
const { startApp, stopApp } = require('./bot.js');
const { readFileSync, writeFile } = require('fs');

let win, tray, icon, winOpt;

let options = JSON.parse(readFileSync('./app/opt.json', 'utf8'));

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

    win.once('ready-to-show', async () => {
      resolve(win);
    });
  });
};

ipcMain.handle('save-options', (event, newOpts) => {
  options = newOpts;
  win.webContents.send('update-options', options);
  let value = JSON.stringify(options);
  writeFile('./app/opt.json', value, (error) => {
    if(error) throw error;
  });
});

ipcMain.handle('get-options', () => options);

const createWinOpt = () => {
  winOpt = new BrowserWindow({
    show: false,
    width: 400,
    height: 400,
    icon,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true
    }
  });

  winOpt.loadFile(path.join(__dirname, 'options.html'));

  winOpt.once('ready-to-show', () => {
    winOpt.show()
  });

  winOpt.removeMenu();
};


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
      label: 'START',
      async click() {
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
      label: 'STOP',
      click() {
          stopApp();
          closeWin();
      },
      enabled: !!win
    },
    { type: 'separator'},
    {
      label: 'Options',
      click() {
        createWinOpt();
      }
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
