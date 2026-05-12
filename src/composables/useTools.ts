import type { Tool, ToolCategory } from '~/data/tools'
import { useLocalStorage } from '@vueuse/core'
import { computed, ref } from 'vue'
import { CATEGORY_ORDER, tools } from '~/data/tools'

const activeCategory = ref<ToolCategory | 'all'>('all')
const searchQuery = ref('')
const favorites = useLocalStorage<string[]>('favorite-tools', [])

export function useTools() {
  const filteredTools = computed(() => {
    let result = tools
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
      tools: tools.filter(t => t.category === cat),
    }))

    if (favorites.value.length > 0) {
      const favTools = favorites.value
        .map(id => tools.find(t => t.id === id))
        .filter((t): t is Tool => !!t)

      list.unshift({
        category: 'favorites',
        tools: favTools,
      })
    }

    return list
  })

  function findTool(id: string): Tool | undefined {
    return tools.find(t => t.id === id)
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
    tools,
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
