/**
 * FZautochoice — AI Integration Service
 * Connects to Ollama, Claude Code CLI, and OpenAI-compatible endpoints
 * for intelligent dialog analysis and decision making
 */
import { exec } from 'child_process'
import { promisify } from 'util'
import * as http from 'http'
import * as https from 'https'
import * as url from 'url'

const execAsync = promisify(exec)

/** AI analysis result */
export interface AIAnalysisResult {
  /** Recommended action */
  action: string
  /** Target button to click */
  target: string
  /** Confidence score 0-1 */
  confidence: number
  /** Explanation */
  reason: string
  /** Raw AI response */
  raw?: string
}

/** Provider detection results */
export interface ProviderStatus {
  ollama: boolean
  claude: boolean
  'openai-compat': boolean
  custom: boolean
}

/**
 * AI integration service supporting multiple providers.
 * Provides intelligent dialog analysis for complex automation decisions.
 */
export class AIIntegration {
  private activeProvider: string = ''
  private endpoint: string = ''
  private model: string = ''
  private apiKey: string = ''
  private cliPath: string = 'claude'
  private promptTemplate: string = ''

  /**
   * Configures the AI provider
   */
  configure(config: {
    provider?: string
    endpoint?: string
    model?: string
    apiKey?: string
    cliPath?: string
    promptTemplate?: string
  }): void {
    if (config.provider) this.activeProvider = config.provider
    if (config.endpoint) this.endpoint = config.endpoint
    if (config.model) this.model = config.model
    if (config.apiKey) this.apiKey = config.apiKey
    if (config.cliPath) this.cliPath = config.cliPath
    if (config.promptTemplate) this.promptTemplate = config.promptTemplate
  }

  /**
   * Auto-detects available AI providers on the system
   */
  async detectProviders(): Promise<ProviderStatus> {
    const results: ProviderStatus = {
      ollama: false,
      claude: false,
      'openai-compat': false,
      custom: false,
    }

    // Check Ollama
    try {
      const response = await this.httpGet('http://localhost:11434/api/tags')
      results.ollama = response.statusCode === 200
    } catch {
      results.ollama = false
    }

    // Check Claude Code CLI
    try {
      await execAsync('claude --version')
      results.claude = true
    } catch {
      try {
        await execAsync('claude-code --version')
        results.claude = true
        this.cliPath = 'claude-code'
      } catch {
        results.claude = false
      }
    }

    // Check common OpenAI-compatible endpoints
    try {
      const response = await this.httpGet('http://localhost:1234/v1/models')
      results['openai-compat'] = response.statusCode === 200
    } catch {
      results['openai-compat'] = false
    }

    return results
  }

  /**
   * Tests connection to a specific endpoint
   */
  async testConnection(endpoint: string): Promise<{ success: boolean; model?: string; error?: string }> {
    try {
      // Determine provider type from endpoint
      if (endpoint.includes('11434')) {
        // Ollama
        const response = await this.httpGet(`${endpoint.replace(/\/api\/generate$/, '')}/api/tags`)
        if (response.statusCode === 200) {
          const data = JSON.parse(response.body)
          const models = data.models?.map((m: { name: string }) => m.name) || []
          return {
            success: true,
            model: models.length > 0 ? models[0] : 'No models found',
          }
        }
      } else if (endpoint.includes('/v1/')) {
        // OpenAI-compatible
        const modelsUrl = endpoint.replace(/\/chat\/completions$/, '/models')
        const response = await this.httpGet(modelsUrl)
        if (response.statusCode === 200) {
          const data = JSON.parse(response.body)
          const model = data.data?.[0]?.id || 'Unknown'
          return { success: true, model }
        }
      } else {
        // Generic health check
        const response = await this.httpGet(endpoint)
        return {
          success: response.statusCode === 200,
          model: 'Custom endpoint',
        }
      }

      return { success: false, error: 'Unexpected response' }
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      }
    }
  }

  /**
   * Analyzes dialog text using the configured AI provider
   */
  async analyze(dialogText: string): Promise<AIAnalysisResult> {
    const prompt = this.buildPrompt(dialogText)

    try {
      switch (this.activeProvider) {
        case 'ollama':
          return await this.analyzeWithOllama(prompt)
        case 'claude':
          return await this.analyzeWithClaude(prompt)
        case 'openai-compat':
          return await this.analyzeWithOpenAI(prompt)
        default:
          return await this.analyzeWithOllama(prompt) // Default to Ollama
      }
    } catch (error) {
      return {
        action: 'error',
        target: '',
        confidence: 0,
        reason: `AI analysis failed: ${(error as Error).message}`,
      }
    }
  }

  // ── Provider-specific implementations ──

  /**
   * Sends analysis request to Ollama
   */
  private async analyzeWithOllama(prompt: string): Promise<AIAnalysisResult> {
    const endpoint = this.endpoint || 'http://localhost:11434/api/generate'
    const model = this.model || 'llama3.2'

    const body = JSON.stringify({
      model,
      prompt,
      stream: false,
      format: 'json',
    })

    const response = await this.httpPost(endpoint, body)
    const data = JSON.parse(response.body)

    try {
      const parsed = JSON.parse(data.response)
      return {
        action: parsed.action || 'click',
        target: parsed.target || '',
        confidence: parsed.confidence || 0.5,
        reason: parsed.reason || 'No reason provided',
        raw: data.response,
      }
    } catch {
      return {
        action: 'unknown',
        target: '',
        confidence: 0.3,
        reason: data.response || 'Failed to parse AI response',
        raw: data.response,
      }
    }
  }

  /**
   * Sends analysis request via Claude Code CLI
   */
  private async analyzeWithClaude(prompt: string): Promise<AIAnalysisResult> {
    const cliPath = this.cliPath || 'claude'

    // Escape the prompt for shell
    const escapedPrompt = prompt.replace(/'/g, "'\\''")

    const { stdout } = await execAsync(
      `echo '${escapedPrompt}' | ${cliPath} --print --output-format json 2>/dev/null`,
      { timeout: 30000 }
    )

    try {
      const parsed = JSON.parse(stdout)
      return {
        action: parsed.action || 'click',
        target: parsed.target || '',
        confidence: parsed.confidence || 0.8,
        reason: parsed.reason || 'Claude analysis complete',
        raw: stdout,
      }
    } catch {
      // Claude returned plain text
      return {
        action: 'unknown',
        target: '',
        confidence: 0.5,
        reason: stdout.substring(0, 500),
        raw: stdout,
      }
    }
  }

  /**
   * Sends analysis request to OpenAI-compatible API
   */
  private async analyzeWithOpenAI(prompt: string): Promise<AIAnalysisResult> {
    const endpoint = this.endpoint || 'http://localhost:1234/v1/chat/completions'
    const model = this.model || 'default'

    const body = JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: 'You are a dialog analysis assistant. Always respond in valid JSON.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 500,
    })

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`
    }

    const response = await this.httpPost(endpoint, body, headers)
    const data = JSON.parse(response.body)

    const content = data.choices?.[0]?.message?.content || ''

    try {
      const parsed = JSON.parse(content)
      return {
        action: parsed.action || 'click',
        target: parsed.target || '',
        confidence: parsed.confidence || 0.7,
        reason: parsed.reason || 'OpenAI analysis complete',
        raw: content,
      }
    } catch {
      return {
        action: 'unknown',
        target: '',
        confidence: 0.4,
        reason: content.substring(0, 500),
        raw: content,
      }
    }
  }

  // ── Prompt Building ──

  private buildPrompt(dialogText: string): string {
    if (this.promptTemplate) {
      return this.promptTemplate
        .replace('{{detected_text}}', dialogText)
        .replace('{{match_pattern}}', '')
        .replace('{{available_buttons}}', '')
    }

    return `You are analyzing a dialog box detected on screen via OCR.
The dialog contains the following text:
---
${dialogText}
---

Analyze this dialog and determine the appropriate action.
Respond ONLY in valid JSON with this exact format:
{
  "action": "click",
  "target": "button_name_to_click",
  "confidence": 0.95,
  "reason": "Brief explanation of your decision"
}`
  }

  // ── HTTP Helpers ──

  private httpGet(targetUrl: string): Promise<{ statusCode: number; body: string }> {
    return new Promise((resolve, reject) => {
      const parsed = new url.URL(targetUrl)
      const client = parsed.protocol === 'https:' ? https : http

      const req = client.get(targetUrl, { timeout: 5000 }, (res) => {
        let body = ''
        res.on('data', (chunk) => (body += chunk))
        res.on('end', () => resolve({ statusCode: res.statusCode || 0, body }))
      })

      req.on('error', reject)
      req.on('timeout', () => {
        req.destroy()
        reject(new Error('Connection timed out'))
      })
    })
  }

  private httpPost(
    targetUrl: string,
    body: string,
    headers: Record<string, string> = {}
  ): Promise<{ statusCode: number; body: string }> {
    return new Promise((resolve, reject) => {
      const parsed = new url.URL(targetUrl)
      const client = parsed.protocol === 'https:' ? https : http

      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
          ...headers,
        },
        timeout: 30000,
      }

      const req = client.request(targetUrl, options, (res) => {
        let responseBody = ''
        res.on('data', (chunk) => (responseBody += chunk))
        res.on('end', () => resolve({ statusCode: res.statusCode || 0, body: responseBody }))
      })

      req.on('error', reject)
      req.on('timeout', () => {
        req.destroy()
        reject(new Error('Request timed out'))
      })

      req.write(body)
      req.end()
    })
  }
}
