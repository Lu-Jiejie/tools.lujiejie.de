// utils/markdown.ts

import type { AppHighlighter }
  from '~/composables/useShiki'

import MarkdownIt from 'markdown-it'

export function extractMarkdownLangs(
  markdown: string,
): string[] {
  return [
    ...markdown.matchAll(
      /^```([\w-]+)/gm,
    ),
  ]
    .map(match => match[1]?.trim())
    .filter(Boolean)
}

export function createMarkdownRenderer(
  highlighter: AppHighlighter,
  theme: string,
) {
  const md = new MarkdownIt({
    html: false,
    linkify: true,
    typographer: true,
    breaks: true,
  })

  md.renderer.rules.fence = (
    tokens,
    idx,
  ) => {
    const token = tokens[idx]

    const lang
      = token.info.trim() || 'text'

    try {
      return highlighter.codeToHtml(
        token.content,
        {
          lang,
          theme,
        },
      )
    }
    catch {
      return `
<pre><code>${md.utils.escapeHtml(
  token.content,
)}</code></pre>
`
    }
  }

  return (markdown: string) =>
    md.render(markdown)
}
