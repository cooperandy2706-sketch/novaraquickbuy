// FILE: electron/main.js
// Novara QuickBuy — Electron Desktop App Main Process

const { app, BrowserWindow, shell, Menu, nativeImage, Tray } = require('electron')
const path = require('path')

// ── App URL ────────────────────────────────────────────────────────────────
// Points to the live Vercel deployment. Updates are automatic.
const APP_URL = 'https://novaraquickbuy.vercel.app'

let mainWindow = null
let tray = null

// ── Security: prevent new windows from opening in Electron ────────────────
function preventNewWindowNavigation(win) {
  win.webContents.setWindowOpenHandler(({ url }) => {
    // Open external links (e.g. Stripe, Google OAuth) in the user's browser
    if (!url.startsWith(APP_URL)) {
      shell.openExternal(url)
      return { action: 'deny' }
    }
    return { action: 'deny' }
  })
}

// ── Create Main Window ────────────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width:           1280,
    height:          820,
    minWidth:        800,
    minHeight:       600,
    title:           'Novara Quickbuy',
    backgroundColor: '#ffffff',
    icon:            path.join(__dirname, '../public/novara-icon.png'),
    webPreferences: {
      contextIsolation:   true,
      nodeIntegration:    false,
      webSecurity:        true,
    },
    // macOS: hide the default titlebar for a cleaner look
    titleBarStyle:   process.platform === 'darwin' ? 'hiddenInset' : 'default',
    show:            false, // Don't show until ready to prevent white flash
  })

  // Load the live app
  mainWindow.loadURL(APP_URL)

  // Gracefully show the window once the page has loaded
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    mainWindow.focus()
  })

  preventNewWindowNavigation(mainWindow)

  // On macOS, clicking the dock icon should re-open the window
  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// ── App Menu ──────────────────────────────────────────────────────────────
function buildMenu() {
  const isMac = process.platform === 'darwin'

  const template = [
    // macOS app menu
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    }] : []),
    {
      label: 'Navigation',
      submenu: [
        {
          label: 'Home',
          accelerator: 'CmdOrCtrl+Shift+H',
          click: () => mainWindow?.loadURL(APP_URL),
        },
        {
          label: 'Feed',
          accelerator: 'CmdOrCtrl+Shift+F',
          click: () => mainWindow?.loadURL(`${APP_URL}/feed`),
        },
        {
          label: 'Explore',
          accelerator: 'CmdOrCtrl+Shift+E',
          click: () => mainWindow?.loadURL(`${APP_URL}/explore`),
        },
        { type: 'separator' },
        {
          label: 'Vendor Dashboard',
          click: () => mainWindow?.loadURL(`${APP_URL}/vendor/dashboard`),
        },
        {
          label: 'My Account',
          click: () => mainWindow?.loadURL(`${APP_URL}/customer/profile`),
        },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac ? [
          { type: 'separator' },
          { role: 'front' },
        ] : [
          { role: 'close' },
        ]),
      ],
    },
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

// ── App Lifecycle ─────────────────────────────────────────────────────────
app.whenReady().then(() => {
  createWindow()
  buildMenu()

  // macOS: Re-create the window when the dock icon is clicked
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    } else {
      mainWindow?.show()
    }
  })
})

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Set the app name correctly on all platforms
app.setName('Novara Quickbuy')
