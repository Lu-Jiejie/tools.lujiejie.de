import type { Tool, ToolCategory } from '~/data/tools'
import { computed, ref } from 'vue'
import { CATEGORY_ORDER, tools } from '~/data/tools'

const activeCategory = ref<ToolCategory | 'all'>('all')
const searchQuery = ref('')

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
    return CATEGORY_ORDER.map(cat => ({
      category: cat,
      tools: tools.filter(t => t.category === cat),
    }))
  })

  function findTool(id: string): Tool | undefined {
    return tools.find(t => t.id === id)
  }

  return {
    tools,
    filteredTools,
    toolsByCategory,
    activeCategory,
    searchQuery,
    findTool,
  }
}
