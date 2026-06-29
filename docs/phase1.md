# Phase 1 Architecture: Dialog Detection & Auto-Click

This document provides details on the Phase 1 architecture of **FZautochoice**, focusing on screen capture, OCR text extraction, pattern matching, and simulated clicking.

## 1. Process Communication (IPC)

FZautochoice separates the desktop frontend from the native desktop capabilities using Electron's secure IPC structure:

- **Renderer Process (`src/renderer/`)**: Executes the dark glassmorphism Web UI and captures user input (text matching inputs, option list, settings).
- **Preload Script (`src/preload/index.ts`)**: Exposes an API (`window.fzApi`) in a context-isolated environment, ensuring that the renderer cannot access Node APIs directly.
- **Main Process (`src/main/index.ts`)**: Runs the Node.js backend environment and manages automation cycles and system integrations.

```
+--------------------+        IPC Channel        +-----------------------+
|  Renderer (Web UI) | <=======================> |  Main Process (Node)  |
+--------------------+                           +-----------------------+
          |                                                  |
          | (User Configures Schema)                         | (Performs Screen Capture)
          v                                                  v
   window.fzApi                                         OCR & Matching
```

## 2. Core Service Architectures

### 2.1 Screen Capture Service (`screen-capture.ts`)
Uses Electron's `desktopCapturer` to fetch desktop sources.
- **Fullscreen capture**: Obtains the primary display size and captures its thumbnail as a PNG buffer.
- **Active Window capture**: Grabs the active window source thumbnail to reduce OCR scanning overhead and limit detection scope to target apps.

### 2.2 OCR Engine (`ocr-engine.ts`)
Uses Tesseract.js (pure JS, offline-capable).
- The worker is created once and reused for all scans.
- Performs image processing and returns full text output as well as structured word layouts containing bounding box coordinates `(x, y)` for every word.

### 2.3 Dialog Matcher (`dialog-matcher.ts`)
Matches OCR text against user configurations.
- **Contains Mode**: Basic substring check.
- **Exact Mode**: Exact string match check.
- **Regex Mode**: Pattern evaluation (e.g. `Error.*code:\s*\d+`).
- **Fuzzy Mode**: Computes the Levenshtein distance between target phrases and source text to compute a similarity score.

### 2.4 Click Engine (`click-engine.ts`)
Handles cross-platform native input simulation via shell utilities:
- **Linux (`xdotool`)**: Spawns command to move mouse and simulate click.
- **Windows (`PowerShell`)**: Dynamically compiles and invokes Win32 API calls (`SetCursorPos` and `mouse_event` from `user32.dll`) via PowerShell child processes.
- This design achieves **zero native dependencies** and **highly portable** cross-platform builds.

## 3. Configuration & Schema Layout (`.fzschema`)

Preset profiles are saved in `.fzschema` JSON format:

```json
{
  "version": "1.0.0",
  "name": "Permission Dialog Handler",
  "description": "Auto-clicks Allow/Yes on permission dialogs",
  "detection": {
    "text": "Do you want to allow",
    "matchMode": "contains",
    "scanRegion": "fullscreen",
    "options": [
      { "text": "Allow", "autoClick": true },
      { "text": "Yes", "autoClick": true }
    ]
  },
  "actions": {
    "targets": ["Yes", "Allow", "OK"],
    "clickType": "single",
    "clickDelay": 500,
    "postClickAction": "resume"
  }
}
```
