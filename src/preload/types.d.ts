/**
 * FZautochoice — Preload Type Declarations
 * Makes the exposed API available to renderer TypeScript
 */

import type { fzApi } from './index'

declare global {
  interface Window {
    fzApi: typeof fzApi
  }
}

export {}
