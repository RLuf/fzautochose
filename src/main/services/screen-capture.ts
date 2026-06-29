/**
 * FZautochoice — Screen Capture Service
 * Captures screen or active window screenshots for OCR processing
 */
import { desktopCapturer, screen } from 'electron'

/** Captured image data for OCR processing */
export interface CapturedImage {
  /** Raw image buffer (PNG format) */
  buffer: Buffer
  /** Image width in pixels */
  width: number
  /** Image height in pixels */
  height: number
}

/**
 * Service responsible for capturing screen content.
 * Uses Electron's desktopCapturer API for cross-platform support.
 */
export class ScreenCaptureService {
  /**
   * Captures the screen based on the specified region mode
   * @param region - Capture mode: 'fullscreen', 'active-window', or 'custom'
   * @returns Captured image data
   */
  async capture(region: string = 'fullscreen'): Promise<CapturedImage> {
    switch (region) {
      case 'active-window':
        return this.captureActiveWindow()
      case 'custom':
        return this.captureFullScreen() // TODO: implement custom region
      case 'fullscreen':
      default:
        return this.captureFullScreen()
    }
  }

  /**
   * Captures the entire primary display
   */
  private async captureFullScreen(): Promise<CapturedImage> {
    const primaryDisplay = screen.getPrimaryDisplay()
    const { width, height } = primaryDisplay.size

    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { width, height },
    })

    if (sources.length === 0) {
      throw new Error('No screen sources available for capture')
    }

    const source = sources[0]
    const thumbnail = source.thumbnail

    return {
      buffer: thumbnail.toPNG(),
      width: thumbnail.getSize().width,
      height: thumbnail.getSize().height,
    }
  }

  /**
   * Captures only the active/focused window
   */
  private async captureActiveWindow(): Promise<CapturedImage> {
    const sources = await desktopCapturer.getSources({
      types: ['window'],
      thumbnailSize: { width: 1920, height: 1080 },
    })

    if (sources.length === 0) {
      // Fallback to full screen if no window sources
      return this.captureFullScreen()
    }

    // The first window source is typically the focused one
    const source = sources[0]
    const thumbnail = source.thumbnail

    return {
      buffer: thumbnail.toPNG(),
      width: thumbnail.getSize().width,
      height: thumbnail.getSize().height,
    }
  }
}
