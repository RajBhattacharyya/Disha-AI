export class LocalizationService {
  // Adjust measurement units based on locale
  localizeUnits(text: string, locale: string): string {
    const isMetric = this.isMetricLocale(locale)

    if (!isMetric) {
      // Convert km to miles
      text = text.replace(/(\d+\.?\d*)\s*km/gi, (match, num) => {
        const miles = (parseFloat(num) * 0.621371).toFixed(1)
        return `${miles} miles`
      })

      // Convert meters to feet
      text = text.replace(/(\d+)\s*meters?/gi, (match, num) => {
        const feet = (parseFloat(num) * 3.28084).toFixed(0)
        return `${feet} feet`
      })

      // Convert Celsius to Fahrenheit
      text = text.replace(/(\d+)°C/gi, (match, num) => {
        const fahrenheit = ((parseFloat(num) * 9) / 5 + 32).toFixed(0)
        return `${fahrenheit}°F`
      })
    }

    return text
  }

  // Format dates and times for locale
  localizeDatetime(date: Date, locale: string): string {
    return date.toLocaleString(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    })
  }

  // Get local emergency numbers by country code
  getEmergencyNumber(countryCode: string): string {
    const numbers: { [key: string]: string } = {
      US: "911",
      CA: "911",
      UK: "999",
      EU: "112",
      IN: "112",
      AU: "000",
      NZ: "111",
      JP: "110",
      CN: "110",
      BR: "190",
      MX: "911",
      PH: "911",
      ZA: "10111",
      KR: "112",
      TH: "191",
      VN: "113",
      ID: "112",
      MY: "999",
      SG: "995",
    }

    return numbers[countryCode] || "112" // Default to EU standard
  }

  // Localize emergency contact information
  localizeEmergencyInfo(message: string, countryCode: string): string {
    const emergencyNumber = this.getEmergencyNumber(countryCode)
    return message.replace(/\b(911|999|000|112)\b/g, emergencyNumber)
  }

  // Adjust communication style for culture (high-context vs low-context)
  localizeMessage(message: string, culture: string): string {
    // High-context cultures (Asian): more polite, indirect
    // Low-context cultures (Western): direct, explicit
    // Gemini handles most of this in translation, but we can add markers
    
    if (["ja", "ko", "zh", "th", "vi"].includes(culture)) {
      // For high-context cultures, ensure respectful tone
      // This is handled by Gemini's translation, so just log
      return message
    }

    return message
  }

  // Check if locale uses metric system
  private isMetricLocale(locale: string): boolean {
    const nonMetricLocales = ["en-US", "en-LR", "en-MM"] // US, Liberia, Myanmar
    return !nonMetricLocales.some((l) => locale.startsWith(l))
  }
}

export const localizationService = new LocalizationService()
