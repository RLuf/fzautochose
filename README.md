# 🎯 FZautochoice

> **Cross-platform auto-click desktop application** with OCR dialog detection, AI-powered decision making, and schema management.

[![Release](https://img.shields.io/github/v/release/RLuf/fzautochose?style=flat-square)](https://github.com/RLuf/fzautochose/releases)
[![License](https://img.shields.io/github/license/RLuf/fzautochose?style=flat-square)](LICENSE)
[![CI](https://img.shields.io/github/actions/workflow/status/RLuf/fzautochose/ci.yml?style=flat-square&label=CI)](https://github.com/RLuf/fzautochose/actions)

---

## ✨ Features

### 🔍 Dialog Detection
- **OCR-powered screen scanning** — Tesseract.js detects text in dialog boxes
- **Multiple match modes** — Contains, Exact, Regex, and Fuzzy (Levenshtein)
- **Configurable scan regions** — Full screen, active window, or custom region
- **Multi-language OCR** — English, Portuguese, Spanish, French, German

### ⚡ Auto-Click Engine
- **Cross-platform clicking** — Linux (`xdotool`) + Windows (PowerShell)
- **Click types** — Single, double, or right click
- **Keyboard simulation** — Enter, Tab, Escape, Space, Y, N
- **Action sequences** — Multi-step workflows with delays

### 💾 Schema Management
- **Save/Load profiles** — Multiple `.fzschema` configurations
- **Import/Export** — Share schemas between machines
- **Quick-switch** — Swap between automation profiles instantly

### 🤖 AI Integration
- **Ollama** — Local LLM for private, fast dialog analysis
- **Claude Code CLI** — Advanced reasoning via Anthropic
- **OpenAI-compatible** — LM Studio, vLLM, text-generation-webui
- **Custom REST endpoints** — Any JSON REST API
- **Auto-detect** — One-click provider discovery
- **AI Test Lab** — Test analysis before enabling auto-decisions

### 🎨 Premium UI
- **Dark glassmorphism theme** — Deep navy with electric blue accents
- **5-tab interface** — Detection, Actions, Schemas, AI, Settings
- **Real-time activity log** — Live monitoring with confidence scores
- **System tray** — Minimize to tray, background monitoring
- **Global hotkeys** — Ctrl+Shift+F9 (start/stop) + Ctrl+Shift+F10 (test)

---

## 📦 Installation

### Download (Recommended)

Download the latest release from [GitHub Releases](https://github.com/RLuf/fzautochose/releases):

| Platform | File | Type |
|:---------|:-----|:-----|
| **Windows** | `FZautochoice-x.x.x-portable.exe` | Portable (no install) |
| **Windows** | `FZautochoice-x.x.x-setup.exe` | Installer |
| **Linux** | `FZautochoice-x.x.x.AppImage` | Portable (no install) |
| **Linux** | `FZautochoice-x.x.x.deb` | Debian/Ubuntu package |

### Linux AppImage

```bash
chmod +x FZautochoice-*.AppImage
./FZautochoice-*.AppImage
```

### Linux Dependencies

Install `xdotool` for mouse/keyboard automation:

```bash
# Ubuntu/Debian
sudo apt-get install xdotool

# Fedora
sudo dnf install xdotool

# Arch
sudo pacman -S xdotool
```

---

## 🛠️ Build from Source

### Prerequisites

- **Node.js** 20+
- **npm** 10+
- **Linux**: `xdotool`, `libx11-dev`, `libxext-dev`, `libxtst-dev`
- **Windows**: PowerShell (built-in)

### Quick Start

```bash
# Clone
git clone https://github.com/RLuf/fzautochose.git
cd fzautochose

# Install dependencies
npm install

# Run in development mode (with HMR)
npm run dev

# Build for current platform
npm run build:linux   # AppImage + deb
npm run build:win     # Portable exe + NSIS installer
npm run build:all     # Both platforms
```

### Release Build

To trigger an automated release build with signed artifacts:

```bash
# Bump version in package.json
# Update CHANGELOG.md

# Commit and tag
git add .
git commit -m "release: v1.0.0"
git tag v1.0.0
git push origin main --tags
```

GitHub Actions will automatically:
1. Build Linux (AppImage + deb) and Windows (portable + installer)
2. Create a GitHub Release with all artifacts

---

## 🚀 Usage Guide

### Basic Setup

1. **Launch FZautochoice**
2. In the **Detection** tab:
   - Enter the dialog title or question text to match
   - Add detection options (Allow, Yes, No, etc.)
   - Check the boxes for options to auto-click
3. In the **Actions** tab:
   - Configure click targets (Yes, Submit, OK)
   - Set click delay and keyboard actions
4. Click **▶ Start Monitoring** or press `Ctrl+Shift+F9`

### Schema Example

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
      { "text": "Yes", "autoClick": true },
      { "text": "No", "autoClick": false }
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

---

## 🤖 AI Integration Setup

### Ollama (Local — Recommended)

```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Pull a model
ollama pull llama3.2

# Ollama runs at http://localhost:11434 by default
```

In FZautochoice:
1. Go to **AI Integration** tab
2. Click **🔍 Auto-Detect**
3. Select **Ollama**
4. Choose a model from the dropdown
5. Click **🧪 Test Connection**

### Claude Code CLI

```bash
# Install Claude Code
npm install -g @anthropic-ai/claude-code

# Verify
claude --version
```

### OpenAI-Compatible (LM Studio, vLLM)

1. Start your local inference server
2. Go to **AI Integration** tab
3. Select **OpenAI-Compatible API**
4. Enter endpoint (e.g., `http://localhost:1234/v1/chat/completions`)
5. Add API key if required

### AI-Powered Workflows

With AI enabled, FZautochoice can:
- **Analyze unknown dialogs** — AI determines the best button to click
- **Complex decision making** — Handle multi-step dialogs with context
- **Confidence scoring** — Only auto-click when AI confidence exceeds threshold
- **Custom prompts** — Tailor the analysis prompt for your use case

---

## ⚙️ Configuration

### Settings

| Setting | Default | Description |
|:--------|:--------|:------------|
| Scan Interval | 2000ms | How often to scan the screen |
| OCR Language | English | Language for text recognition |
| Confidence Threshold | 70% | Minimum OCR confidence to match |
| Max Click Retries | 3 | Retry clicks on failure |
| Notify on Click | ✅ | Show notification after clicking |
| Sound on Match | ❌ | Play sound when dialog detected |
| Start Minimized | ❌ | Launch to system tray |
| Auto-Start Monitor | ❌ | Start monitoring on launch |
| Verbose Logging | ❌ | Log all OCR results |

### Global Hotkeys

| Shortcut | Action |
|:---------|:-------|
| `Ctrl+Shift+F9` | Toggle monitoring start/stop |
| `Ctrl+Shift+F10` | Run a quick test scan |

---

## 📁 Project Structure

```
fzautochose/
├── .github/workflows/     # CI/CD workflows
│   ├── ci.yml             # PR/push checks
│   └── release.yml        # Release build on v* tags
├── src/
│   ├── main/              # Electron main process
│   │   ├── index.ts       # App entry, window, tray
│   │   ├── ipc-handlers.ts
│   │   └── services/
│   │       ├── screen-capture.ts
│   │       ├── ocr-engine.ts
│   │       ├── dialog-matcher.ts
│   │       ├── click-engine.ts
│   │       ├── schema-manager.ts
│   │       └── ai-integration.ts
│   ├── preload/           # Context bridge
│   │   ├── index.ts
│   │   └── types.d.ts
│   └── renderer/          # UI
│       ├── index.html
│       ├── index.css
│       └── main.ts
├── schemas/               # Example schemas
├── AGENTS.md              # Development rules
├── CHANGELOG.md           # Version history
├── README.md              # This file
├── package.json
├── electron-builder.yml
└── electron.vite.config.ts
```

---

## 🔧 Technology Stack

| Component | Technology | Why |
|:----------|:-----------|:----|
| Desktop | Electron 36+ | Cross-platform, native APIs |
| Bundler | electron-vite | Fast HMR, TypeScript support |
| Language | TypeScript | Type safety, maintainability |
| OCR | Tesseract.js v5 | Pure JS, offline, no native deps |
| Clicking | xdotool / PowerShell | Zero native deps, fully portable |
| Packaging | electron-builder | Portable exe + AppImage |
| AI | Ollama / Claude / OpenAI | Multi-provider flexibility |
| CI/CD | GitHub Actions | Automated cross-platform builds |

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 👤 Author

**RLuf** — [GitHub](https://github.com/RLuf)

---

> Built with ⚡ by FZautochoice — Because dialogs shouldn't slow you down.