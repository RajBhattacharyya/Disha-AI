import { translationService } from "../services/translationService"
import { localizationService } from "../services/localizationService"

async function testTranslation() {
  console.log("Testing translation service...")

  const text = "Evacuate immediately! Move to higher ground."
  const targetLangs = ["es", "hi", "ar", "fr"]

  for (const lang of targetLangs) {
    const translation = await translationService.translateText(text, lang)
    console.log(`\n[${lang}] ${translation}`)
  }

  console.log("\nTesting language detection...")
  const detectedLang = await translationService.detectLanguage(
    "Bonjour, comment allez-vous?"
  )
  console.log(`Detected language: ${detectedLang}`)

  console.log("\nTesting localization...")
  const localizedText = localizationService.localizeUnits(
    "The shelter is 5 km away.",
    "en-US"
  )
  console.log(`Localized: ${localizedText}`)

  const emergencyNumber = localizationService.getEmergencyNumber("IN")
  console.log(`Emergency number for India: ${emergencyNumber}`)
}

testTranslation().catch(console.error)
