import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth'
import { translationService } from '../services/translationService'

export async function translateText(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { text, targetLang, context } = req.body
    const translation = await translationService.translateText(text, targetLang, context)
    res.json({ success: true, data: { translation, targetLang } })
  } catch (error) {
    next(error)
  }
}

export async function detectLanguage(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { text } = req.body
    const language = await translationService.detectLanguage(text)
    res.json({ success: true, data: { language } })
  } catch (error) {
    next(error)
  }
}
