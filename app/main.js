const {
        app,
        dialog,
        BrowserWindow,
        ipcMain,
        Menu,
        Tray,
        nativeImage,
        shell,
        Notification,
        screen
       } = require('electron');
const path = require('path');
const { readFileSync, writeFile } = require('fs');





if (require('electron-squirrel-startup')) return app.quit();

// this should be placed at top of main.js to handle setup events quickly
if (handleSquirrelEvent()) {
  // squirrel event handled and app will exit in 1000ms, so don't do anything else
  return;
}

function handleSquirrelEvent() {
  if (process.argv.length === 1) {
    return false;
  }

  const ChildProcess = require('child_process');

  const appFolder = path.resolve(process.execPath, '..');
  const rootAtomFolder = path.resolve(appFolder, '..');
  const updateDotExe = path.resolve(path.join(rootAtomFolder, 'Update.exe'));
  const exeName = path.basename(process.execPath);

  const spawn = function(command, args) {
    let spawnedProcess, error;

    try {
      spawnedProcess = ChildProcess.spawn(command, args, {detached: true});
    } catch (error) {}

    return spawnedProcess;
  };

  const spawnUpdate = function(args) {
    return spawn(updateDotExe, args);
  };

  const squirrelEvent = process.argv[1];
  switch (squirrelEvent) {
    case '--squirrel-install':
    case '--squirrel-updated':
      // Optionally do things such as:
      // - Add your .exe to the PATH
      // - Write to the registry for things like file associations and
      //   explorer context menus

      // Install desktop and start menu shortcuts
      spawnUpdate(['--createShortcut', exeName]);

      setTimeout(app.quit, 1000);
      return true;

    case '--squirrel-uninstall':
      // Undo anything you did in the --squirrel-install and
      // --squirrel-updated handlers

      // Remove desktop and start menu shortcuts
      spawnUpdate(['--removeShortcut', exeName]);

      setTimeout(app.quit, 1000);
      return true;

    case '--squirrel-obsolete':
      // This is called on the outgoing version of your app before
      // we update to the new version - it's the opposite of
      // --squirrel-updated

      app.quit();
      return true;
  }
};




const { startApp, stopApp, updateOptsApp } = require('./bot.js');
let options = JSON.parse(readFileSync(path.join(__dirname, 'opt.json'), 'utf8'));

let win, tray, icon, winOpt;

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

const saveOptions = (event, newOpts) => {
  options = newOpts;
  updateOptsApp(options);
  if(win) {
    win.webContents.send('update-options', options);
  }
  let value = JSON.stringify(options);
  writeFile(path.join(__dirname, 'opt.json'), value, (error) => {
    if(error) throw error;
  });
  saveOptions.saved = true;
};
saveOptions.saved = true;

ipcMain.handle('save-options', saveOptions);
ipcMain.handle('get-options', () => options);
ipcMain.on('update-options', (event, newOpts) => {
  saveOptions.saved = JSON.stringify(options) == JSON.stringify(newOpts);
});

ipcMain.handle('get-center', () => {
  let {size} = screen.getPrimaryDisplay();
  return { x: size.width / 2, y: size.height / 2 };
});

const createWinOpt = () => {
  winOpt = new BrowserWindow({
    show: false,
    width: 250,
    height: 540,
    resizable: false,
    icon,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true
    }
  });

  winOpt.loadFile(path.join(__dirname, 'options.html'));

  winOpt.once('ready-to-show', () => {
    winOpt.show();
  });

  winOpt.on('close', (event) => {
      if(!saveOptions.saved) {
        let result = dialog.showMessageBoxSync(winOpt, {
          type: 'question',
          title: `Options`,
          message: `The options haven't been saved, the changes will be lost. Are you sure you want to exit?`,
          buttons: ['Yes', 'Cancel'],
          defaultId: 0,
          cancelId: 1
        });

        if(result) {
          event.preventDefault();
        }
      }
  });

  winOpt.removeMenu();
};


const errorNote = ({message}) => {
  new Notification({
    title: `Error`,
    body: message,
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
      label: 'Start',
      async click() {
        updateOptsApp(options);
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
      label: 'Stop',
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
  tray.setToolTip('Compass v1.0');
  tray.setContextMenu(createMenu());
  new Notification({
    title: `Compass`,
    body: `Compass is running...`,
    icon
  }).show();
};


app.whenReady().then(() => {
  createTray();
})

app.on('window-all-closed', (event) => {
  event.preventDefault();
})
