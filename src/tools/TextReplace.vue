<script lang="ts">
import { defineTool } from './index'

export const toolMeta = defineTool({
  id: 'text-replace',
  name: 'Text Replace',
  nameZh: '文本替换',
  description: 'Find and replace text with regex support and live diff preview.',
  descriptionZh: '查找替换文本，支持正则表达式和实时差异预览。',
  category: 'text',
  keywords: ['find', 'replace', 'regex', 'search', '查找', '替换', '正则'],
})
</script>

<!-- eslint-disable import/first -->
<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import Panel from '~/components/container/Panel.vue'
import BaseButton from '~/components/input/BaseButton.vue'
import TextareaInput from '~/components/input/TextareaInput.vue'
import TextInput from '~/components/input/TextInput.vue'
import AlertTip from '~/components/ui/AlertTip.vue'
import { useI18n } from '~/composables/useI18n'

const { t } = useI18n({
  source_label: ['Source Text', '源文本'],
  source_placeholder: ['Paste or type your text here...', '在此粘贴或输入文本...'],
  find_label: ['Find', '查找'],
  find_placeholder: ['Search pattern...', '搜索模式...'],
  replace_label: ['Replace', '替换'],
  replace_placeholder: ['Replacement ($1, $2 for groups)...', '替换内容（$1, $2 引用捕获组）...'],
  use_regex: ['Regex', '正则'],
  flag_g: ['Global', '全局'],
  flag_i: ['Ignore Case', '忽略大小写'],
  flag_m: ['Multiline', '多行'],
  flag_s: ['Dot All', '点匹配换行'],
  result_label: ['Result', '替换结果'],
  diff_label: ['Diff Preview', '差异预览'],
  replace_count: [(n: string) => `${n} replacement(s)`, (n: string) => `共 ${n} 处替换`],
  no_match: ['No matches found', '未找到匹配'],
  invalid_regex: ['Invalid regular expression.', '无效的正则表达式。'],
  copied: ['Copied!', '已复制！'],
})

const sourceText = shallowRef('Hello World\nfoo bar\nHello World\n\nbaz qux\n  spaces  ')
const findPattern = shallowRef('(\\w+)\\s(\\w+)')
const replacePattern = shallowRef('$2_$1')
const useRegex = shallowRef(true)
const flagG = shallowRef(true)
const flagI = shallowRef(false)
const flagM = shallowRef(false)
const flagS = shallowRef(false)

const flags = computed(() => {
  let f = ''
  if (flagG.value)
    f += 'g'
  if (flagI.value)
    f += 'i'
  if (flagM.value)
    f += 'm'
  if (flagS.value)
    f += 's'
  return f
})

interface ReplaceResult {
  output: string
  count: number
  error: string | null
}

const result = computed<ReplaceResult>(() => {
  if (!sourceText.value || !findPattern.value)
    return { output: sourceText.value, count: 0, error: null }

  if (useRegex.value) {
    let regex: RegExp
    try {
      regex = new RegExp(findPattern.value, flags.value)
    }
    catch (e: unknown) {
      return { output: sourceText.value, count: 0, error: (e as Error).message }
    }

    let count = 0
    const output = sourceText.value.replace(regex, (...args) => {
      count++
      const match = args[0] as string
      const groups = args.slice(1, -2)
      const namedGroups = args[args.length - 1]

      let replacement = replacePattern.value
      // $& → full match
      replacement = replacement.replace(/\$&/g, match)
      // $1, $2, ... → numbered groups
      replacement = replacement.replace(/\$(\d+)/g, (_, n) => groups[Number(n) - 1] ?? '')
      // $<name> → named groups
      if (namedGroups && typeof namedGroups === 'object')
        replacement = replacement.replace(/\$<(\w+)>/g, (_, name) => (namedGroups as Record<string, string>)[name] ?? '')
      return replacement
    })

    return { output, count, error: null }
  }
  else {
    const search = findPattern.value
    let count = 0
    let output = sourceText.value

    if (flagG.value) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const regex = new RegExp(escaped, `g${flagI.value ? 'i' : ''}`)
      output = sourceText.value.replace(regex, () => {
        count++
        return replacePattern.value
      })
    }
    else {
      const idx = flagI.value
        ? sourceText.value.toLowerCase().indexOf(search.toLowerCase())
        : sourceText.value.indexOf(search)
      if (idx !== -1) {
        count = 1
        output = sourceText.value.slice(0, idx) + replacePattern.value + sourceText.value.slice(idx + search.length)
      }
    }

    return { output, count, error: null }
  }
})

// Diff segments for visual comparison
interface DiffSegment {
  text: string
  type: 'same' | 'removed' | 'added'
}

const diffSegments = computed<DiffSegment[]>(() => {
  if (!sourceText.value || !findPattern.value || result.value.error || result.value.count === 0)
    return []

  const segs: DiffSegment[] = []
  const source = sourceText.value

  if (useRegex.value) {
    let regex: RegExp
    try {
      regex = new RegExp(findPattern.value, flags.value)
    }
    catch {
      return []
    }

    let cursor = 0
    let match: RegExpExecArray | null
    let lastIndex = -1

    if (flagG.value) {
      match = regex.exec(source)
      while (match !== null) {
        if (match.index === lastIndex) {
          regex.lastIndex++
          match = regex.exec(source)
          continue
        }
        lastIndex = match.index

        if (match.index > cursor)
          segs.push({ text: source.slice(cursor, match.index), type: 'same' })

        segs.push({ text: match[0], type: 'removed' })

        let replacement = replacePattern.value
        const groups = match.slice(1)
        replacement = replacement.replace(/\$&/g, match[0])
        replacement = replacement.replace(/\$(\d+)/g, (_, n) => groups[Number(n) - 1] ?? '')
        if (match.groups)
          replacement = replacement.replace(/\$<(\w+)>/g, (_, name) => match!.groups![name] ?? '')
        segs.push({ text: replacement, type: 'added' })

        cursor = match.index + match[0].length
        match = regex.exec(source)
      }
    }
    else {
      match = regex.exec(source)
      if (match) {
        if (match.index > 0)
          segs.push({ text: source.slice(0, match.index), type: 'same' })
        segs.push({ text: match[0], type: 'removed' })

        let replacement = replacePattern.value
        const groups = match.slice(1)
        replacement = replacement.replace(/\$&/g, match[0])
        replacement = replacement.replace(/\$(\d+)/g, (_, n) => groups[Number(n) - 1] ?? '')
        if (match.groups)
          replacement = replacement.replace(/\$<(\w+)>/g, (_, name) => match!.groups![name] ?? '')
        segs.push({ text: replacement, type: 'added' })

        cursor = match.index + match[0].length
      }
    }

    if (cursor < source.length)
      segs.push({ text: source.slice(cursor), type: 'same' })
  }
  else {
    const search = findPattern.value
    let cursor = 0

    if (flagG.value) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const regex = new RegExp(escaped, `g${flagI.value ? 'i' : ''}`)
      let match2: RegExpExecArray | null = regex.exec(source)
      while (match2 !== null) {
        if (match2.index > cursor)
          segs.push({ text: source.slice(cursor, match2.index), type: 'same' })
        segs.push({ text: match2[0], type: 'removed' })
        segs.push({ text: replacePattern.value, type: 'added' })
        cursor = match2.index + match2[0].length
        match2 = regex.exec(source)
      }
    }
    else {
      const idx = flagI.value
        ? source.toLowerCase().indexOf(search.toLowerCase())
        : source.indexOf(search)
      if (idx !== -1) {
        if (idx > 0)
          segs.push({ text: source.slice(0, idx), type: 'same' })
        segs.push({ text: source.slice(idx, idx + search.length), type: 'removed' })
        segs.push({ text: replacePattern.value, type: 'added' })
        cursor = idx + search.length
      }
    }

    if (cursor < source.length)
      segs.push({ text: source.slice(cursor), type: 'same' })
  }

  return segs
})

const copied = shallowRef(false)
async function copyResult() {
  if (!result.value.output)
    return
  await navigator.clipboard.writeText(result.value.output)
  copied.value = true
  setTimeout(() => (copied.value = false), 1500)
}
</script>

<template>
  <div flex="~ col gap-4">
    <Panel :title="t('source_label')">
      <div p-5 flex="~ col gap-3">
        <TextareaInput
          v-model="sourceText"
          :placeholder="t('source_placeholder')"
          :rows="8"
        />
      </div>
    </Panel>

    <Panel :title="t('find_label')">
      <div p-5 flex="~ col gap-3">
        <TextInput
          :model-value="findPattern"
          :error="result.error !== null"
          :copyable="false"
          :placeholder="t('find_placeholder')"
          font-mono
          @update:model-value="findPattern = $event"
        />
        <Transition name="warn">
          <AlertTip v-if="result.error !== null" type="error">
            {{ t('invalid_regex') }}
          </AlertTip>
        </Transition>
        <TextInput
          :model-value="replacePattern"
          :copyable="false"
          :placeholder="t('replace_placeholder')"
          font-mono
          @update:model-value="replacePattern = $event"
        />
        <div flex="~ gap-2 wrap" items-center>
          <BaseButton
            icon="i-material-symbols-code"
            :active="useRegex"
            @click="useRegex = !useRegex"
          >
            {{ t('use_regex') }}
          </BaseButton>
          <BaseButton
            :active="flagG"
            @click="flagG = !flagG"
          >
            g · {{ t('flag_g') }}
          </BaseButton>
          <BaseButton
            :active="flagI"
            @click="flagI = !flagI"
          >
            i · {{ t('flag_i') }}
          </BaseButton>
          <BaseButton
            v-if="useRegex"
            :active="flagM"
            @click="flagM = !flagM"
          >
            m · {{ t('flag_m') }}
          </BaseButton>
          <BaseButton
            v-if="useRegex"
            :active="flagS"
            @click="flagS = !flagS"
          >
            s · {{ t('flag_s') }}
          </BaseButton>
        </div>
        <div text-sm op-60>
          <template v-if="result.error === null && findPattern">
            {{ result.count > 0 ? t('replace_count', String(result.count)) : t('no_match') }}
          </template>
        </div>
      </div>
    </Panel>

    <Panel v-if="diffSegments.length > 0" :title="t('diff_label')">
      <div p-5>
        <div
          border="~ c-border" text-sm leading-relaxed font-mono px-3 py-2 rounded-xl bg-c-input min-h-10 whitespace-pre-wrap break-all
        >
          <span
            v-for="(seg, i) in diffSegments"
            :key="i"
            :class="{
              'bg-red-400/20 text-red-500 dark:text-red-300 line-through': seg.type === 'removed',
              'bg-green-400/20 text-green-600 dark:text-green-300': seg.type === 'added',
            }"
          >{{ seg.text }}</span>
        </div>
      </div>
    </Panel>

    <Panel :title="t('result_label')">
      <div p-5 flex="~ col gap-3">
        <div
          border="~ c-border" text-sm leading-relaxed font-mono px-3 py-2 rounded-xl bg-c-input min-h-10 select-all whitespace-pre-wrap break-all
        >
          {{ result.output || '\u00A0' }}
        </div>
        <div flex justify-end>
          <BaseButton icon="i-carbon-copy" @click="copyResult">
            {{ copied ? t('copied') : 'Copy' }}
          </BaseButton>
        </div>
      </div>
    </Panel>
  </div>
</template>
