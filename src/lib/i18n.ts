import { useSettingsStore } from '@/stores/settingsStore'
import { th } from '@/lib/translations/th'
import { en } from '@/lib/translations/en'

type TranslationKey = keyof typeof th

const translations = { th, en }

export function useTranslation() {
  const language = useSettingsStore((s) => s.language)
  const t = (key: TranslationKey) => {
    return translations[language]?.[key] || translations.th[key] || key
  }
  return { t, language }
}
