import OpenAI from "openai"
import Redis from "ioredis"
import crypto from "crypto"
import { logger } from "../utils/logger"
import { getLanguageName } from "../constants/languages"
import { getCachedPhrase } from "../constants/emergencyPhrases"

const redis = new Redis(process.env.REDIS_URL!)

export class TranslationService {
  private openai: OpenAI
  private cache: Map<string, string>

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    })
    this.cache = new Map()
  }

  // Main translation function
  async translateText(
    text: string,
    targetLang: string,
    context?: string
  ): Promise<string> {
    try {
      // Check in-memory cache first
      const cacheKey = this.getCacheKey(text, targetLang)
      if (this.cache.has(cacheKey)) {
        logger.info("Translation from memory cache", { targetLang })
        return this.cache.get(cacheKey)!
      }

      // Check Redis cache
      const cachedTranslation = await redis.get(`translation:${cacheKey}`)
      if (cachedTranslation) {
        logger.info("Translation from Redis cache", { targetLang })
        this.cache.set(cacheKey, cachedTranslation)
        return cachedTranslation
      }

      // Generate new translation with OpenAI
      const prompt = `
Translate the following emergency/disaster safety message to ${getLanguageName(targetLang)}.

CONTEXT: ${context || "Emergency disaster response"}

REQUIREMENTS:
- Maintain urgency and clarity
- Use simple, direct language suitable for emergencies
- Preserve formatting (bullet points, numbers)
- Keep action items clear and sequential
- Preserve warnings and emphasis (⚠️, 🚨)
- If technical terms/acronyms exist, provide local equivalent in parentheses
- Avoid idioms that don't translate well
- Ensure cultural appropriateness

TEXT TO TRANSLATE:
${text}

OUTPUT FORMAT:
Provide ONLY the translation, no explanations or meta-commentary.
      `.trim()

      const result = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        max_tokens: 1024,
      })
      const translation = result.choices[0].message.content?.trim() || text

      // Cache the translation
      this.cache.set(cacheKey, translation)
      await redis.setex(`translation:${cacheKey}`, 86400, translation) // 24 hours TTL

      logger.info("Translation generated and cached", { targetLang })
      return translation
    } catch (error) {
      logger.error("Translation failed", { text, targetLang, error })

      // Try offline phrase cache as fallback
      const fallback = getCachedPhrase(text, targetLang)
      if (fallback) {
        logger.info("Using offline phrase cache", { targetLang })
        return fallback
      }

      return text // Return original if all fails
    }
  }

  // Translate disaster protocols (specialized for safety instructions)
  async translateDisasterProtocol(
    protocol: string,
    targetLang: string
  ): Promise<string> {
    const prompt = `
Translate this emergency safety protocol to ${getLanguageName(targetLang)}.

CRITICAL REQUIREMENTS:
- Maintain exact order of safety steps
- Preserve numbered/bulleted format
- Keep warnings (⚠️, 🚨) and emphasis
- Use culturally appropriate emergency terminology
- Ensure clarity over literal translation
- For location-specific terms, provide local context
- Preserve imperative voice for commands

PROTOCOL:
${protocol}

TRANSLATED PROTOCOL:
    `.trim()

    try {
      const result = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        max_tokens: 1024,
      })
      return result.choices[0].message.content?.trim() || protocol
    } catch (error) {
      logger.error("Protocol translation failed", { error })
      return protocol
    }
  }

  // Auto-detect language from text
  async detectLanguage(text: string): Promise<string> {
    const prompt = `
Detect the language of this text. Respond with ONLY the ISO 639-1 code (e.g., 'en', 'es', 'fr', 'hi', 'ar').

TEXT: ${text}

LANGUAGE CODE:
    `.trim()

    try {
      const result = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        max_tokens: 10,
      })
      return result.choices[0].message.content?.trim().toLowerCase() || "en"
    } catch (error) {
      logger.error("Language detection failed", { error })
      return "en" // Default to English
    }
  }

  // Batch translate (for alerts to multiple languages)
  async batchTranslate(
    texts: string[],
    targetLangs: string[]
  ): Promise<{ [lang: string]: string[] }> {
    const results: { [lang: string]: string[] } = {}

    for (const lang of targetLangs) {
      logger.info("Batch translating to language", { lang, count: texts.length })
      results[lang] = await Promise.all(
        texts.map((text) => this.translateText(text, lang))
      )
    }

    return results
  }

  // Validate translation quality (basic check)
  async validateTranslation(
    original: string,
    translated: string,
    targetLang: string
  ): Promise<boolean> {
    // Basic validation: check length ratio (translations shouldn't be too different in length)
    const lengthRatio = translated.length / original.length
    if (lengthRatio < 0.3 || lengthRatio > 3) {
      logger.warn("Translation length suspicious", {
        original,
        translated,
        lengthRatio,
      })
      return false
    }

    // Check if critical terms are preserved (warnings)
    const criticalSymbols = ["⚠️", "🚨", "100", "112"]
    for (const symbol of criticalSymbols) {
      if (original.includes(symbol) && !translated.includes(symbol)) {
        logger.warn("Critical symbol missing in translation", { symbol })
        return false
      }
    }

    return true
  }

  // Clear cache (useful for maintenance)
  async clearCache(): Promise<void> {
    this.cache.clear()
    const keys = await redis.keys("translation:*")
    if (keys.length > 0) {
      await redis.del(...keys)
    }
    logger.info("Translation cache cleared")
  }

  // Generate cache key
  private getCacheKey(text: string, targetLang: string): string {
    return crypto
      .createHash("sha256")
      .update(`${text}:${targetLang}`)
      .digest("hex")
  }
}

export const translationService = new TranslationService()
