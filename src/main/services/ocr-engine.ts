/**
 * FZautochoice — OCR Engine
 * Text recognition using Tesseract.js for cross-platform offline OCR
 */
import Tesseract from 'tesseract.js'

/** Word position data from OCR */
export interface OcrWord {
  /** Recognized text */
  text: string
  /** Confidence score 0-100 */
  confidence: number
  /** X center coordinate */
  x: number
  /** Y center coordinate */
  y: number
  /** Bounding box */
  bbox: {
    x0: number
    y0: number
    x1: number
    y1: number
  }
}

/** OCR recognition result */
export interface OcrResult {
  /** Full recognized text */
  text: string
  /** Overall confidence 0-1 */
  confidence: number
  /** Individual word positions */
  words: OcrWord[]
}

/**
 * OCR engine powered by Tesseract.js.
 * Provides offline text recognition with word-level positioning.
 */
export class OcrEngine {
  private worker: Tesseract.Worker | null = null
  private language: string = 'eng'
  private initialized: boolean = false

  /**
   * Initializes the Tesseract.js worker
   * @param language - OCR language code (default: 'eng')
   */
  async initialize(language: string = 'eng'): Promise<void> {
    if (this.initialized && this.language === language) return

    // Terminate existing worker if language changed
    if (this.worker) {
      await this.worker.terminate()
    }

    this.language = language
    this.worker = await Tesseract.createWorker(language)
    this.initialized = true
  }

  /**
   * Recognizes text in an image buffer
   * @param image - Image data with a PNG buffer
   * @returns OCR result with text, confidence, and word positions
   */
  async recognize(image: { buffer: Buffer }): Promise<OcrResult> {
    if (!this.worker) {
      await this.initialize()
    }

    const result = await this.worker!.recognize(image.buffer)

    const words: OcrWord[] = (result.data.words || []).map((word) => ({
      text: word.text,
      confidence: word.confidence,
      x: Math.round((word.bbox.x0 + word.bbox.x1) / 2),
      y: Math.round((word.bbox.y0 + word.bbox.y1) / 2),
      bbox: {
        x0: word.bbox.x0,
        y0: word.bbox.y0,
        x1: word.bbox.x1,
        y1: word.bbox.y1,
      },
    }))

    return {
      text: result.data.text,
      confidence: result.data.confidence / 100,
      words,
    }
  }

  /**
   * Changes the OCR language
   */
  async setLanguage(language: string): Promise<void> {
    if (language !== this.language) {
      await this.initialize(language)
    }
  }

  /**
   * Terminates the OCR worker to free resources
   */
  async terminate(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate()
      this.worker = null
      this.initialized = false
    }
  }
}
