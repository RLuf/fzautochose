# AGENTS.md — FZautochoice Development Rules

> **Version:** 1.0.0  
> **Updated:** 2026-06-29  
> **Status:** Active — Permanent

---

## 1. Project Overview

**FZautochoice** is a cross-platform, compilable desktop application for automated dialog detection and button clicking. Built with **Electron + TypeScript + Vite**, it uses **Tesseract.js** for OCR and **xdotool/PowerShell** for click automation.

### Architecture Stack

| Layer | Technology |
|:------|:-----------|
| Desktop Framework | Electron 36+ |
| Bundler/DX | Vite + electron-vite |
| Language | TypeScript (strict mode) |
| UI | Vanilla HTML/CSS (dark glassmorphism theme) |
| OCR | Tesseract.js v5 (pure JS, offline) |
| Clicking | xdotool (Linux) / PowerShell (Windows) |
| Packaging | electron-builder |
| AI | Ollama, Claude Code CLI, OpenAI-compatible |
| CI/CD | GitHub Actions |

---

## 2. Architecture Constraints

### Process Model
- **Main process** (`src/main/`): Electron backend, services, IPC handlers
- **Preload** (`src/preload/`): Context bridge, secure API exposure
- **Renderer** (`src/renderer/`): UI, DOM manipulation, event handling
- All communication goes through the **IPC bridge** — never access Node.js APIs directly from renderer

### Security
- `contextIsolation: true` — ALWAYS
- `nodeIntegration: false` — ALWAYS
- All IPC channels are whitelisted in preload
- Never commit API keys, tokens, or secrets
- AI endpoint credentials stored in user data directory, not in source
- All external process execution uses parameterized commands (no shell injection)

### Service Architecture
```
src/main/services/
├── screen-capture.ts   — Electron desktopCapturer
├── ocr-engine.ts       — Tesseract.js worker management
├── dialog-matcher.ts   — Text pattern matching (contains/exact/regex/fuzzy)
├── click-engine.ts     — Cross-platform click via CLI tools
├── schema-manager.ts   — Schema CRUD + settings persistence
└── ai-integration.ts   — Multi-provider AI client
```

Each service is a **class** with well-defined methods. Services are instantiated once in `ipc-handlers.ts`.

---

## 3. Coding Standards

### TypeScript
- **Strict mode** enabled (`strict: true`)
- All functions have **JSDoc comments** with `@param` and `@returns`
- Prefer `const` over `let`, never use `var`
- Use `interface` for data shapes, `type` for unions/intersections
- No `any` unless absolutely required (document why)
- Async/await over raw Promises

### CSS
- All design tokens defined as **CSS custom properties** in `index.css`
- BEM-like naming: `.component__element--modifier`
- No inline styles in HTML (exceptions: dynamic values set by JS)
- Animations use CSS `@keyframes` and `transition` — no JS animation libraries

### File Naming
- TypeScript: `kebab-case.ts`
- CSS: `index.css` (single design system file)
- Schemas: `kebab-case.fzschema`
- Components: `component-name.ts`

---

## 4. Build & Release

### Development
```bash
npm run dev          # Start with HMR
npm run build        # Build for production
npm run typecheck    # Type verification
```

### Packaging
```bash
npm run build:linux  # Build → AppImage + deb
npm run build:win    # Build → Portable exe + NSIS installer
npm run build:all    # Build both platforms
```

### Release Workflow
1. Bump version in `package.json`
2. Update `CHANGELOG.md`
3. Commit and push
4. Create and push tag: `git tag v1.0.0 && git push origin v1.0.0`
5. GitHub Actions builds both platforms and creates a release

### Tag Format
- Release: `v1.0.0`, `v1.2.3`
- Pre-release: `v1.0.0-beta.1`, `v1.0.0-alpha.1`
- Pre-release tags generate draft releases

---

## 5. Dependencies

### Runtime
- `tesseract.js` — Offline OCR engine

### Development
- `electron` — Desktop framework
- `electron-vite` — Build tooling with HMR
- `electron-builder` — Packaging and distribution
- `typescript` — Type safety
- `vite` — Bundler

### System Dependencies (Runtime)
- **Linux**: `xdotool` (for mouse/keyboard simulation)
- **Windows**: PowerShell (built-in)

---

## 6. Schema Format

Schemas are JSON files with `.fzschema` extension:

```json
{
  "version": "1.0.0",
  "name": "Schema Name",
  "description": "What this schema does",
  "detection": {
    "text": "dialog text to match",
    "matchMode": "contains|exact|regex|fuzzy",
    "options": [
      { "text": "Yes", "autoClick": true }
    ]
  },
  "actions": {
    "targets": ["Yes", "Submit"],
    "clickType": "single|double|right",
    "clickDelay": 500
  }
}
```

---

## 7. Git Rules

- **Never force push** to `main`
- **Always ask** before git operations (commit, push, merge)
- Branch naming: `feature/xxx`, `fix/xxx`, `release/vX.X.X`
- Commit messages: conventional commits (`feat:`, `fix:`, `docs:`, `build:`)
- No secrets in commits — verify with `git diff --staged`

---

*This document applies to all current and future development on FZautochoice.*
