/**
 * FZautochoice — Renderer Main Entry
 * Handles tab navigation, UI event binding, and IPC communication
 */

// ── State ──
interface AppState {
  isMonitoring: boolean;
  scanCount: number;
  matchCount: number;
  clickCount: number;
  logEntries: number;
  activeTab: string;
  options: Array<{ text: string; autoClick: boolean }>;
  targets: string[];
}

const state: AppState = {
  isMonitoring: false,
  scanCount: 0,
  matchCount: 0,
  clickCount: 0,
  logEntries: 0,
  activeTab: 'detection',
  options: [
    { text: 'Allow', autoClick: true },
    { text: 'Yes', autoClick: true },
    { text: 'No', autoClick: false },
  ],
  targets: ['Yes', 'Submit', 'OK', 'Allow'],
};

// ── DOM Ready ──
document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initTitlebar();
  initDetectionTab();
  initActionsTab();
  initSchemasTab();
  initAITab();
  initSettingsTab();
  initLogPanel();
  initGlobalControls();
  initHelpTab();

  addLog('info', 'FZautochoice v1.0.0 initialized successfully.');

  // Listen for IPC events from main process
  if (window.fzApi) {
    window.fzApi.onScanResult((result: { text: string; confidence: number }) => {
      state.scanCount++;
      updateStats();
      if (result.text) {
        addLog('info', `Scan #${state.scanCount}: Detected text (${Math.round(result.confidence * 100)}% confidence)`);
      }
    });

    window.fzApi.onMatchFound((match: { pattern: string; confidence: number }) => {
      state.matchCount++;
      updateStats();
      addLog('warning', `Match found: "${match.pattern}" (${Math.round(match.confidence * 100)}%)`);
    });

    window.fzApi.onClickExecuted((click: { target: string; success: boolean }) => {
      if (click.success) {
        state.clickCount++;
        updateStats();
        addLog('success', `Clicked "${click.target}" successfully`);
      } else {
        addLog('error', `Failed to click "${click.target}"`);
      }
    });

    // Detect platform
    window.fzApi.getPlatform().then((platform: string) => {
      const el = document.getElementById('platform-info') as HTMLInputElement;
      if (el) el.value = platform;
    });
  }
});

// ── Tab Navigation ──
function initTabs(): void {
  const tabs = document.querySelectorAll<HTMLButtonElement>('.tab-bar__tab');
  const contents = document.querySelectorAll<HTMLElement>('.tab-content');

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const targetTab = tab.dataset.tab;
      if (!targetTab) return;

      // Update active tab button
      tabs.forEach((t) => t.classList.remove('tab-bar__tab--active'));
      tab.classList.add('tab-bar__tab--active');

      // Update active content
      contents.forEach((c) => c.classList.remove('tab-content--active'));
      const content = document.getElementById(`content-${targetTab}`);
      if (content) content.classList.add('tab-content--active');

      state.activeTab = targetTab;
    });
  });
}

// ── Titlebar Controls ──
function initTitlebar(): void {
  document.getElementById('btn-minimize')?.addEventListener('click', () => {
    window.fzApi?.minimizeWindow();
  });
  document.getElementById('btn-maximize')?.addEventListener('click', () => {
    window.fzApi?.maximizeWindow();
  });
  document.getElementById('btn-close')?.addEventListener('click', () => {
    window.fzApi?.closeWindow();
  });
}

// ── Detection Tab ──
function initDetectionTab(): void {
  // Add option
  const btnAddOption = document.getElementById('btn-add-option-confirm');
  const inputNewOption = document.getElementById('new-option-text') as HTMLInputElement;

  btnAddOption?.addEventListener('click', () => {
    const text = inputNewOption?.value.trim();
    if (text) {
      addOption(text, false);
      inputNewOption.value = '';
    }
  });

  inputNewOption?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') btnAddOption?.click();
  });

  // Also bind header button
  document.getElementById('btn-add-option')?.addEventListener('click', () => {
    inputNewOption?.focus();
  });

  // Existing option checkboxes
  document.querySelectorAll<HTMLElement>('.option-item').forEach((item) => {
    bindOptionItem(item);
  });

  // Test scan
  document.getElementById('btn-test')?.addEventListener('click', async () => {
    addLog('info', 'Running test scan...');
    if (window.fzApi) {
      try {
        const result = await window.fzApi.testScan();
        addLog('info', `Test scan complete. Found ${result.matchCount} matches.`);
        if (result.detectedText) {
          addLog('info', `Detected text: "${result.detectedText.substring(0, 100)}..."`);
        }
      } catch {
        addLog('error', 'Test scan failed. Make sure OCR engine is ready.');
      }
    } else {
      // Demo mode
      addLog('warning', 'Running in demo mode (no Electron API). Simulating scan...');
      setTimeout(() => {
        state.scanCount++;
        updateStats();
        addLog('success', 'Demo: Simulated dialog detected — "Do you want to allow changes?"');
      }, 1500);
    }
  });

  // Region selection
  document.getElementById('btn-capture-region')?.addEventListener('click', () => {
    addLog('info', 'Region selection not yet available. Using full screen scan.');
  });
}

function addOption(text: string, autoClick: boolean): void {
  state.options.push({ text, autoClick });

  const list = document.getElementById('option-list');
  if (!list) return;

  const item = document.createElement('div');
  item.className = 'option-item';
  item.dataset.option = text;
  item.innerHTML = `
    <input type="checkbox" ${autoClick ? 'checked' : ''} />
    <span class="option-item__text">${escapeHtml(text)}</span>
    <span class="option-item__badge ${autoClick ? 'option-item__badge--click' : 'option-item__badge--skip'}">${autoClick ? 'Auto-Click' : 'Skip'}</span>
    <button class="btn btn--ghost btn--icon-sm option-item__delete" title="Remove">✕</button>
  `;

  bindOptionItem(item);
  list.appendChild(item);
  addLog('info', `Added detection option: "${text}"`);
}

function bindOptionItem(item: HTMLElement): void {
  const checkbox = item.querySelector('input[type="checkbox"]') as HTMLInputElement;
  const badge = item.querySelector('.option-item__badge') as HTMLElement;
  const deleteBtn = item.querySelector('.option-item__delete');

  checkbox?.addEventListener('change', () => {
    if (checkbox.checked) {
      badge.className = 'option-item__badge option-item__badge--click';
      badge.textContent = 'Auto-Click';
    } else {
      badge.className = 'option-item__badge option-item__badge--skip';
      badge.textContent = 'Skip';
    }
    // Update state
    const optText = item.dataset.option;
    const opt = state.options.find((o) => o.text === optText);
    if (opt) opt.autoClick = checkbox.checked;
  });

  deleteBtn?.addEventListener('click', () => {
    const optText = item.dataset.option;
    state.options = state.options.filter((o) => o.text !== optText);
    item.remove();
    addLog('info', `Removed detection option: "${optText}"`);
  });
}

// ── Actions Tab ──
function initActionsTab(): void {
  // Remove target
  document.querySelectorAll('.action-target__remove').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const target = (e.target as HTMLElement).closest('.action-target') as HTMLElement;
      const text = target?.dataset.target;
      if (text) {
        state.targets = state.targets.filter((t) => t !== text);
        target.remove();
        addLog('info', `Removed click target: "${text}"`);
      }
    });
  });

  // Add target
  const btnAddTarget = document.getElementById('btn-add-target');
  const inputNewTarget = document.getElementById('new-target-text') as HTMLInputElement;

  btnAddTarget?.addEventListener('click', () => {
    const text = inputNewTarget?.value.trim();
    if (text && !state.targets.includes(text)) {
      addTarget(text);
      inputNewTarget.value = '';
    }
  });

  inputNewTarget?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') btnAddTarget?.click();
  });

  // Add step button
  document.getElementById('btn-add-step')?.addEventListener('click', () => {
    addLog('info', 'Custom workflow steps — use AI Integration tab for complex workflows.');
  });
}

function addTarget(text: string): void {
  state.targets.push(text);

  const container = document.getElementById('action-targets');
  if (!container) return;

  const el = document.createElement('div');
  el.className = 'action-target';
  el.dataset.target = text;
  el.innerHTML = `
    <span class="action-target__text">${escapeHtml(text)}</span>
    <span class="action-target__remove" title="Remove">✕</span>
  `;

  el.querySelector('.action-target__remove')?.addEventListener('click', () => {
    state.targets = state.targets.filter((t) => t !== text);
    el.remove();
    addLog('info', `Removed click target: "${text}"`);
  });

  container.appendChild(el);
  addLog('info', `Added click target: "${text}"`);
}

// ── Schemas Tab ──
function initSchemasTab(): void {
  // Save schema
  document.getElementById('btn-save-schema')?.addEventListener('click', async () => {
    const schema = buildCurrentSchema();
    if (window.fzApi) {
      try {
        await window.fzApi.saveSchema(schema);
        addLog('success', `Schema "${schema.name}" saved successfully.`);
        showToast('Schema saved!', 'success');
      } catch {
        addLog('error', 'Failed to save schema.');
      }
    } else {
      addLog('success', `Demo: Schema "${schema.name}" saved.`);
      showToast('Schema saved!', 'success');
    }
  });

  // Import/Export
  document.getElementById('btn-import-schema')?.addEventListener('click', () => {
    if (window.fzApi) {
      window.fzApi.importSchema();
    } else {
      addLog('info', 'Demo: Import schema dialog would open.');
    }
  });

  document.getElementById('btn-export-schema')?.addEventListener('click', () => {
    if (window.fzApi) {
      window.fzApi.exportSchema();
    } else {
      addLog('info', 'Demo: Export schema dialog would open.');
    }
  });

  // Schema item clicks
  document.querySelectorAll<HTMLElement>('.schema-item').forEach((item) => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.schema-item').forEach((i) => i.classList.remove('schema-item--active'));
      item.classList.add('schema-item--active');

      // Remove active tag from others, add to this one
      document.querySelectorAll('.schema-item .tag').forEach((t) => t.remove());
      const tag = document.createElement('span');
      tag.className = 'tag tag--primary';
      tag.textContent = 'Active';
      item.querySelector('.schema-item__info')?.after(tag);
    });
  });
}

function buildCurrentSchema(): { name: string; description: string; detection: unknown; actions: unknown } {
  return {
    name: (document.getElementById('schema-name') as HTMLInputElement)?.value || 'Untitled Schema',
    description: (document.getElementById('schema-description') as HTMLTextAreaElement)?.value || '',
    detection: {
      text: (document.getElementById('detection-text') as HTMLInputElement)?.value || '',
      content: (document.getElementById('detection-content') as HTMLTextAreaElement)?.value || '',
      matchMode: (document.getElementById('match-mode') as HTMLSelectElement)?.value || 'contains',
      scanRegion: (document.getElementById('scan-region') as HTMLSelectElement)?.value || 'fullscreen',
      options: state.options,
    },
    actions: {
      targets: state.targets,
      clickType: (document.getElementById('click-type') as HTMLSelectElement)?.value || 'single',
      clickDelay: parseInt((document.getElementById('click-delay') as HTMLInputElement)?.value || '500'),
      keyboardKey: (document.getElementById('keyboard-key') as HTMLSelectElement)?.value || '',
      postClickAction: (document.getElementById('post-click-action') as HTMLSelectElement)?.value || 'resume',
    },
  };
}

// ── AI Integration Tab ──
function initAITab(): void {
  // Provider selection
  document.querySelectorAll<HTMLElement>('.ai-provider-card').forEach((card) => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.ai-provider-card').forEach((c) => c.classList.remove('ai-provider-card--selected'));
      card.classList.add('ai-provider-card--selected');

      const provider = card.dataset.provider;
      const endpointInput = document.getElementById('ai-endpoint') as HTMLInputElement;

      // Set defaults based on provider
      switch (provider) {
        case 'ollama':
          endpointInput.value = 'http://localhost:11434/api/generate';
          break;
        case 'claude':
          endpointInput.value = '';
          break;
        case 'openai-compat':
          endpointInput.value = 'http://localhost:1234/v1/chat/completions';
          break;
        case 'custom':
          endpointInput.value = '';
          break;
      }
    });
  });

  // Auto-detect AI providers
  document.getElementById('btn-detect-ai')?.addEventListener('click', async () => {
    addLog('info', 'Auto-detecting AI providers...');

    if (window.fzApi) {
      const results = await window.fzApi.detectAIProviders();
      for (const [provider, available] of Object.entries(results)) {
        updateProviderStatus(provider, available as boolean);
      }
    } else {
      // Demo mode
      setTimeout(() => {
        updateProviderStatus('ollama', false);
        updateProviderStatus('claude', false);
        addLog('warning', 'Demo mode: No AI providers detected. Install Ollama or Claude Code CLI.');
      }, 1000);
    }
  });

  // Test connection
  document.getElementById('btn-test-ai')?.addEventListener('click', async () => {
    const endpoint = (document.getElementById('ai-endpoint') as HTMLInputElement)?.value;
    if (!endpoint) {
      addLog('warning', 'Please enter an endpoint URL first.');
      return;
    }
    addLog('info', `Testing connection to ${endpoint}...`);

    if (window.fzApi) {
      try {
        const result = await window.fzApi.testAIConnection(endpoint);
        if (result.success) {
          addLog('success', `Connected to AI endpoint! Model: ${result.model}`);
          showToast('AI connection successful!', 'success');
        } else {
          addLog('error', `Failed to connect: ${result.error}`);
        }
      } catch {
        addLog('error', 'Connection test failed.');
      }
    } else {
      setTimeout(() => {
        addLog('warning', `Demo: Would test connection to ${endpoint}`);
      }, 500);
    }
  });

  // AI analyze test
  document.getElementById('btn-ai-analyze')?.addEventListener('click', async () => {
    const input = (document.getElementById('ai-test-input') as HTMLTextAreaElement)?.value;
    const output = document.getElementById('ai-test-output') as HTMLElement;

    if (!input) return;
    addLog('info', 'Sending text to AI for analysis...');
    output.textContent = 'Analyzing...';

    if (window.fzApi) {
      try {
        const result = await window.fzApi.analyzeWithAI(input);
        output.textContent = JSON.stringify(result, null, 2);
        addLog('success', 'AI analysis complete.');
      } catch {
        output.textContent = 'Error: Failed to analyze.';
        addLog('error', 'AI analysis failed.');
      }
    } else {
      // Demo response
      setTimeout(() => {
        const demo = {
          action: 'click',
          target: 'Yes',
          confidence: 0.94,
          reason: 'The dialog is asking for permission. Based on the user\'s auto-click configuration, "Yes" is the appropriate response to allow the application.',
        };
        output.textContent = JSON.stringify(demo, null, 2);
        addLog('success', 'Demo: AI analysis complete.');
      }, 1500);
    }
  });

  // Confidence slider
  const slider = document.getElementById('ai-confidence-threshold') as HTMLInputElement;
  const valueLabel = document.getElementById('ai-confidence-value');
  slider?.addEventListener('input', () => {
    if (valueLabel) valueLabel.textContent = `${slider.value}%`;
  });
}

function updateProviderStatus(provider: string, available: boolean): void {
  const statusEl = document.getElementById(`${provider}-status`);
  if (!statusEl) return;

  if (available) {
    statusEl.className = 'ai-provider-card__status ai-provider-card__status--connected';
    statusEl.textContent = 'Connected';
    addLog('success', `AI provider "${provider}" detected and available.`);
  } else {
    statusEl.className = 'ai-provider-card__status ai-provider-card__status--disconnected';
    statusEl.textContent = 'Not found';
  }
}

// ── Settings Tab ──
function initSettingsTab(): void {
  // Settings auto-save on change
  const settingsInputs = document.querySelectorAll('#content-settings input, #content-settings select');
  settingsInputs.forEach((input) => {
    input.addEventListener('change', () => {
      if (window.fzApi) {
        const settings = gatherSettings();
        window.fzApi.saveSettings(settings);
      }
    });
  });
}

function gatherSettings(): Record<string, unknown> {
  return {
    scanInterval: parseInt((document.getElementById('scan-interval') as HTMLInputElement)?.value || '2000'),
    ocrLanguage: (document.getElementById('ocr-language') as HTMLSelectElement)?.value || 'eng',
    confidenceThreshold: parseInt((document.getElementById('confidence-threshold') as HTMLInputElement)?.value || '70'),
    maxRetries: parseInt((document.getElementById('max-retries') as HTMLInputElement)?.value || '3'),
    notifyOnClick: (document.getElementById('notify-on-click') as HTMLInputElement)?.checked ?? true,
    soundOnMatch: (document.getElementById('sound-on-match') as HTMLInputElement)?.checked ?? false,
    startMinimized: (document.getElementById('start-minimized') as HTMLInputElement)?.checked ?? false,
    autoStartMonitor: (document.getElementById('auto-start-monitor') as HTMLInputElement)?.checked ?? false,
    verboseLogging: (document.getElementById('verbose-logging') as HTMLInputElement)?.checked ?? false,
  };
}

// ── Global Start/Stop ──
function initGlobalControls(): void {
  const btnStart = document.getElementById('btn-start');
  const btnStop = document.getElementById('btn-stop');
  const btnStartGlobal = document.getElementById('btn-start-global');
  const btnStopGlobal = document.getElementById('btn-stop-global');

  const startMonitoring = async () => {
    state.isMonitoring = true;
    updateMonitoringUI();

    if (window.fzApi) {
      const schema = buildCurrentSchema();
      await window.fzApi.startMonitoring(schema);
    }

    addLog('success', 'Monitoring started.');
    showToast('Monitoring started', 'success');
  };

  const stopMonitoring = async () => {
    state.isMonitoring = false;
    updateMonitoringUI();

    if (window.fzApi) {
      await window.fzApi.stopMonitoring();
    }

    addLog('warning', 'Monitoring stopped.');
    showToast('Monitoring stopped', 'info');
  };

  btnStart?.addEventListener('click', startMonitoring);
  btnStartGlobal?.addEventListener('click', startMonitoring);
  btnStop?.addEventListener('click', stopMonitoring);
  btnStopGlobal?.addEventListener('click', stopMonitoring);
}

function updateMonitoringUI(): void {
  const btnStart = document.getElementById('btn-start');
  const btnStop = document.getElementById('btn-stop');
  const btnStartGlobal = document.getElementById('btn-start-global');
  const btnStopGlobal = document.getElementById('btn-stop-global');
  const statusBar = document.getElementById('status-bar');
  const statusText = document.getElementById('status-text');
  const titleDot = document.getElementById('titlebar-status-dot');
  const titleText = document.getElementById('titlebar-status-text');

  if (state.isMonitoring) {
    btnStart && (btnStart.style.display = 'none');
    btnStop && (btnStop.style.display = 'inline-flex');
    btnStartGlobal && (btnStartGlobal.style.display = 'none');
    btnStopGlobal && (btnStopGlobal.style.display = 'inline-flex');
    statusBar?.classList.add('status-bar--active');
    statusText && (statusText.textContent = 'Monitoring Active');
    titleDot?.classList.add('titlebar__status-dot--active');
    titleText && (titleText.textContent = 'Monitoring');
  } else {
    btnStart && (btnStart.style.display = 'inline-flex');
    btnStop && (btnStop.style.display = 'none');
    btnStartGlobal && (btnStartGlobal.style.display = 'inline-flex');
    btnStopGlobal && (btnStopGlobal.style.display = 'none');
    statusBar?.classList.remove('status-bar--active');
    statusText && (statusText.textContent = 'Monitoring Idle');
    titleDot?.classList.remove('titlebar__status-dot--active');
    titleText && (titleText.textContent = 'Idle');
  }
}

function updateStats(): void {
  const scans = document.getElementById('stat-scans');
  const matches = document.getElementById('stat-matches');
  const clicks = document.getElementById('stat-clicks');

  if (scans) scans.textContent = state.scanCount.toString();
  if (matches) matches.textContent = state.matchCount.toString();
  if (clicks) clicks.textContent = state.clickCount.toString();
}

// ── Log Panel ──
function initLogPanel(): void {
  document.getElementById('btn-clear-log')?.addEventListener('click', () => {
    const body = document.getElementById('log-body');
    if (body) body.innerHTML = '';
    state.logEntries = 0;
    updateLogCount();
    addLog('info', 'Log cleared.');
  });

  document.getElementById('btn-export-log')?.addEventListener('click', () => {
    addLog('info', 'Log export — use File > Export Log in a future version.');
  });

  // Resize handle
  const handle = document.getElementById('log-resize');
  const panel = document.getElementById('log-panel');
  let startY = 0;
  let startHeight = 0;

  handle?.addEventListener('mousedown', (e) => {
    startY = e.clientY;
    startHeight = panel?.offsetHeight || 180;

    const onMouseMove = (ev: MouseEvent) => {
      const delta = startY - ev.clientY;
      const newHeight = Math.max(80, Math.min(500, startHeight + delta));
      if (panel) panel.style.height = `${newHeight}px`;
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  });
}

function addLog(type: 'info' | 'success' | 'warning' | 'error', message: string): void {
  const body = document.getElementById('log-body');
  if (!body) return;

  const now = new Date();
  const time = now.toLocaleTimeString('en-US', { hour12: false });

  const icons: Record<string, string> = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌',
  };

  const entry = document.createElement('div');
  entry.className = `log-entry log-entry--${type}`;
  entry.innerHTML = `
    <span class="log-entry__time">${time}</span>
    <span class="log-entry__icon">${icons[type]}</span>
    <span class="log-entry__text">${escapeHtml(message)}</span>
  `;

  body.appendChild(entry);
  body.scrollTop = body.scrollHeight;

  state.logEntries++;
  updateLogCount();
}

function updateLogCount(): void {
  const badge = document.getElementById('log-count');
  if (badge) badge.textContent = state.logEntries.toString();
}

// ── Toast Notifications ──
function showToast(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(12px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ── Utilities ──
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ── Help Tab ──
function initHelpTab(): void {
  const btnCopyPix = document.getElementById('btn-copy-pix');
  const pixKeyInput = document.getElementById('pix-key') as HTMLInputElement;
  const statusEl = document.getElementById('pix-copy-status');

  btnCopyPix?.addEventListener('click', () => {
    if (pixKeyInput) {
      pixKeyInput.select();
      pixKeyInput.setSelectionRange(0, 99999);
      
      navigator.clipboard.writeText(pixKeyInput.value).then(() => {
        if (statusEl) {
          statusEl.textContent = '✓ Pix key copied successfully!';
          setTimeout(() => {
            statusEl.textContent = '';
          }, 3000);
        }
        showToast('Pix key copied to clipboard!', 'success');
        addLog('success', 'Pix key copied: 51992452539');
      }).catch(() => {
        if (statusEl) {
          statusEl.textContent = '❌ Failed to copy Pix key.';
          setTimeout(() => {
            statusEl.textContent = '';
          }, 3000);
        }
        showToast('Failed to copy Pix key', 'error');
      });
    }
  });
}
