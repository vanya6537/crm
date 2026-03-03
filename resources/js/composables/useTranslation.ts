// resources/js/composables/useTranslation.ts

import { computed, ref } from 'vue'

type LanguageCode = 'ru' | 'en'

interface Translations {
  [key: string]: string
}

interface AvailableTranslations {
  ru: Translations
  en: Translations
}

const currentLocale = ref<LanguageCode>('ru')

const translations = ref<AvailableTranslations>({
  ru: {},
  en: {},
})

// Load translations from Laravel
export async function loadTranslations() {
  try {
    // In a real app, you would fetch these from the backend
    // For now, they're included via Laravel's lang() helper
    const locale = document.documentElement.lang || 'ru'
    currentLocale.value = locale as LanguageCode
  } catch (error) {
    console.error('Failed to load translations:', error)
  }
}

export function useTranslation() {
  const t = (key: string, defaultValue?: string): string => {
    // Use Laravel's __(key) helper if available
    if (typeof window !== 'undefined' && (window as any).__) {
      return (window as any).__(key)
    }
    return defaultValue || key
  }

  const locale = computed(() => currentLocale.value)

  const setLocale = (newLocale: LanguageCode) => {
    currentLocale.value = newLocale
    // You could also send this to the backend to save user preference
  }

  return {
    t,
    locale,
    setLocale,
  }
}

// Create a global helper
export function registerTranslationPlugin(app: any) {
  app.config.globalProperties.$t = (key: string) => {
    if (typeof window !== 'undefined' && (window as any).__) {
      return (window as any).__(key)
    }
    return key
  }
}
