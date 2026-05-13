import type { ToolCategory } from '~/tools'
import { CATEGORY_LABELS } from '~/tools'
import { useLocale } from './useLocale'

type MessageValue = [string, string] // [en, zh]
export type MessageRecord = Record<string, MessageValue>

// 从 CATEGORY_LABELS 自动生成分类翻译
function buildCategoryMessages(): MessageRecord {
  const entries: MessageRecord = {}
  for (const cat of Object.keys(CATEGORY_LABELS) as ToolCategory[]) {
    entries[`category.${cat}`] = [CATEGORY_LABELS[cat].en, CATEGORY_LABELS[cat].zh]
  }
  return entries
}

// 全局翻译
const globalMessages: MessageRecord = {
  ...buildCategoryMessages(),
  'search.placeholder': ['Search tools...', '搜索工具...'],
  'search.noResults': ['No results for', '没有找到关于'],
  'home.subtitle': ['Tools I need.', '我需要的工具。'],
  'tool.favorite': ['Favorite', '收藏'],
  'header.switchLocale': ['Switch to Chinese', '切换到英文'],
  'header.toggleDark': ['Switch to dark mode', '切换到暗色模式'],
  'header.toggleLight': ['Switch to light mode', '切换到亮色模式'],
  'header.openMenu': ['Open menu', '打开菜单'],
}

export function useI18n(componentMessages?: MessageRecord) {
  const { locale } = useLocale()

  // 合并全局和组件级翻译
  const messages = componentMessages
    ? { ...globalMessages, ...componentMessages }
    : globalMessages

  function t(key: string): string {
    const pair = messages[key]
    if (!pair)
      return key
    return locale.value === 'zh' ? pair[1] : pair[0]
  }

  return { t }
}
