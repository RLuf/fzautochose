# Changelog

All notable changes to **FZautochoice** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-06-29

### Added

#### Core Features
- **Dialog Detection via OCR** — Tesseract.js v5 powered screen text recognition
  - Full screen and active window capture modes
  - Configurable scan interval (500ms–30s)
  - Multi-language OCR support (English, Portuguese, Spanish, French, German)
  - Confidence scoring for detected text
- **Auto-Click Engine** — Cross-platform mouse/keyboard simulation
  - Linux: `xdotool` integration (zero native deps)
  - Windows: PowerShell + `user32.dll` (zero native deps)
  - Single click, double click, and right click support
  - Keyboard simulation (Enter, Tab, Escape, Space, Y, N)
  - Configurable click delay and post-click actions
- **Pattern Matching Engine** — Multiple matching modes
  - Contains (partial match)
  - Exact match
  - Regular expression
  - Fuzzy match (Levenshtein distance)
- **Detectable Options** — Dynamic option list with individual auto-click toggles
  - Pre-populated defaults: Allow, Yes, No
  - Add/remove options dynamically
  - Per-option auto-click checkbox
- **Auto-Click Targets** — Configurable target buttons
  - Pre-populated defaults: Yes, Submit, OK, Allow
  - Add/remove targets dynamically

#### Schema Management
- **Save/Load schemas** — Persist configurations as `.fzschema` JSON files
- **Import/Export** — Share schemas via file dialog
- **Multiple schemas** — Manage different automation profiles
- **Schema details** — Name, description, timestamps

#### AI Integration
- **Ollama** — Local LLM inference for intelligent dialog analysis
- **Claude Code CLI** — Anthropic Claude via command line
- **OpenAI-compatible APIs** — LM Studio, vLLM, text-generation-webui
- **Custom REST endpoints** — Any JSON REST API
- **Auto-detect providers** — One-click provider discovery
- **Connection testing** — Validate endpoint connectivity
- **AI Test Lab** — Test AI analysis with sample dialog text
- **Configurable prompt templates** — Customize AI analysis behavior
- **AI confidence threshold** — Adjustable auto-decision confidence

#### UI/UX
- **Premium dark theme** — Deep navy glassmorphism design
- **5-tab interface** — Detection, Actions, Schemas, AI Integration, Settings
- **Help & About Tab** — Diagnostic screen with basic usage flow, screenshot match examples, developer details, support emails, license info, and a copyable PIX key button for Brazil (`51992452539`) with auto-copy support.
- **Custom frameless titlebar** — With minimize/maximize/close controls
- **Real-time activity log** — Resizable panel with timestamped entries
- **Toast notifications** — Non-intrusive status feedback
- **Status indicators** — Live monitoring status with pulse animations
- **Micro-animations** — Slide-in, fade-in, pulse effects
- **Custom scrollbar** — Minimal dark scrollbar styling

#### Settings
- Scan interval configuration
- OCR language selection
- Confidence threshold
- Max click retries
- Notification toggles
- Sound on match
- Start minimized to tray
- Auto-start monitoring
- Verbose logging
- Global hotkeys (Ctrl+Shift+F9 start/stop, Ctrl+Shift+F10 test)

#### Build & Distribution
- **Multi-OS Installer (`install.sh`)** — Shell script installer to automatically setup node packages and compile executable packages for both Linux and Windows.
- **Portable Windows exe** — Single file, no installation needed
- **Windows NSIS installer** — Standard installer with directory selection
- **Linux AppImage** — Portable, runs on most distributions
- **Linux .deb package** — For Debian/Ubuntu
- **System tray** — Minimize to tray with context menu
- **GitHub Actions CI/CD** — Automated builds on `v*` tags

#### Documentation
- `README.md` — Full usage guide, features, installation, AI setup
- `AGENTS.md` — Development rules and architecture guide
- `CHANGELOG.md` — This file
- Example schema: `schemas/example-allow-dialog.fzschema`
- **License Update** — Transitioned code licensing to CC-BY-4.0 (Creative Commons Attribution 4.0 International).

### Technical Details
- **Framework**: Electron 36+ with electron-vite
- **Language**: TypeScript (strict mode)
- **OCR**: Tesseract.js v5 (pure JavaScript, offline-capable)
- **Click Engine**: CLI-based (xdotool/PowerShell) — zero native module dependencies
- **Packaging**: electron-builder with platform-specific targets
- **Security**: contextIsolation enabled, nodeIntegration disabled, IPC whitelist

---

## Power Gains

| Capability | Before | After |
|:-----------|:-------|:------|
| Dialog handling | Manual clicking | Fully automated OCR detection + auto-click |
| Cross-platform | N/A | Linux (AppImage) + Windows (Portable exe) |
| AI analysis | N/A | Multi-provider AI (Ollama/Claude/OpenAI) |
| Configurations | N/A | Saveable/shareable schema system |
| Monitoring | N/A | Continuous background scanning with hotkeys |
