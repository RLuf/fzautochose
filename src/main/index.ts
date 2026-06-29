/**
 * FZautochoice — Electron Main Process Entry
 * Creates the application window, registers IPC handlers, and manages lifecycle
 */
import { app, BrowserWindow, globalShortcut, Tray, Menu, nativeImage } from 'electron'
import { join } from 'path'
import { registerIpcHandlers } from './ipc-handlers'

// Parse CLI help argument
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
FZautochoice v1.0.0
Cross-platform desktop application for automated dialog detection and button clicking.

Usage:
  fzautochoice [options]

Options:
  -h, --help     Show this help screen
  --version      Print version information

System Hotkeys:
  Ctrl+Shift+F9   Start/Stop dialog monitoring
  Ctrl+Shift+F10  Perform a single test scan

Author: Roger Luft (veilwaker)
Website: https://about.rogerluft.com.br
License: CC-BY-4.0
  `);
  process.exit(0);
}

if (process.argv.includes('--version')) {
  console.log('FZautochoice v1.0.0');
  process.exit(0);
}

/** The main application window */
let mainWindow: BrowserWindow | null = null

/** System tray icon */
let tray: Tray | null = null

/**
 * Creates the main application window with security-hardened settings
 */
function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 780,
    minWidth: 800,
    minHeight: 600,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#0d1117',
    icon: join(__dirname, '../../resources/icon.png'),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // Required for screen capture
    },
    show: false,
  })

  // Graceful show when ready
  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  // Load the renderer
  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // Open devtools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

/**
 * Creates the system tray icon with a context menu
 */
function createTray(): void {
  const icon = nativeImage.createEmpty()
  tray = new Tray(icon)
  tray.setToolTip('FZautochoice')

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show FZautochoice',
      click: () => mainWindow?.show(),
    },
    {
      label: 'Start Monitoring',
      click: () => mainWindow?.webContents.send('tray:start'),
    },
    {
      label: 'Stop Monitoring',
      click: () => mainWindow?.webContents.send('tray:stop'),
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.quit()
      },
    },
  ])

  tray.setContextMenu(contextMenu)

  tray.on('double-click', () => {
    mainWindow?.show()
  })
}

/**
 * Registers global keyboard shortcuts
 */
function registerShortcuts(): void {
  // Toggle monitoring: Ctrl+Shift+F9
  globalShortcut.register('CommandOrControl+Shift+F9', () => {
    mainWindow?.webContents.send('shortcut:toggle-monitor')
  })

  // Quick test scan: Ctrl+Shift+F10
  globalShortcut.register('CommandOrControl+Shift+F10', () => {
    mainWindow?.webContents.send('shortcut:test-scan')
  })
}

// ── App Lifecycle ──

app.whenReady().then(() => {
  // Register all IPC handlers
  registerIpcHandlers()

  // Create window
  createWindow()

  // Create tray
  createTray()

  // Register shortcuts
  registerShortcuts()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

export { mainWindow }
