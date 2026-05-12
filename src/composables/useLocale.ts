import { ref } from 'vue'

export type Locale = 'zh' | 'en'

const locale = ref<Locale>('zh')

export function useLocale() {
  function toggleLocale() {
    locale.value = locale.value === 'zh' ? 'en' : 'zh'
  }
  return { locale, toggleLocale }
}
