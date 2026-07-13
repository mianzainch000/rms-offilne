const {
  app,
  BrowserWindow,
  ipcMain,
  Tray,
  Menu,
  shell,
  dialog,
} = require("electron");
const path = require("path");
const os = require("os");
const license = require("./license");
const backupStatus = require(
  path.join(__dirname, "..", "script", "backupStatus.js"),
);
const { getOrCreateCert } = require("./certManager");

const PORT = 9000;
const SYNC_INTERVAL_MS = 5 * 60 * 1000;
let mainWindow = null;
let licenseWindow = null;
let tray = null;
let serverStarted = false;

global.__ELECTRON_USER_DATA__ = null;

function formatPKT(date) {
  return date.toLocaleString("en-PK", {
    timeZone: "Asia/Karachi",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function getLanUrl() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        return `https://${iface.address}:${PORT}`;
      }
    }
  }
  return `https://localhost:${PORT}`;
}

function createLicenseWindow() {
  licenseWindow = new BrowserWindow({
    width: 460,
    height: 560,
    resizable: false,
    title: "Restaurant Management System — Activation",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  licenseWindow.setMenuBarVisibility(false);
  licenseWindow.loadFile(path.join(__dirname, "license-screen.html"));
}

async function startPosServer() {
  if (serverStarted) return;
  serverStarted = true;

  const next = require("next");
  const { createServer } = require("https");

  const projectDir = path.join(__dirname, "..");
  const nextApp = next({ dev: false, dir: projectDir });
  const handle = nextApp.getRequestHandler();

  await nextApp.prepare();

  const { key, cert } = getOrCreateCert();
  const server = createServer({ key, cert }, (req, res) => handle(req, res));
  server.listen(PORT, "0.0.0.0", () => {
    console.log(
      `✅ Restaurant Management System server running -> LAN: ${getLanUrl()}`,
    );
  });

  startBackgroundSyncScheduler();
}

function startBackgroundSyncScheduler() {
  runBackgroundSyncSafely();
  setInterval(runBackgroundSyncSafely, SYNC_INTERVAL_MS);
}

async function runBackgroundSyncSafely() {
  try {
    const { runCloudSync } = require(
      path.join(__dirname, "..", "script", "cloud-sync.js"),
    );
    const result = await runCloudSync();
    if (result.ok) {
      backupStatus.setStatus(
        `✅ Kamyab — ${formatPKT(new Date())}`,
        new Date(),
      );
    } else if (result.reason === "not-configured") {
      backupStatus.setStatus(
        "⚠️ Cloud Backup configure nahi hai (.env.local mein CLOUD_BACKUP_URI missing)",
      );
    } else if (result.reason === "tools-missing") {
      backupStatus.setStatus("⚠️ MongoDB Database Tools installed nahi hain");
    } else {
      backupStatus.setStatus(
        "⚠️ Fail — internet check karein (agli koshish 5 minute mein)",
      );
    }
  } catch (err) {
    backupStatus.setStatus("⚠️ Cloud sync error — script missing ya koi masla");
  }

  try {
    const computerId = license.getComputerId();
    const remoteStatus = await license.checkRemoteLicenseStatus(computerId);
    if (remoteStatus.checked && remoteStatus.revoked) {
      license.markDeactivated();

      dialog.showMessageBox({
        type: "warning",
        title: "License Deactivated",
        message:
          "Yeh software deactivate kar diya gaya hai. Software provider se rabta karein.",
      });
      setTimeout(() => {
        app.relaunch();
        app.exit(0);
      }, 1000);
    }
  } catch (err) {}
}

async function createMainWindow() {
  await startPosServer();

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "Restaurant Management System",
    webPreferences: { contextIsolation: true, nodeIntegration: false },
  });
  mainWindow.setMenuBarVisibility(false);
  mainWindow.loadURL(`https://localhost:${PORT}`);

  createTray();
}

function createDeactivateWindow() {
  const win = new BrowserWindow({
    width: 420,
    height: 500,
    resizable: false,
    title: "App Deactivate Karein",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.setMenuBarVisibility(false);
  win.loadFile(path.join(__dirname, "deactivate-screen.html"));
}

function createTray() {
  try {
    tray = new Tray(path.join(__dirname, "tray-icon.png"));
  } catch {
    return;
  }
  const menu = Menu.buildFromTemplate([
    {
      label: "LAN Address Dikhayen",
      click: () => {
        dialog.showMessageBox({
          type: "info",
          title: "Restaurant Management System — Local Network Address",
          message: `Baaqi devices (Waiter Tablet / Cashier PC / Kitchen Display) yeh address browser mein khol kar POS use kar sakte hain:\n\n${getLanUrl()}`,
        });
      },
    },
    {
      label: "Browser Mein Kholain",
      click: () => shell.openExternal(`https://localhost:${PORT}`),
    },
    { type: "separator" },
    {
      label: "📦 Local Backup Abhi Karein",
      click: async () => {
        const { runLocalBackup } = require(
          path.join(__dirname, "..", "script", "backup-db.js"),
        );
        const result = await runLocalBackup();
        dialog.showMessageBox({
          type: result.ok ? "info" : "error",
          title: "Local Backup",
          message: result.ok
            ? `✅ Local Backup Mukammal!\n\n${formatPKT(new Date())} (PKT)\nFolder: ${result.outDir}`
            : "❌ Backup fail ho gaya — MongoDB Database Tools ya Local MongoDB check karein.",
        });
      },
    },
    { type: "separator" },
    {
      label: "☁️ Cloud Backup Status ab Settings page mein hai",
      enabled: false,
    },
    { type: "separator" },
    {
      label: "⛔ App Deactivate Karein",
      click: () => createDeactivateWindow(),
    },
    { type: "separator" },
    { label: "Band Karein (Quit)", click: () => app.quit() },
  ]);
  tray.setToolTip("Restaurant Management System — Main Server chal raha hai");
  tray.setContextMenu(menu);
}

ipcMain.handle("license:get-computer-id", () => license.getComputerId());

ipcMain.handle("license:activate", (event, enteredKey) => {
  const computerId = license.getComputerId();
  const ok = license.verifyKey(computerId, enteredKey);
  if (ok) {
    license.saveActivation(computerId, enteredKey);
    setTimeout(async () => {
      await createMainWindow();
      if (licenseWindow) licenseWindow.close();
    }, 900);
  }
  return { ok };
});

ipcMain.handle("license:deactivate", (event, enteredCode) => {
  const computerId = license.getComputerId();
  const ok = license.verifyDeactivationCode(computerId, enteredCode);
  if (ok) {
    license.markDeactivated();

    setTimeout(() => {
      app.relaunch();
      app.exit(0);
    }, 1500);
  }
  return { ok };
});

async function unlockIfReactivatedRemotely() {
  if (!license.wasRevokedLocally()) return;
  try {
    const computerId = license.getComputerId();
    const remoteStatus = await license.checkRemoteLicenseStatus(computerId);
    if (remoteStatus.checked && !remoteStatus.revoked) {
      license.clearRevoked();
    }
  } catch {}
}

app.on(
  "certificate-error",
  (event, webContents, url, error, certificate, callback) => {
    if (url.startsWith(`https://localhost:${PORT}`)) {
      event.preventDefault();
      callback(true);
    } else {
      callback(false);
    }
  },
);

app.whenReady().then(async () => {
  global.__ELECTRON_USER_DATA__ = app.getPath("userData");

  await unlockIfReactivatedRemotely();

  if (license.isActivated()) {
    createMainWindow();
  } else {
    createLicenseWindow();
  }

  app.on("activate", async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await unlockIfReactivatedRemotely();
      license.isActivated() ? createMainWindow() : createLicenseWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin" && !tray) {
    app.quit();
  }
});
