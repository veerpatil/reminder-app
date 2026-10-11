const path = require("path");
const {
  app,
  BrowserWindow,
  Tray,
  Menu,
  ipcMain,
  screen,
  nativeImage,
} = require("electron");
const { ReminderScheduler } = require("./reminders");

const isMac = process.platform === "darwin";

let tray = null;
let settingsWindow = null;
let overlayWindow = null;
let scheduler = null;

function getAssetPath(...segments) {
  return path.join(__dirname, "..", "assets", ...segments);
}

function createTrayIcon() {
  const iconPath = getAssetPath("mascot.png");
  let image = nativeImage.createFromPath(iconPath);
  if (image.isEmpty()) {
    image = nativeImage.createEmpty();
  }
  if (isMac) {
    image = image.resize({ width: 18, height: 18 });
    image.setTemplateImage(true);
  }
  return image;
}

function createSettingsWindow() {
  if (settingsWindow) {
    settingsWindow.show();
    settingsWindow.focus();
    return;
  }

  settingsWindow = new BrowserWindow({
    width: 420,
    height: 620,
    useContentSize: true,
    show: false,
    resizable: false,
    title: "Bolt Reminder",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  settingsWindow.loadFile(path.join(__dirname, "..", "renderer", "index.html"));

  settingsWindow.on("close", (e) => {
    if (!app.isQuitting) {
      e.preventDefault();
      settingsWindow.hide();
    }
  });

  settingsWindow.on("closed", () => {
    settingsWindow = null;
  });
}

function showSettings() {
  createSettingsWindow();
  settingsWindow.show();
  settingsWindow.focus();
}

function createOverlayWindow() {
  if (overlayWindow) return overlayWindow;

  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  overlayWindow = new BrowserWindow({
    width,
    height,
    x: 0,
    y: 0,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    movable: false,
    focusable: true,
    hasShadow: false,
    fullscreenable: false,
    webPreferences: {
      preload: path.join(__dirname, "preload-overlay.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  overlayWindow.setIgnoreMouseEvents(false);
  overlayWindow.loadFile(path.join(__dirname, "..", "renderer", "overlay.html"));
  overlayWindow.on("closed", () => {
    overlayWindow = null;
  });

  return overlayWindow;
}

function showReminderDrop(message) {
  const win = createOverlayWindow();
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  win.setBounds({ x: 0, y: 0, width, height });
  win.show();
  win.focus();
  const deliver = () => win.webContents.send("show-reminder", { message });
  if (win.webContents.isLoading()) {
    win.webContents.once("did-finish-load", deliver);
  } else {
    deliver();
  }
}

function hideOverlay() {
  if (overlayWindow) {
    overlayWindow.hide();
  }
}

function buildTrayMenu() {
  return Menu.buildFromTemplate([
    {
      label: "Open Bolt",
      click: () => showSettings(),
    },
    { type: "separator" },
    {
      label: "Quit",
      click: () => {
        app.isQuitting = true;
        app.quit();
      },
    },
  ]);
}

function setupTray() {
  tray = new Tray(createTrayIcon());
  tray.setToolTip("Bolt Reminder");
  tray.setContextMenu(buildTrayMenu());
  tray.on("click", () => showSettings());
}

function registerIpc() {
  ipcMain.handle("reminders:list", () => scheduler.list());
  ipcMain.handle("reminders:add", (_, payload) => scheduler.add(payload));
  ipcMain.handle("reminders:remove", (_, id) => scheduler.remove(id));
  ipcMain.handle("reminders:toggle", (_, id, enabled) =>
    scheduler.toggle(id, enabled)
  );
  ipcMain.handle("reminders:test", (_, { message }) => {
    const trimmed = String(message || "").trim();
    if (!trimmed) throw new Error("Message is required");
    showReminderDrop(trimmed.slice(0, 200));
  });
  ipcMain.on("overlay:dismiss", () => hideOverlay());
}

app.whenReady().then(() => {
  if (isMac) {
    app.dock.hide();
  }

  scheduler = new ReminderScheduler((reminder) => {
    showReminderDrop(reminder.message);
  });

  setupTray();
  registerIpc();
  showSettings();

  scheduler.start();
});

app.on("window-all-closed", (e) => {
  e.preventDefault();
});

app.on("before-quit", () => {
  app.isQuitting = true;
  if (scheduler) scheduler.stop();
});
