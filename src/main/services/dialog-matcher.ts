/**
 * FZautochoice — Dialog Matcher
 * Pattern matching engine for detecting dialog text in OCR results
 */
import type { OcrResult } from './ocr-engine'

/** Match configuration */
export interface MatchConfig {
  /** Primary text to match (dialog title/question) */
  text: string
  /** Additional content text to match */
  content: string
  /** Match mode: 'contains', 'exact', 'regex', 'fuzzy' */
  mode: string
  /** Options to detect */
  options: Array<{ text: string; autoClick: boolean }>
}

/** A successful match result */
export interface MatchResult {
  /** The matched pattern text */
  pattern: string
  /** Match confidence 0-1 */
  confidence: number
  /** Which options were found */
  foundOptions: string[]
  /** Position of the match in screen coordinates */
  position?: { x: number; y: number }
}

/**
 * Pattern matching engine for dialog detection.
 * Supports contains, exact, regex, and fuzzy matching modes.
 */
export class DialogMatcher {
  /**
   * Matches OCR results against configured patterns
   * @param ocrResult - OCR recognition output
   * @param config - Match configuration
   * @returns Array of matches found
   */
  match(ocrResult: OcrResult, config: MatchConfig): MatchResult[] {
    const results: MatchResult[] = []

    if (!config.text && !config.content) return results

    const fullText = ocrResult.text.toLowerCase()

    // Check primary text match
    let primaryMatch = false
    let matchConfidence = 0

    switch (config.mode) {
      case 'exact':
        primaryMatch = fullText.includes(config.text.toLowerCase())
        matchConfidence = primaryMatch ? 1.0 : 0
        break

      case 'regex':
        try {
          const regex = new RegExp(config.text, 'gi')
          primaryMatch = regex.test(fullText)
          matchConfidence = primaryMatch ? 0.95 : 0
        } catch {
          // Invalid regex — fall back to contains
          primaryMatch = fullText.includes(config.text.toLowerCase())
          matchConfidence = primaryMatch ? 0.8 : 0
        }
        break

      case 'fuzzy':
        const similarity = this.fuzzyMatch(fullText, config.text.toLowerCase())
        primaryMatch = similarity > 0.6
        matchConfidence = similarity
        break

      case 'contains':
      default:
        primaryMatch = fullText.includes(config.text.toLowerCase())
        matchConfidence = primaryMatch ? 0.9 : 0
        break
    }

    // Check content match (if specified)
    if (config.content) {
      const contentMatch = fullText.includes(config.content.toLowerCase())
      if (primaryMatch && contentMatch) {
        matchConfidence = Math.min(1.0, matchConfidence + 0.1)
      } else if (!primaryMatch && contentMatch) {
        primaryMatch = true
        matchConfidence = 0.7
      }
    }

    if (!primaryMatch) return results

    // Find which options are present in the detected text
    const foundOptions: string[] = []
    for (const option of config.options) {
      if (fullText.includes(option.text.toLowerCase())) {
        foundOptions.push(option.text)
      }
    }

    results.push({
      pattern: config.text,
      confidence: matchConfidence,
      foundOptions,
    })

    return results
  }

  /**
   * Computes fuzzy similarity between two strings using Levenshtein distance
   * @param source - Source string
   * @param target - Target string to match
   * @returns Similarity score 0-1
   */
  private fuzzyMatch(source: string, target: string): number {
    if (source === target) return 1.0
    if (!source || !target) return 0

    // Check if target is a substring (high confidence)
    if (source.includes(target)) return 0.95

    // Compute Levenshtein distance on relevant portion
    const words = target.split(/\s+/)
    let bestScore = 0

    for (let i = 0; i <= source.length - target.length; i++) {
      const substring = source.substring(i, i + target.length)
      const distance = this.levenshtein(substring, target)
      const maxLen = Math.max(substring.length, target.length)
      const score = 1 - distance / maxLen

      if (score > bestScore) {
        bestScore = score
      }
    }

    // Also check word-by-word matching
    const sourceWords = source.split(/\s+/)
    let wordMatches = 0
    for (const word of words) {
      if (sourceWords.some((sw) => sw.includes(word) || word.includes(sw))) {
        wordMatches++
      }
    }
    const wordScore = words.length > 0 ? wordMatches / words.length : 0

    return Math.max(bestScore, wordScore)
  }

  /**
   * Computes Levenshtein edit distance between two strings
   */
  private levenshtein(a: string, b: string): number {
    const matrix: number[][] = []

    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i]
    }

    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1 // deletion
          )
        }
      }
    }

    return matrix[b.length][a.length]
  }
}
