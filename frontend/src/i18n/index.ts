import type { App } from 'vue'
import { ref, computed } from 'vue'
import en from './locales/en'
import id from './locales/id'

export type SupportedLocale = 'en' | 'id'

export type TranslationDictionary = typeof en

const messages: Record<SupportedLocale, TranslationDictionary> = {
  en,
  id,
}

const currentLocale = ref<SupportedLocale>('en')

export function setLocale(locale: SupportedLocale) {
  currentLocale.value = locale
}

export function translate(keyPath: string, locale?: SupportedLocale, params?: Record<string, string | number>): string {
  const activeLocale = locale || currentLocale.value
  const dict = messages[activeLocale] || messages.en

  const parts = keyPath.split('.')
  let current: unknown = dict

  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = (current as Record<string, unknown>)[part]
    } else {
      return keyPath
    }
  }

  let result = typeof current === 'string' ? current : keyPath

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      result = result.replace(`{${key}}`, String(value))
    }
  }

  return result
}

export function createI18n() {
  return {
    install(app: App) {
      app.config.globalProperties.$t = (key: string) => translate(key, currentLocale.value)
      app.provide('i18n', {
        t: (key: string) => translate(key, currentLocale.value),
        locale: computed(() => currentLocale.value),
        setLocale,
      })
    },
  }
}

export const i18n = createI18n()