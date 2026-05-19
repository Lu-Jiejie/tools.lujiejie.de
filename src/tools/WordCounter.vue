<script lang="ts">
import { defineTool } from './index'

export const toolMeta = defineTool({
  id: 'word-counter',
  name: 'Text Statistics',
  nameZh: '文本统计',
  description: 'Count characters, words, lines, sentences, paragraphs, and estimate reading time.',
  descriptionZh: '统计字符数、单词数、行数、句子数、段落数，估算阅读时间。',
  category: 'text',
  keywords: ['word', 'count', 'character', 'reading', 'statistics', '字数', '统计', '文本'],
})
</script>

<!-- eslint-disable import/first -->
<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import Panel from '~/components/container/Panel.vue'
import { useI18n } from '~/composables/useI18n'

const { t } = useI18n({
  input_label: ['Input', '输入'],
  input_placeholder: ['Paste or type your text here...', '在此粘贴或输入文本...'],
  stats_label: ['Statistics', '统计结果'],
  chars_total: ['Characters (with spaces)', '字符数（含空格）'],
  chars_no_space: ['Characters (no spaces)', '字符数（不含空格）'],
  words: ['Words', '英文单词数'],
  chinese_chars: ['Chinese Characters', '中文字数'],
  lines: ['Lines', '行数'],
  sentences: ['Sentences', '句子数'],
  paragraphs: ['Paragraphs', '段落数'],
  read_time: ['Reading Time', '预计阅读时间'],
  read_time_unit: ['min read', '分钟阅读'],
  read_time_sec: ['< 1 min read', '不足 1 分钟'],
})

const text = shallowRef('')

const stats = computed(() => {
  const s = text.value

  const charsTotal = s.length
  const charsNoSpace = s.replace(/\s/g, '').length
  const words = s.trim() ? (s.match(/\b[a-z'-]+\b/gi) ?? []).length : 0
  const chineseChars = (s.match(/[\u4E00-\u9FFF\u3400-\u4DBF]/g) ?? []).length
  const lines = s ? s.split('\n').length : 0
  const sentences = s.trim() ? (s.match(/[^.!?。！？…]+[.!?。！？…]+/g) ?? []).length : 0
  const paragraphs = s.trim() ? s.split(/\n\s*\n/).filter(p => p.trim()).length : 0

  // 中文按 300 字/分钟，英文按 200 词/分钟，取较大值
  const totalReadUnits = chineseChars / 300 + words / 200
  const readMinutes = Math.round(totalReadUnits)

  return { charsTotal, charsNoSpace, words, chineseChars, lines, sentences, paragraphs, readMinutes, totalReadUnits }
})

const statItems = computed(() => [
  { key: 'chars_total', value: stats.value.charsTotal },
  { key: 'chars_no_space', value: stats.value.charsNoSpace },
  { key: 'words', value: stats.value.words },
  { key: 'chinese_chars', value: stats.value.chineseChars },
  { key: 'lines', value: stats.value.lines },
  { key: 'sentences', value: stats.value.sentences },
  { key: 'paragraphs', value: stats.value.paragraphs },
] as const)
</script>

<template>
  <div flex="~ col gap-4">
    <Panel :title="t('input_label')">
      <div p-5>
        <textarea
          v-model="text"
          :placeholder="t('input_placeholder')"
          rows="10"
          border="~ c-border focus:c-border-strong" text-sm font-mono px-3 py-2 outline-none rounded-xl bg-c-input w-full resize-y transition-colors
        />
      </div>
    </Panel>

    <Panel :title="t('stats_label')">
      <div p-5 flex="~ col gap-0">
        <div
          v-for="item in statItems"
          :key="item.key"
          py-2.5 flex items-center justify-between border-b="~ c-border last:border-none"
        >
          <span text-sm op-60>{{ t(item.key) }}</span>
          <span text-sm font-medium font-mono>{{ item.value.toLocaleString() }}</span>
        </div>
        <div py-2.5 flex items-center justify-between>
          <span text-sm op-60>{{ t('read_time') }}</span>
          <span text-sm font-medium font-mono>
            {{ stats.totalReadUnits === 0 ? '—' : stats.readMinutes === 0 ? t('read_time_sec') : `${stats.readMinutes} ${t('read_time_unit')}` }}
          </span>
        </div>
      </div>
    </Panel>
  </div>
</template>
