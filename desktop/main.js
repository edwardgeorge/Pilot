//@ts-check
const { app, BrowserWindow, webFrame, Menu, dialog } = require("electron");
const remoteMain = require("@electron/remote/main");
const path = require("path");
const url = require("url");
const shell = require("electron").shell;

let isShown = true;
let win = null;

remoteMain.initialize();

require("electron").protocol.registerSchemesAsPrivileged([
  { scheme: "js", privileges: { standard: true, secure: true } },
]);

function protocolHandler(request, respond) {
  try {
    let pathname = request.url.replace(/^js:\/*/, "");
    let filename = path.resolve(app.getAppPath(), pathname);
    respond({
      mimeType: "text/javascript",
      data: require("fs").readFileSync(filename),
    });
  } catch (e) {
    console.error(e, request);
  }
}

const createWindow = () => {
  require("electron").protocol.registerBufferProtocol("js", protocolHandler);
  win = new BrowserWindow({
    width: 445,
    height: 210,
    minWidth: 200,
    minHeight: 190,
    backgroundColor: "#000",
    icon:
      __dirname +
        "/" +
        { darwin: "icon.icns", linux: "icon.png", win32: "icon.ico" }[
          process.platform
        ] || "icon.ico",
    resizable: true,
    frame: process.platform !== "darwin",
    skipTaskbar: process.platform === "darwin",
    autoHideMenuBar: process.platform === "darwin",
    webPreferences: {
      zoomFactor: 1.0,
      nodeIntegration: true,
      backgroundThrottling: false,
      contextIsolation: false,
    },
  });
  remoteMain.enable(win.webContents);
  win.loadURL(`file://${__dirname}/sources/index.html`);

  win.on("closed", () => {
    win = null;
    app.quit();
  });

  win.on("hide", function () {
    isShown = false;
  });

  win.on("show", function () {
    isShown = true;
  });
};

app.whenReady().then(() => {
  app.on("window-all-closed", () => {
    app.quit();
  });

  app.on("activate", () => {
    if (win === null) {
      createWindow();
    } else {
      win.show();
    }
  });
});

app.inspect = function () {
  win.toggleDevTools();
};

app.toggleFullscreen = function () {
  win.setFullScreen(!win.isFullScreen());
};

app.toggleVisible = function () {
  if (process.platform === "darwin") {
    if (isShown && !win.isFullScreen()) {
      win.hide();
    } else {
      win.show();
    }
  } else {
    if (!win.isMinimized()) {
      win.minimize();
    } else {
      win.restore();
    }
  }
};

app.injectMenu = function (menu) {
  try {
    Menu.setApplicationMenu(Menu.buildFromTemplate(menu));
  } catch (err) {
    console.warn("Cannot inject menu.");
  }
};
