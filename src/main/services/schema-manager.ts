/**
 * FZautochoice — Schema Manager
 * Handles save/load/import/export of automation schemas and settings
 */
import { app } from 'electron'
import * as fs from 'fs'
import * as path from 'path'

/** Schema data structure */
export interface FZSchema {
  /** Schema version for migration */
  version: string
  /** Display name */
  name: string
  /** User description */
  description: string
  /** Creation timestamp */
  createdAt: string
  /** Last modified timestamp */
  modifiedAt: string
  /** Detection configuration */
  detection: {
    text: string
    content: string
    matchMode: string
    scanRegion: string
    options: Array<{ text: string; autoClick: boolean }>
  }
  /** Action configuration */
  actions: {
    targets: string[]
    clickType: string
    clickDelay: number
    keyboardKey: string
    postClickAction: string
  }
  /** AI configuration (optional) */
  ai?: {
    provider: string
    endpoint: string
    model: string
    autoDecide: boolean
    confidenceThreshold: number
    promptTemplate: string
  }
}

/**
 * Manages schema persistence, import/export, and application settings.
 * Schemas are stored as .fzschema JSON files in the user data directory.
 */
export class SchemaManager {
  private readonly schemasDir: string
  private readonly settingsPath: string

  constructor() {
    const userDataPath = app.getPath('userData')
    this.schemasDir = path.join(userDataPath, 'schemas')
    this.settingsPath = path.join(userDataPath, 'settings.json')

    // Ensure schemas directory exists
    if (!fs.existsSync(this.schemasDir)) {
      fs.mkdirSync(this.schemasDir, { recursive: true })
    }
  }

  /**
   * Saves a schema to disk
   */
  async save(schema: Partial<FZSchema>): Promise<void> {
    const fullSchema: FZSchema = {
      version: '1.0.0',
      name: schema.name || 'Untitled Schema',
      description: schema.description || '',
      createdAt: schema.createdAt || new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
      detection: {
        text: '',
        content: '',
        matchMode: 'contains',
        scanRegion: 'fullscreen',
        options: [],
        ...(schema.detection || {}),
      },
      actions: {
        targets: ['Yes', 'Submit'],
        clickType: 'single',
        clickDelay: 500,
        keyboardKey: '',
        postClickAction: 'resume',
        ...(schema.actions || {}),
      },
      ai: schema.ai,
    }

    const filename = this.sanitizeFilename(fullSchema.name) + '.fzschema'
    const filepath = path.join(this.schemasDir, filename)

    await fs.promises.writeFile(filepath, JSON.stringify(fullSchema, null, 2), 'utf-8')
  }

  /**
   * Loads all schemas from the schemas directory
   */
  async loadAll(): Promise<FZSchema[]> {
    const schemas: FZSchema[] = []

    try {
      const files = await fs.promises.readdir(this.schemasDir)

      for (const file of files) {
        if (file.endsWith('.fzschema') || file.endsWith('.json')) {
          try {
            const filepath = path.join(this.schemasDir, file)
            const content = await fs.promises.readFile(filepath, 'utf-8')
            const schema = JSON.parse(content) as FZSchema
            schemas.push(schema)
          } catch (error) {
            console.warn(`SchemaManager: Failed to load ${file}:`, error)
          }
        }
      }
    } catch (error) {
      console.warn('SchemaManager: Failed to read schemas directory:', error)
    }

    return schemas
  }

  /**
   * Loads a single schema by name
   */
  async load(name: string): Promise<FZSchema | null> {
    const filename = this.sanitizeFilename(name) + '.fzschema'
    const filepath = path.join(this.schemasDir, filename)

    try {
      const content = await fs.promises.readFile(filepath, 'utf-8')
      return JSON.parse(content) as FZSchema
    } catch {
      return null
    }
  }

  /**
   * Deletes a schema by name
   */
  async deleteSchema(name: string): Promise<void> {
    const filename = this.sanitizeFilename(name) + '.fzschema'
    const filepath = path.join(this.schemasDir, filename)

    try {
      await fs.promises.unlink(filepath)
    } catch {
      console.warn(`SchemaManager: Schema "${name}" not found for deletion`)
    }
  }

  /**
   * Imports a schema from an external file
   */
  async importFromFile(sourcePath: string): Promise<FZSchema> {
    const content = await fs.promises.readFile(sourcePath, 'utf-8')
    const schema = JSON.parse(content) as FZSchema

    // Save to schemas directory
    await this.save(schema)

    return schema
  }

  /**
   * Exports the most recently saved schema to a file
   */
  async exportToFile(destPath: string): Promise<void> {
    const schemas = await this.loadAll()
    if (schemas.length === 0) {
      throw new Error('No schemas to export')
    }

    // Export the last modified schema
    const latest = schemas.sort(
      (a, b) => new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime()
    )[0]

    await fs.promises.writeFile(destPath, JSON.stringify(latest, null, 2), 'utf-8')
  }

  // ── Settings ──

  /**
   * Saves application settings
   */
  async saveSettings(settings: Record<string, unknown>): Promise<void> {
    await fs.promises.writeFile(this.settingsPath, JSON.stringify(settings, null, 2), 'utf-8')
  }

  /**
   * Loads application settings
   */
  async loadSettings(): Promise<Record<string, unknown>> {
    try {
      const content = await fs.promises.readFile(this.settingsPath, 'utf-8')
      return JSON.parse(content)
    } catch {
      // Return defaults
      return {
        scanInterval: 2000,
        ocrLanguage: 'eng',
        confidenceThreshold: 70,
        maxRetries: 3,
        notifyOnClick: true,
        soundOnMatch: false,
        startMinimized: false,
        autoStartMonitor: false,
        verboseLogging: false,
      }
    }
  }

  /**
   * Sanitizes a string for use as a filename
   */
  private sanitizeFilename(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9_\-\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 100)
  }
}
