import { defineStore } from 'pinia';
import { ref } from 'vue';

export type SupportedLocale = 'en' | 'id';
export type FontSize = 'sm' | 'md' | 'lg';

const LOCALE_STORAGE_KEY = 'scoprevo_locale';
const FONT_SIZE_STORAGE_KEY = 'scoprevo_font_size';
const DEFAULT_QUOTA_KEY = 'scoprevo_default_revisions';

function getInitialLocale(): SupportedLocale {
  const saved = localStorage.getItem(LOCALE_STORAGE_KEY);
  if (saved === 'en' || saved === 'id') return saved;
  const browserLang = navigator.language.toLowerCase();
  return browserLang.startsWith('id') ? 'id' : 'en';
}

function getInitialFontSize(): FontSize {
  const saved = localStorage.getItem(FONT_SIZE_STORAGE_KEY);
  if (saved === 'sm' || saved === 'md' || saved === 'lg') return saved;
  return 'md';
}

function getInitialDefaultQuota(): number {
  const stored = localStorage.getItem(DEFAULT_QUOTA_KEY);
  if (stored) {
    const parsed = parseInt(stored, 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  return 3;
}

export const usePreferencesStore = defineStore('preferences', () => {
  const locale = ref<SupportedLocale>(getInitialLocale());
  const fontSize = ref<FontSize>(getInitialFontSize());
  const defaultRevisionsQuota = ref<number>(getInitialDefaultQuota());

  function setLocale(newLocale: SupportedLocale) {
    locale.value = newLocale;
    localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
    document.documentElement.setAttribute('lang', newLocale);
  }

  function setFontSize(newFontSize: FontSize) {
    fontSize.value = newFontSize;
    localStorage.setItem(FONT_SIZE_STORAGE_KEY, newFontSize);
    document.documentElement.dataset.fontSize = newFontSize;
  }

  function setDefaultRevisionsQuota(quota: number) {
    const validQuota = Math.max(1, Math.min(100, quota));
    defaultRevisionsQuota.value = validQuota;
    localStorage.setItem(DEFAULT_QUOTA_KEY, String(validQuota));
  }

  function initPreferences() {
    document.documentElement.setAttribute('lang', locale.value);
    document.documentElement.dataset.fontSize = fontSize.value;
  }

  return {
    locale,
    fontSize,
    defaultRevisionsQuota,
    setLocale,
    setFontSize,
    setDefaultRevisionsQuota,
    initPreferences,
  };
});
