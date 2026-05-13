import { useLocalStorage } from '@vueuse/core'

export type Locale = 'zh' | 'en'

const locale = useLocalStorage<Locale>('locale', 'zh')

export function useLocale() {
  function toggleLocale() {
    locale.value = locale.value === 'zh' ? 'en' : 'zh'
  }
  return { locale, toggleLocale }
}
