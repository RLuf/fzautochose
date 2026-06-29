/**
 * FZautochoice — Preload Script
 * Exposes a secure API to the renderer via contextBridge
 */
import { contextBridge, ipcRenderer } from 'electron'

/**
 * The API exposed to the renderer process
 */
export const fzApi = {
  // ── Window Controls ──
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  maximizeWindow: () => ipcRenderer.send('window:maximize'),
  closeWindow: () => ipcRenderer.send('window:close'),

  // ── Platform ──
  getPlatform: (): Promise<string> => ipcRenderer.invoke('app:get-platform'),

  // ── Monitoring ──
  startMonitoring: (schema: unknown): Promise<void> => ipcRenderer.invoke('monitor:start', schema),
  stopMonitoring: (): Promise<void> => ipcRenderer.invoke('monitor:stop'),
  testScan: (): Promise<{ matchCount: number; detectedText: string }> =>
    ipcRenderer.invoke('monitor:test-scan'),

  // ── Schemas ──
  saveSchema: (schema: unknown): Promise<void> => ipcRenderer.invoke('schema:save', schema),
  loadSchemas: (): Promise<unknown[]> => ipcRenderer.invoke('schema:load-all'),
  deleteSchema: (name: string): Promise<void> => ipcRenderer.invoke('schema:delete', name),
  importSchema: (): Promise<void> => ipcRenderer.invoke('schema:import'),
  exportSchema: (): Promise<void> => ipcRenderer.invoke('schema:export'),

  // ── AI Integration ──
  detectAIProviders: (): Promise<Record<string, boolean>> =>
    ipcRenderer.invoke('ai:detect-providers'),
  testAIConnection: (endpoint: string): Promise<{ success: boolean; model?: string; error?: string }> =>
    ipcRenderer.invoke('ai:test-connection', endpoint),
  analyzeWithAI: (text: string): Promise<unknown> =>
    ipcRenderer.invoke('ai:analyze', text),

  // ── Settings ──
  saveSettings: (settings: Record<string, unknown>): Promise<void> =>
    ipcRenderer.invoke('settings:save', settings),
  loadSettings: (): Promise<Record<string, unknown>> =>
    ipcRenderer.invoke('settings:load'),

  // ── Events (Main → Renderer) ──
  onScanResult: (callback: (result: { text: string; confidence: number }) => void) => {
    ipcRenderer.on('monitor:scan-result', (_event, result) => callback(result))
  },
  onMatchFound: (callback: (match: { pattern: string; confidence: number }) => void) => {
    ipcRenderer.on('monitor:match-found', (_event, match) => callback(match))
  },
  onClickExecuted: (callback: (click: { target: string; success: boolean }) => void) => {
    ipcRenderer.on('monitor:click-executed', (_event, click) => callback(click))
  },
  onLogMessage: (callback: (msg: { type: string; text: string }) => void) => {
    ipcRenderer.on('log:message', (_event, msg) => callback(msg))
  },
}

// Expose to renderer
contextBridge.exposeInMainWorld('fzApi', fzApi)
