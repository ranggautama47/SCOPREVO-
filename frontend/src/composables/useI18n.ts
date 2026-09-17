import { computed } from "vue";
import { usePreferencesStore } from "../stores/preferences";
import { translate, type SupportedLocale } from "../i18n";

export function useI18n() {
  const preferencesStore = usePreferencesStore();

  const locale = computed({
    get: () => preferencesStore.locale,
    set: (val: SupportedLocale) => preferencesStore.setLocale(val),
  });

  const fontSize = computed({
    get: () => preferencesStore.fontSize,
    set: (val) => preferencesStore.setFontSize(val),
  });

  function t(
    keyPath: string,
    params?: Record<string, string | number>,
  ): string {
    return translate(keyPath, preferencesStore.locale, params);
  }

  const setLocale = (newLocale: SupportedLocale) => {
    preferencesStore.setLocale(newLocale);
  };

  return {
    t,
    locale,
    fontSize,
    setLocale,
    setFontSize: preferencesStore.setFontSize,
  };
}
