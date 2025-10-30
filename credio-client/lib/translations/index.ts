import { en } from './en'
import { hi } from './hi'
import { Language } from '../store/language-store'

export const translations = {
    en,
    hi,
}

export function getTranslation(language: Language) {
    return translations[language] || translations.en
}

// Hook for using translations
export function useTranslation(language: Language) {
    return getTranslation(language)
}
