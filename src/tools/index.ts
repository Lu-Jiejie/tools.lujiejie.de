import type { Component } from 'vue'

export type ToolCategory = 'favorites' | 'text' | 'format' | 'encode' | 'convert'

export interface Tool {
  id: string
  name: string
  description: string
  category: ToolCategory
  keywords?: string[]
}

export const CATEGORY_LABELS: Record<ToolCategory, string> = {
  favorites: 'Favorites',
  text: 'Text',
  format: 'Format',
  encode: 'Encode',
  convert: 'Convert',
}

export const CATEGORY_ORDER: ToolCategory[] = ['text', 'format', 'encode', 'convert']

// 辅助函数，为具体工具的 meta 提供自动类型推导和提示
export function defineTool(tool: Tool): Tool {
  return tool
}

// 自动收集同目录（src/tools）下的所有工具组件及其元信息
const toolModules = import.meta.glob<{ toolMeta: Tool, default: Component }>('./*.vue', { eager: true })

export const tools: Tool[] = Object.values(toolModules)
  .map(mod => mod.toolMeta)
  .filter(Boolean)

// 提供给具体工具页面加载组件使用
export function getToolComponent(id: string): Component | undefined {
  const match = Object.values(toolModules).find(mod => mod.toolMeta?.id === id)
  return match?.default
}
