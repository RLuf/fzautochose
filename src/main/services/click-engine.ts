/**
 * FZautochoice — Click Engine
 * Cross-platform mouse/keyboard simulation using CLI tools.
 * Linux: xdotool | Windows: PowerShell + user32.dll
 * Zero native dependencies — fully portable.
 */
import { exec } from 'child_process'
import { promisify } from 'util'
import * as os from 'os'

const execAsync = promisify(exec)

/** Supported click types */
export type ClickType = 'single' | 'double' | 'right'

/** Supported keyboard keys */
export type KeyAction = 'enter' | 'tab' | 'escape' | 'space' | 'y' | 'n'

/**
 * Cross-platform click engine.
 * Uses xdotool on Linux and PowerShell on Windows — no native modules required.
 */
export class ClickEngine {
  private readonly platform: NodeJS.Platform

  constructor() {
    this.platform = os.platform()
  }

  /**
   * Performs a mouse click at the specified screen coordinates
   * @param x - X coordinate
   * @param y - Y coordinate
   * @param type - Click type: 'single', 'double', or 'right'
   * @returns true if click was executed successfully
   */
  async click(x: number, y: number, type: ClickType = 'single'): Promise<boolean> {
    try {
      if (this.platform === 'linux') {
        return await this.clickLinux(x, y, type)
      } else if (this.platform === 'win32') {
        return await this.clickWindows(x, y, type)
      } else {
        console.warn(`ClickEngine: Unsupported platform "${this.platform}"`)
        return false
      }
    } catch (error) {
      console.error('ClickEngine: Click failed:', (error as Error).message)
      return false
    }
  }

  /**
   * Simulates a keyboard key press
   * @param key - Key to press
   * @returns true if key press was executed successfully
   */
  async pressKey(key: KeyAction): Promise<boolean> {
    try {
      if (this.platform === 'linux') {
        return await this.pressKeyLinux(key)
      } else if (this.platform === 'win32') {
        return await this.pressKeyWindows(key)
      }
      return false
    } catch (error) {
      console.error('ClickEngine: Key press failed:', (error as Error).message)
      return false
    }
  }

  /**
   * Moves the mouse cursor to the specified position
   * @param x - X coordinate
   * @param y - Y coordinate
   */
  async moveTo(x: number, y: number): Promise<boolean> {
    try {
      if (this.platform === 'linux') {
        await execAsync(`xdotool mousemove ${x} ${y}`)
        return true
      } else if (this.platform === 'win32') {
        const script = `
          Add-Type -TypeDefinition '
            using System;
            using System.Runtime.InteropServices;
            public class Win32Mouse {
              [DllImport("user32.dll")]
              public static extern bool SetCursorPos(int X, int Y);
            }
          '
          [Win32Mouse]::SetCursorPos(${x}, ${y})
        `
        await execAsync(`powershell -Command "${script.replace(/\n/g, ' ')}"`)
        return true
      }
      return false
    } catch {
      return false
    }
  }

  // ── Linux Implementation (xdotool) ──

  private async clickLinux(x: number, y: number, type: ClickType): Promise<boolean> {
    let button = '1' // left
    let clickCmd = 'click'

    switch (type) {
      case 'double':
        clickCmd = 'click --repeat 2 --delay 100'
        break
      case 'right':
        button = '3'
        break
    }

    // Move to position and click
    await execAsync(`xdotool mousemove ${x} ${y}`)
    await execAsync(`xdotool ${clickCmd} ${button}`)
    return true
  }

  private async pressKeyLinux(key: KeyAction): Promise<boolean> {
    const keyMap: Record<KeyAction, string> = {
      enter: 'Return',
      tab: 'Tab',
      escape: 'Escape',
      space: 'space',
      y: 'y',
      n: 'n',
    }

    const xdoKey = keyMap[key]
    if (!xdoKey) return false

    await execAsync(`xdotool key ${xdoKey}`)
    return true
  }

  // ── Windows Implementation (PowerShell + user32.dll) ──

  private async clickWindows(x: number, y: number, type: ClickType): Promise<boolean> {
    // Build PowerShell script for mouse simulation
    const script = this.buildWindowsClickScript(x, y, type)
    await execAsync(`powershell -NoProfile -ExecutionPolicy Bypass -Command "${script}"`)
    return true
  }

  private buildWindowsClickScript(x: number, y: number, type: ClickType): string {
    const addType = `
      Add-Type -TypeDefinition '
        using System;
        using System.Runtime.InteropServices;
        public class Win32Input {
          [DllImport("user32.dll")]
          public static extern bool SetCursorPos(int X, int Y);
          [DllImport("user32.dll")]
          public static extern void mouse_event(int dwFlags, int dx, int dy, int dwData, int dwExtraInfo);
          public const int MOUSEEVENTF_LEFTDOWN = 0x0002;
          public const int MOUSEEVENTF_LEFTUP = 0x0004;
          public const int MOUSEEVENTF_RIGHTDOWN = 0x0008;
          public const int MOUSEEVENTF_RIGHTUP = 0x0010;
        }
      '
    `.trim()

    let clickAction: string
    switch (type) {
      case 'double':
        clickAction = `
          [Win32Input]::mouse_event([Win32Input]::MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0);
          [Win32Input]::mouse_event([Win32Input]::MOUSEEVENTF_LEFTUP, 0, 0, 0, 0);
          Start-Sleep -Milliseconds 100;
          [Win32Input]::mouse_event([Win32Input]::MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0);
          [Win32Input]::mouse_event([Win32Input]::MOUSEEVENTF_LEFTUP, 0, 0, 0, 0);
        `
        break
      case 'right':
        clickAction = `
          [Win32Input]::mouse_event([Win32Input]::MOUSEEVENTF_RIGHTDOWN, 0, 0, 0, 0);
          [Win32Input]::mouse_event([Win32Input]::MOUSEEVENTF_RIGHTUP, 0, 0, 0, 0);
        `
        break
      default: // single
        clickAction = `
          [Win32Input]::mouse_event([Win32Input]::MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0);
          [Win32Input]::mouse_event([Win32Input]::MOUSEEVENTF_LEFTUP, 0, 0, 0, 0);
        `
    }

    return `${addType}; [Win32Input]::SetCursorPos(${x}, ${y}); ${clickAction}`.replace(/\n/g, ' ')
  }

  private async pressKeyWindows(key: KeyAction): Promise<boolean> {
    const keyMap: Record<KeyAction, string> = {
      enter: '{ENTER}',
      tab: '{TAB}',
      escape: '{ESC}',
      space: ' ',
      y: 'y',
      n: 'n',
    }

    const sendKey = keyMap[key]
    if (!sendKey) return false

    const script = `
      Add-Type -AssemblyName System.Windows.Forms;
      [System.Windows.Forms.SendKeys]::SendWait('${sendKey}');
    `.replace(/\n/g, ' ')

    await execAsync(`powershell -NoProfile -ExecutionPolicy Bypass -Command "${script}"`)
    return true
  }

  /**
   * Checks if the required CLI tools are available on this platform
   */
  async checkDependencies(): Promise<{ available: boolean; missing: string[] }> {
    const missing: string[] = []

    if (this.platform === 'linux') {
      try {
        await execAsync('which xdotool')
      } catch {
        missing.push('xdotool')
      }
    } else if (this.platform === 'win32') {
      try {
        await execAsync('powershell -Command "echo ok"')
      } catch {
        missing.push('powershell')
      }
    }

    return { available: missing.length === 0, missing }
  }
}
