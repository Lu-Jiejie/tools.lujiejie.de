import type { Tool, ToolCategory } from '~/tools'
import { useLocalStorage } from '@vueuse/core'
import { computed, ref } from 'vue'
import { CATEGORY_ORDER, tools } from '~/tools'
import { useLocale } from './useLocale'

const activeCategory = ref<ToolCategory | 'all'>('all')
const searchQuery = ref('')
const favorites = useLocalStorage<string[]>('favorite-tools', [])

function localize(tool: Tool, locale: 'zh' | 'en'): Tool {
  if (locale === 'zh') {
    return {
      ...tool,
      name: tool.nameZh || tool.name,
      description: tool.descriptionZh || tool.description,
    }
  }
  return tool
}

export function useTools() {
  const { locale } = useLocale()

  const localizedTools = computed(() =>
    tools.map(t => localize(t, locale.value)),
  )

  const filteredTools = computed(() => {
    let result = localizedTools.value
    if (activeCategory.value !== 'all')
      result = result.filter(t => t.category === activeCategory.value)

    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase()
      result = result.filter(
        t =>
          t.name.toLowerCase().includes(q)
          || t.description.toLowerCase().includes(q)
          || t.keywords?.some(k => k.includes(q)),
      )
    }
    return result
  })

  const toolsByCategory = computed(() => {
    const list: { category: ToolCategory, tools: Tool[] }[] = CATEGORY_ORDER.map(cat => ({
      category: cat,
      tools: localizedTools.value.filter(t => t.category === cat),
    })).filter(group => group.tools.length > 0)

    if (favorites.value.length > 0) {
      const favTools = favorites.value
        .map(id => localizedTools.value.find(t => t.id === id))
        .filter((t): t is Tool => !!t)

      list.unshift({
        category: 'favorites',
        tools: favTools,
      })
    }

    return list
  })

  function findTool(id: string): Tool | undefined {
    const tool = tools.find(t => t.id === id)
    return tool ? localize(tool, locale.value) : undefined
  }

  function toggleFavorite(id: string) {
    if (favorites.value.includes(id))
      favorites.value = favorites.value.filter(fid => fid !== id)
    else
      favorites.value.push(id)
  }

  function isFavorite(id: string) {
    return favorites.value.includes(id)
  }

  return {
    tools: localizedTools,
    filteredTools,
    toolsByCategory,
    activeCategory,
    searchQuery,
    findTool,
    favorites,
    toggleFavorite,
    isFavorite,
  }
}
