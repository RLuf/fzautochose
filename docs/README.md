# FZautochoice — Documentation

## Table of Contents

- [Quick Start Guide](quick-start.md)
- [Schema Configuration](schema-guide.md)
- [AI Integration Guide](ai-integration.md)

---

## Quick Start Guide

### 1. First Launch

When you open FZautochoice for the first time, you'll see the **Detection** tab. This is where you configure what dialog boxes to look for.

### 2. Configure Detection

**Step 1: Enter Dialog Text**

In the "Dialog Title/Text to Match" field, enter a portion of the dialog text you want to detect. For example:

```
Do you want to allow
```

This will match any dialog that contains this text in its title or body.

**Step 2: Add Options**

Click **+ Add Option** to add buttons that appear in the dialog. For each option:
- Type the button text (e.g., "Allow", "Yes", "No")
- Check the box if you want FZautochoice to **auto-click** that option

**Step 3: Choose Match Mode**

| Mode | Use When |
|:-----|:---------|
| **Contains** | You know part of the dialog text |
| **Exact** | You know the full exact text |
| **Regex** | You need pattern matching (e.g., `Update.*available`) |
| **Fuzzy** | The dialog text may vary slightly (uses AI-like matching) |

### 3. Configure Actions

Switch to the **Actions** tab to configure:

- **Click Targets** — Buttons to click (e.g., "Yes", "Submit", "OK")
- **Click Type** — Single, double, or right click
- **Click Delay** — Wait time after clicking (ms)
- **Keyboard Actions** — Press Enter, Tab, Escape after clicking
- **Post-Click Action** — Resume scanning, wait, stop, or load next schema

### 4. Start Monitoring

Click the green **▶ Start Monitoring** button or press `Ctrl+Shift+F9`.

FZautochoice will:
1. Capture the screen every N seconds
2. Run OCR to detect text
3. Match text against your configured patterns
4. Auto-click the specified targets when a match is found

### 5. Save Your Configuration

Go to the **Schemas** tab and click **💾 Save Current** to save your configuration for later use.

---

## Example Configurations

### Example 1: Windows UAC "Allow Changes" Dialog

```json
{
  "name": "UAC Allow Handler",
  "detection": {
    "text": "Do you want to allow this app to make changes",
    "matchMode": "contains",
    "options": [
      { "text": "Yes", "autoClick": true },
      { "text": "No", "autoClick": false }
    ]
  },
  "actions": {
    "targets": ["Yes"],
    "clickType": "single",
    "clickDelay": 300
  }
}
```

### Example 2: Cookie Consent Banner

```json
{
  "name": "Cookie Consent Clicker",
  "detection": {
    "text": "cookies",
    "matchMode": "fuzzy",
    "options": [
      { "text": "Accept", "autoClick": true },
      { "text": "Accept All", "autoClick": true },
      { "text": "Decline", "autoClick": false },
      { "text": "Customize", "autoClick": false }
    ]
  },
  "actions": {
    "targets": ["Accept", "Accept All", "I Agree"],
    "clickType": "single",
    "clickDelay": 500
  }
}
```

### Example 3: Software Update Dialog

```json
{
  "name": "Auto-Update Acceptor",
  "detection": {
    "text": "update is available",
    "matchMode": "contains",
    "options": [
      { "text": "Update Now", "autoClick": true },
      { "text": "Install", "autoClick": true },
      { "text": "Remind Me Later", "autoClick": false }
    ]
  },
  "actions": {
    "targets": ["Update Now", "Install", "Download"],
    "clickType": "single",
    "clickDelay": 1000,
    "postClickAction": "stop"
  }
}
```

### Example 4: AI-Powered Complex Dialog (with Ollama)

```json
{
  "name": "AI Smart Handler",
  "detection": {
    "text": "",
    "matchMode": "fuzzy"
  },
  "actions": {
    "targets": [],
    "clickDelay": 1000
  },
  "ai": {
    "provider": "ollama",
    "endpoint": "http://localhost:11434/api/generate",
    "model": "llama3.2",
    "autoDecide": true,
    "confidenceThreshold": 85,
    "promptTemplate": "Analyze this dialog: {{detected_text}}. Respond in JSON."
  }
}
```

---

## Hotkeys Reference

| Shortcut | Action |
|:---------|:-------|
| `Ctrl+Shift+F9` | Start/Stop monitoring |
| `Ctrl+Shift+F10` | Run a single test scan |

---

## Troubleshooting

### OCR not detecting text
- Increase scan interval to give more time per scan
- Lower the confidence threshold in Settings
- Try "Full Screen" scan region instead of "Active Window"
- Check OCR language matches the dialog language

### Clicks not working (Linux)
- Install `xdotool`: `sudo apt-get install xdotool`
- Check if your desktop environment supports `xdotool` (X11 required, Wayland has limitations)

### Clicks not working (Windows)
- Run FZautochoice as Administrator for UAC dialogs
- Ensure PowerShell execution policy allows scripts

---

## Author

**Roger Luft** (veilwaker)  
📧 roger@webstorage.com.br | rlufti@gmail.com  
🌐 [about.rogerluft.com.br](https://about.rogerluft.com.br)  
💻 [github.com/RLuf](https://github.com/RLuf)

---

## Support

If FZautochoice helps you, consider supporting the project:

**PIX:** `51992452539`

---

*FZautochoice v1.0.0 — Because dialogs shouldn't slow you down.*
