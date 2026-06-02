export const CODE_THEMES = [
  'vitesse-light',
  'vitesse-dark',

  'github-light',
  'github-dark',

  'catppuccin-latte',
  'catppuccin-mocha',

  'dracula-soft',
  'dracula',

  'rose-pine-dawn',
  'rose-pine-moon',

  'one-light',
  'one-dark-pro',

  'solarized-light',
  'solarized-dark',

  'material-theme-lighter',
  'material-theme-darker',
] as const

export const DEFAULT_LANGS = [
  'json',
  'sql',
  'typescript',
  'javascript',
  'java',
  'xml',
  'go',
  'yaml',
  'toml',
] as const

type ShikiModule = typeof import('shiki')

export type AppHighlighter
  = Awaited<
    ReturnType<
      ShikiModule['createHighlighter']
    >
  >

let highlighterPromise:
  | Promise<AppHighlighter>
  | null
    = null

const loadedLangs = new Set<string>()

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))]
}

export async function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = import('shiki')
      .then(async ({ createHighlighter }) => {
        const highlighter
          = await createHighlighter({
            themes: [...CODE_THEMES],
            langs: [...DEFAULT_LANGS],
          })

        DEFAULT_LANGS.forEach(lang =>
          loadedLangs.add(lang),
        )

        return highlighter
      })
  }

  return highlighterPromise
}

export async function ensureLanguages(
  langs: string[],
) {
  const highlighter
    = await getHighlighter()

  const missing = unique(langs)
    .filter(lang => !loadedLangs.has(lang))

  if (!missing.length)
    return highlighter

  await highlighter.loadLanguage(
    ...(missing as Parameters<
      typeof highlighter.loadLanguage
    >),
  )

  missing.forEach(lang =>
    loadedLangs.add(lang),
  )

  return highlighter
}
