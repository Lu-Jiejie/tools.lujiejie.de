export type ToolCategory = 'text' | 'format' | 'encode' | 'convert'
export type ToolStatus = 'available' | 'coming-soon'

export interface Tool {
  id: string
  name: string
  description: string
  icon: string
  category: ToolCategory
  status: ToolStatus
  keywords?: string[]
}

export const CATEGORY_LABELS: Record<ToolCategory, string> = {
  text: 'Text',
  format: 'Format',
  encode: 'Encode',
  convert: 'Convert',
}

export const CATEGORY_ORDER: ToolCategory[] = ['text', 'format', 'encode', 'convert']

export const tools: Tool[] = [
  {
    id: 'case-converter',
    name: 'Case Converter',
    description: 'Convert text between camelCase, snake_case, PascalCase, kebab-case, and more.',
    icon: 'i-carbon-text-font',
    category: 'text',
    status: 'coming-soon',
    keywords: ['case', 'camel', 'snake', 'pascal', 'kebab'],
  },
  {
    id: 'text-replace',
    name: 'Text Replace',
    description: 'Find and replace text with support for regex patterns.',
    icon: 'i-carbon-find-and-replace',
    category: 'text',
    status: 'coming-soon',
    keywords: ['find', 'replace', 'regex', 'search'],
  },
  {
    id: 'word-counter',
    name: 'Word Counter',
    description: 'Count words, characters, sentences, and estimate reading time.',
    icon: 'i-carbon-word-cloud',
    category: 'text',
    status: 'coming-soon',
    keywords: ['word', 'count', 'character', 'reading'],
  },
  {
    id: 'regex-tester',
    name: 'Regex Tester',
    description: 'Test and debug regular expressions with live match highlighting.',
    icon: 'i-carbon-search',
    category: 'text',
    status: 'coming-soon',
    keywords: ['regex', 'regexp', 'pattern', 'match'],
  },
  {
    id: 'json-formatter',
    name: 'JSON Formatter',
    description: 'Format, validate, and minify JSON data with syntax highlighting.',
    icon: 'i-carbon-data-structured',
    category: 'format',
    status: 'coming-soon',
    keywords: ['json', 'format', 'validate', 'minify'],
  },
  {
    id: 'markdown-preview',
    name: 'Markdown Preview',
    description: 'Write and preview Markdown with real-time rendering.',
    icon: 'i-carbon-logo-markdown',
    category: 'format',
    status: 'coming-soon',
    keywords: ['markdown', 'preview', 'md', 'render'],
  },
  {
    id: 'base64',
    name: 'Base64',
    description: 'Encode and decode Base64 strings instantly.',
    icon: 'i-carbon-password',
    category: 'encode',
    status: 'coming-soon',
    keywords: ['base64', 'encode', 'decode'],
  },
  {
    id: 'url-encode',
    name: 'URL Encode',
    description: 'Encode and decode URL components and query strings.',
    icon: 'i-carbon-link',
    category: 'encode',
    status: 'coming-soon',
    keywords: ['url', 'encode', 'decode', 'percent', 'uri'],
  },
  {
    id: 'color-converter',
    name: 'Color Converter',
    description: 'Convert colors between HEX, RGB, HSL, and other formats.',
    icon: 'i-carbon-color-palette',
    category: 'convert',
    status: 'coming-soon',
    keywords: ['color', 'hex', 'rgb', 'hsl', 'convert'],
  },
  {
    id: 'timestamp',
    name: 'Timestamp',
    description: 'Convert between Unix timestamps and human-readable date formats.',
    icon: 'i-carbon-time',
    category: 'convert',
    status: 'coming-soon',
    keywords: ['timestamp', 'unix', 'date', 'time', 'epoch'],
  },
]
