export const SUPPORTED_LANGUAGES = [
  { code: "en", name: "English", region: "Global", isRTL: false },
  { code: "es", name: "Spanish", region: "Latin America, Spain", isRTL: false },
  { code: "fr", name: "French", region: "France, West Africa", isRTL: false },
  { code: "ar", name: "Arabic", region: "Middle East, North Africa", isRTL: true },
  { code: "hi", name: "Hindi", region: "India", isRTL: false },
  { code: "bn", name: "Bengali", region: "Bangladesh, India", isRTL: false },
  { code: "pt", name: "Portuguese", region: "Brazil, Portugal", isRTL: false },
  { code: "zh", name: "Chinese", region: "China, Taiwan", isRTL: false },
  { code: "ja", name: "Japanese", region: "Japan", isRTL: false },
  { code: "tl", name: "Filipino", region: "Philippines", isRTL: false },
  { code: "vi", name: "Vietnamese", region: "Vietnam", isRTL: false },
  { code: "ta", name: "Tamil", region: "India, Sri Lanka", isRTL: false },
  { code: "te", name: "Telugu", region: "India", isRTL: false },
  { code: "mr", name: "Marathi", region: "India", isRTL: false },
  { code: "it", name: "Italian", region: "Italy", isRTL: false },
  { code: "de", name: "German", region: "Germany, Austria", isRTL: false },
  { code: "ru", name: "Russian", region: "Russia", isRTL: false },
  { code: "ko", name: "Korean", region: "South Korea", isRTL: false },
  { code: "tr", name: "Turkish", region: "Turkey", isRTL: false },
  { code: "th", name: "Thai", region: "Thailand", isRTL: false },
]

export function getLanguageName(code: string): string {
  const language = SUPPORTED_LANGUAGES.find((lang) => lang.code === code)
  return language ? language.name : code
}

export function isRTLLanguage(code: string): boolean {
  const language = SUPPORTED_LANGUAGES.find((lang) => lang.code === code)
  return language ? language.isRTL : false
}
