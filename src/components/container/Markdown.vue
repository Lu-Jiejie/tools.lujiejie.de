<script setup lang="ts">
import { computed } from 'vue'
import Panel from '~/components/container/Panel.vue'
import { useLocale } from '~/composables/useLocale'

// Localized value: a plain string, or an [en, zh] tuple matching the project's
// i18n message convention. The component resolves it against the active locale,
// so callers can pass bilingual Markdown directly.
type Localized = string | [string, string]

const props = defineProps<{
  title?: Localized
  content: Localized
}>()

const { locale } = useLocale()

function pick(v: Localized | undefined, fallback = ''): string {
  if (v === undefined)
    return fallback
  if (Array.isArray(v))
    return locale.value === 'zh' ? (v[1] ?? v[0]) : v[0]
  return v
}

const titleText = computed(() =>
  pick(props.title, locale.value === 'zh' ? '使用说明' : 'How It Works'))

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// Inline spans on already HTML-escaped text. Order matters: code is converted
// first so emphasis markers inside a code span are left untouched. Backslash-
// escaped punctuation (e.g. \*) is stashed before parsing and restored as the
// literal character afterwards, so migrated plain text never gains stray markup.
function inline(s: string) {
  const stash: string[] = []
  s = s.replace(/\\([\\`*_{}[\]()#+\-.!|~])/g, (_, ch: string) => {
    stash.push(ch)
    return `\uE000${stash.length - 1}\uE000`
  })
  s = s
    .replace(/`([^`]+)`/g, (_, c) => `<code>${c}</code>`)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(?<![*\w])\*([^*\n]+)\*(?!\*)/g, '<em>$1</em>')
    .replace(/\b_([^_\n]+)_\b/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, text, url) => {
      const safe = /^(?:https?:\/\/|\/|#|mailto:)/i.test(url) ? url : '#'
      return `<a href="${safe}" target="_blank" rel="noreferrer">${text}</a>`
    })
  return s.replace(/\uE000(\d+)\uE000/g, (_, n: string) => stash[Number(n)])
}

// A small block-level Markdown renderer covering the subset used by tool docs:
// headings, paragraphs, ordered/unordered lists, blockquotes, fenced code, and
// horizontal rules. Content is author-supplied (never user input) and every
// segment is HTML-escaped before tags are emitted, so v-html stays safe.
function renderMarkdown(src: string): string {
  const lines = src.replace(/\r\n/g, '\n').replace(/\t/g, '  ').split('\n')
  const out: string[] = []
  let para: string[] = []
  let i = 0

  function flushPara() {
    if (para.length) {
      out.push(`<p>${inline(escapeHtml(para.join(' ')))}</p>`)
      para = []
    }
  }

  while (i < lines.length) {
    const raw = lines[i]
    const line = raw.trim()

    if (line.startsWith('```')) {
      flushPara()
      const code: string[] = []
      i++
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        code.push(lines[i])
        i++
      }
      i++ // skip closing fence
      out.push(`<pre><code>${escapeHtml(code.join('\n'))}</code></pre>`)
      continue
    }

    if (line === '') {
      flushPara()
      i++
      continue
    }

    if (/^(?:-{3,}|\*{3,}|_{3,})$/.test(line)) {
      flushPara()
      out.push('<hr>')
      i++
      continue
    }

    // eslint-disable-next-line regexp/no-super-linear-backtracking
    const heading = /^(#{1,6})\s+(.*)$/.exec(line)
    if (heading) {
      flushPara()
      const level = heading[1].length
      out.push(`<h${level}>${inline(escapeHtml(heading[2]))}</h${level}>`)
      i++
      continue
    }

    if (/^>\s?/.test(line)) {
      flushPara()
      const quote: string[] = []
      while (i < lines.length && /^>\s?/.test(lines[i].trim())) {
        quote.push(lines[i].trim().replace(/^>\s?/, ''))
        i++
      }
      out.push(`<blockquote>${inline(escapeHtml(quote.join(' ')))}</blockquote>`)
      continue
    }

    if (/^[-*]\s+/.test(line)) {
      flushPara()
      const items: string[] = []
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*]\s+/, ''))
        i++
      }
      out.push(`<ul>${items.map(it => `<li>${inline(escapeHtml(it))}</li>`).join('')}</ul>`)
      continue
    }

    if (/^\d+\.\s+/.test(line)) {
      flushPara()
      const items: string[] = []
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ''))
        i++
      }
      out.push(`<ol>${items.map(it => `<li>${inline(escapeHtml(it))}</li>`).join('')}</ol>`)
      continue
    }

    para.push(line)
    i++
  }
  flushPara()
  return out.join('\n')
}

const rendered = computed(() => renderMarkdown(pick(props.content)))
</script>

<template>
  <Panel :title="titleText">
    <!-- eslint-disable-next-line vue/no-v-html -->
    <div class="markdown" p-5 v-html="rendered" />
  </Panel>
</template>

<style scoped>
/* v-html content is outside scoped-style reach without :deep(). Styling stays
   on project tokens: serif headings, sans body, mono code. */
.markdown :deep(> :first-child) {
  margin-top: 0;
}
.markdown :deep(> :last-child) {
  margin-bottom: 0;
}

.markdown :deep(h1),
.markdown :deep(h2),
.markdown :deep(h3),
.markdown :deep(h4) {
  @apply font-serif;
  margin: 1.4em 0 0.5em;
  font-weight: 400;
  line-height: 1.25;
  color: var(--c-text);
}
.markdown :deep(h1) {
  font-size: 1.5rem;
}
.markdown :deep(h2) {
  font-size: 1.2rem;
}
.markdown :deep(h3),
.markdown :deep(h4) {
  font-size: 1.02rem;
}

.markdown :deep(p) {
  margin: 0.5em 0;
  font-size: 0.875rem;
  line-height: 1.7;
  color: var(--c-text-muted);
}

.markdown :deep(ul),
.markdown :deep(ol) {
  margin: 0.5em 0;
  padding-left: 1.35em;
}
.markdown :deep(li) {
  margin: 0.3em 0;
  font-size: 0.875rem;
  line-height: 1.65;
  color: var(--c-text-muted);
}
.markdown :deep(li::marker) {
  color: var(--c-text-faint);
}

.markdown :deep(strong) {
  font-weight: 600;
  color: var(--c-text);
}
.markdown :deep(em) {
  font-style: italic;
}

.markdown :deep(a) {
  color: var(--c-accent);
  text-decoration: none;
  border-bottom: 1px solid color-mix(in srgb, var(--c-accent) 35%, transparent);
}
.markdown :deep(a:hover) {
  border-bottom-color: var(--c-accent);
}

.markdown :deep(code) {
  @apply font-mono;
  padding: 0.1em 0.4em;
  border-radius: 0.375rem;
  background: var(--c-surface-raised);
  font-size: 0.82em;
  color: var(--c-text);
}

.markdown :deep(pre) {
  margin: 0.75em 0;
  padding: 0.9em 1em;
  border-radius: 0.625rem;
  background: var(--c-surface-raised);
  overflow-x: auto;
}
.markdown :deep(pre code) {
  padding: 0;
  background: none;
  font-size: 0.82rem;
  line-height: 1.6;
}

.markdown :deep(blockquote) {
  margin: 0.75em 0;
  padding: 0.2em 0 0.2em 1em;
  border-left: 2px solid var(--c-border-strong);
  color: var(--c-text-muted);
}

.markdown :deep(hr) {
  margin: 1.25em 0;
  border: none;
  border-top: 1px solid var(--c-border);
}
</style>
