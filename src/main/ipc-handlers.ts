/**
 * FZautochoice — IPC Handler Registration
 * Connects renderer requests to backend services
 */
import { ipcMain, BrowserWindow, dialog, app } from 'electron'
import { ScreenCaptureService } from './services/screen-capture'
import { OcrEngine } from './services/ocr-engine'
import { DialogMatcher } from './services/dialog-matcher'
import { ClickEngine } from './services/click-engine'
import { SchemaManager } from './services/schema-manager'
import { AIIntegration } from './services/ai-integration'
import * as os from 'os'

/** Service instances */
let screenCapture: ScreenCaptureService
let ocrEngine: OcrEngine
let dialogMatcher: DialogMatcher
let clickEngine: ClickEngine
let schemaManager: SchemaManager
let aiIntegration: AIIntegration

/** Monitoring state */
let monitoringInterval: ReturnType<typeof setInterval> | null = null

/**
 * Registers all IPC handlers for the application
 */
export function registerIpcHandlers(): void {
  // Initialize services
  screenCapture = new ScreenCaptureService()
  ocrEngine = new OcrEngine()
  dialogMatcher = new DialogMatcher()
  clickEngine = new ClickEngine()
  schemaManager = new SchemaManager()
  aiIntegration = new AIIntegration()

  // ── Window Controls ──
  ipcMain.on('window:minimize', (event) => {
    BrowserWindow.fromWebContents(event.sender)?.minimize()
  })

  ipcMain.on('window:maximize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win?.isMaximized()) {
      win.unmaximize()
    } else {
      win?.maximize()
    }
  })

  ipcMain.on('window:close', (event) => {
    BrowserWindow.fromWebContents(event.sender)?.close()
  })

  // ── Platform ──
  ipcMain.handle('app:get-platform', () => {
    return `${os.platform()} ${os.arch()} — ${os.release()}`
  })

  // ── Monitoring ──
  ipcMain.handle('monitor:start', async (event, schema) => {
    if (monitoringInterval) return

    const sender = event.sender
    const interval = schema?.settings?.scanInterval || 2000

    // Initialize OCR engine
    await ocrEngine.initialize()

    monitoringInterval = setInterval(async () => {
      try {
        // 1. Capture screen
        const image = await screenCapture.capture(schema?.detection?.scanRegion || 'fullscreen')

        // 2. Run OCR
        const ocrResult = await ocrEngine.recognize(image)

        // Notify renderer of scan result
        sender.send('monitor:scan-result', {
          text: ocrResult.text,
          confidence: ocrResult.confidence,
        })

        // 3. Match against patterns
        const matches = dialogMatcher.match(ocrResult, {
          text: schema?.detection?.text || '',
          content: schema?.detection?.content || '',
          mode: schema?.detection?.matchMode || 'contains',
          options: schema?.detection?.options || [],
        })

        if (matches.length > 0) {
          for (const match of matches) {
            sender.send('monitor:match-found', {
              pattern: match.pattern,
              confidence: match.confidence,
            })

            // 4. Execute click on target
            const targets = schema?.actions?.targets || ['Yes', 'Submit']
            for (const target of targets) {
              const targetPosition = ocrResult.words?.find(
                (w: { text: string }) =>
                  w.text.toLowerCase().includes(target.toLowerCase())
              )

              if (targetPosition) {
                const success = await clickEngine.click(
                  targetPosition.x,
                  targetPosition.y,
                  schema?.actions?.clickType || 'single'
                )

                sender.send('monitor:click-executed', {
                  target,
                  success,
                })

                // Apply post-click delay
                if (schema?.actions?.clickDelay) {
                  await new Promise((resolve) =>
                    setTimeout(resolve, schema.actions.clickDelay)
                  )
                }

                break // Click first matching target
              }
            }
          }
        }
      } catch (error) {
        sender.send('log:message', {
          type: 'error',
          text: `Scan error: ${(error as Error).message}`,
        })
      }
    }, interval)
  })

  ipcMain.handle('monitor:stop', async () => {
    if (monitoringInterval) {
      clearInterval(monitoringInterval)
      monitoringInterval = null
    }
  })

  ipcMain.handle('monitor:test-scan', async () => {
    try {
      await ocrEngine.initialize()
      const image = await screenCapture.capture('fullscreen')
      const result = await ocrEngine.recognize(image)

      const matches = dialogMatcher.match(result, {
        text: '',
        content: '',
        mode: 'contains',
        options: [],
      })

      return {
        matchCount: matches.length,
        detectedText: result.text || '',
      }
    } catch (error) {
      return {
        matchCount: 0,
        detectedText: `Error: ${(error as Error).message}`,
      }
    }
  })

  // ── Schema Management ──
  ipcMain.handle('schema:save', async (_event, schema) => {
    await schemaManager.save(schema)
  })

  ipcMain.handle('schema:load-all', async () => {
    return await schemaManager.loadAll()
  })

  ipcMain.handle('schema:delete', async (_event, name) => {
    await schemaManager.deleteSchema(name)
  })

  ipcMain.handle('schema:import', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return

    const result = await dialog.showOpenDialog(win, {
      title: 'Import Schema',
      filters: [{ name: 'FZ Schema', extensions: ['fzschema', 'json'] }],
      properties: ['openFile'],
    })

    if (!result.canceled && result.filePaths.length > 0) {
      await schemaManager.importFromFile(result.filePaths[0])
    }
  })

  ipcMain.handle('schema:export', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return

    const result = await dialog.showSaveDialog(win, {
      title: 'Export Schema',
      filters: [{ name: 'FZ Schema', extensions: ['fzschema'] }],
    })

    if (!result.canceled && result.filePath) {
      await schemaManager.exportToFile(result.filePath)
    }
  })

  // ── AI Integration ──
  ipcMain.handle('ai:detect-providers', async () => {
    return await aiIntegration.detectProviders()
  })

  ipcMain.handle('ai:test-connection', async (_event, endpoint) => {
    return await aiIntegration.testConnection(endpoint)
  })

  ipcMain.handle('ai:analyze', async (_event, text) => {
    return await aiIntegration.analyze(text)
  })

  // ── Settings ──
  ipcMain.handle('settings:save', async (_event, settings) => {
    await schemaManager.saveSettings(settings)
  })

  ipcMain.handle('settings:load', async () => {
    return await schemaManager.loadSettings()
  })
}
