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

export const tools: Tool[] = [
  {
    id: 'text-replace',
    name: 'Text Replace',
    description: 'Find and replace text with support for regex patterns.',
    category: 'text',
    keywords: ['find', 'replace', 'regex', 'search'],
  },
  {
    id: 'word-counter',
    name: 'Word Counter',
    description: 'Count words, characters, sentences, and estimate reading time.',
    category: 'text',
    keywords: ['word', 'count', 'character', 'reading'],
  },
  {
    id: 'regex-tester',
    name: 'Regex Tester',
    description: 'Test and debug regular expressions with live match highlighting.',
    category: 'text',
    keywords: ['regex', 'regexp', 'pattern', 'match'],
  },
  {
    id: 'json-formatter',
    name: 'JSON Formatter',
    description: 'Format, validate, and minify JSON data with syntax highlighting.',
    category: 'format',
    keywords: ['json', 'format', 'validate', 'minify'],
  },
  {
    id: 'base64',
    name: 'Base64',
    description: 'Encode and decode Base64 strings instantly.',
    category: 'encode',
    keywords: ['base64', 'encode', 'decode'],
  },
  {
    id: 'url-encode',
    name: 'URL Encode',
    description: 'Encode and decode URL components and query strings.',
    category: 'encode',
    keywords: ['url', 'encode', 'decode', 'percent', 'uri'],
  },
  {
    id: 'color-converter',
    name: 'Color Converter',
    description: 'Convert colors between HEX, RGB, HSL, and other formats.',
    category: 'convert',
    keywords: ['color', 'hex', 'rgb', 'hsl', 'convert'],
  },
  {
    id: 'timestamp',
    name: 'Timestamp',
    description: 'Convert between Unix timestamps and human-readable date formats.',
    category: 'convert',
    keywords: ['timestamp', 'unix', 'date', 'time', 'epoch'],
  },
]
