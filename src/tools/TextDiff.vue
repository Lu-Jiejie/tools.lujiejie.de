<script lang="ts">
import { defineTool } from './index'

export const toolMeta = defineTool({
  id: 'text-diff',
  name: 'Text Diff',
  nameZh: '文本对比',
  description: 'Side-by-side text diff without external dependencies.',
  descriptionZh: '左右并排文本对比，无外部依赖。',
  category: 'text',
  keywords: ['diff', 'compare', 'difference', '对比', '差异', '比较'],
})
</script>

<!-- eslint-disable import/first -->
<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import Panel from '~/components/container/Panel.vue'
import { useI18n } from '~/composables/useI18n'

const { t } = useI18n({
  input: ['Input', '输入'],
  diff: ['Diff', '差异'],
  original: ['Original', '原文'],
  modified: ['Modified', '修改后'],
  added: ['added', '新增'],
  deleted: ['deleted', '删除'],
  changed: ['changed', '修改'],
  placeholder_left: ['Paste original text here...', '在此粘贴原始文本...'],
  placeholder_right: ['Paste modified text here...', '在此粘贴修改后的文本...'],
})

const leftText = shallowRef('the quick brown fox\njumped over the lazy dog\nhello world\nthis line stays\nremove me')
const rightText = shallowRef('the quick red fox\njumped over the sleepy dog\nhello world\nthis line stays\nnew line here')

// LCS line diff. This favors predictable UI output over a more compact but harder-to-maintain edit script.
type DiffOp = 'equal' | 'delete' | 'insert'
type DiffLineType = DiffOp | 'modify'

interface InlineSegment {
  type: 'equal' | 'delete' | 'insert'
  text: string
}

interface DiffLine {
  type: DiffLineType
  text: string
  lineNo: number | null
  segments?: InlineSegment[]
}

function tokenizeInlineText(text: string): string[] {
  return text.match(/\p{L}[\p{L}\p{N}_]*|\p{N}+|\s+|[^\p{L}\p{N}\s]+/gu) ?? []
}

function myersDiff(a: string[], b: string[]): DiffOp[] {
  const n = a.length
  const m = b.length
  const width = m + 1
  const dp = Array.from({ length: n + 1 }, () => new Uint32Array(width))

  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j]
        ? dp[i + 1][j + 1] + 1
        : Math.max(dp[i + 1][j], dp[i][j + 1])
    }
  }

  const ops: DiffOp[] = []
  let i = 0
  let j = 0
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      ops.push('equal')
      i++
      j++
    }
    else if (dp[i + 1][j] >= dp[i][j + 1]) {
      ops.push('delete')
      i++
    }
    else {
      ops.push('insert')
      j++
    }
  }
  while (i < n) {
    ops.push('delete')
    i++
  }
  while (j < m) {
    ops.push('insert')
    j++
  }

  return ops
}

interface DiffRow {
  left: DiffLine | null
  right: DiffLine | null
}

function mergeSegments(segments: InlineSegment[]): InlineSegment[] {
  const merged: InlineSegment[] = []
  for (const segment of segments) {
    const last = merged[merged.length - 1]
    if (last && last.type === segment.type) {
      last.text += segment.text
    }
    else {
      merged.push({ ...segment })
    }
  }
  return merged
}

function buildInlineSegments(left: string, right: string): { left: InlineSegment[], right: InlineSegment[] } {
  const leftTokens = tokenizeInlineText(left)
  const rightTokens = tokenizeInlineText(right)

  let prefix = 0
  while (prefix < leftTokens.length && prefix < rightTokens.length && leftTokens[prefix] === rightTokens[prefix])
    prefix++

  let suffix = 0
  while (
    suffix < leftTokens.length - prefix
    && suffix < rightTokens.length - prefix
    && leftTokens[leftTokens.length - 1 - suffix] === rightTokens[rightTokens.length - 1 - suffix]
  ) {
    suffix++
  }

  const leftMiddle = leftTokens.slice(prefix, leftTokens.length - suffix)
  const rightMiddle = rightTokens.slice(prefix, rightTokens.length - suffix)
  const prefixText = leftTokens.slice(0, prefix).join('')
  const suffixText = suffix > 0 ? leftTokens.slice(leftTokens.length - suffix).join('') : ''

  const leftSegments: InlineSegment[] = []
  const rightSegments: InlineSegment[] = []
  if (prefixText) {
    leftSegments.push({ type: 'equal', text: prefixText })
    rightSegments.push({ type: 'equal', text: prefixText })
  }

  if (leftMiddle.length * rightMiddle.length > 20000) {
    if (leftMiddle.length > 0)
      leftSegments.push({ type: 'delete', text: leftMiddle.join('') })
    if (rightMiddle.length > 0)
      rightSegments.push({ type: 'insert', text: rightMiddle.join('') })
  }
  else {
    const width = rightMiddle.length + 1
    const dp = Array.from({ length: leftMiddle.length + 1 }, () => new Uint16Array(width))
    for (let i = leftMiddle.length - 1; i >= 0; i--) {
      for (let j = rightMiddle.length - 1; j >= 0; j--) {
        dp[i][j] = leftMiddle[i] === rightMiddle[j]
          ? dp[i + 1][j + 1] + 1
          : Math.max(dp[i + 1][j], dp[i][j + 1])
      }
    }

    let i = 0
    let j = 0
    while (i < leftMiddle.length || j < rightMiddle.length) {
      if (i < leftMiddle.length && j < rightMiddle.length && leftMiddle[i] === rightMiddle[j]) {
        leftSegments.push({ type: 'equal', text: leftMiddle[i] })
        rightSegments.push({ type: 'equal', text: rightMiddle[j] })
        i++
        j++
      }
      else if (j < rightMiddle.length && (i === leftMiddle.length || dp[i][j + 1] >= dp[i + 1][j])) {
        rightSegments.push({ type: 'insert', text: rightMiddle[j] })
        j++
      }
      else if (i < leftMiddle.length) {
        leftSegments.push({ type: 'delete', text: leftMiddle[i] })
        i++
      }
    }
  }

  if (suffixText) {
    leftSegments.push({ type: 'equal', text: suffixText })
    rightSegments.push({ type: 'equal', text: suffixText })
  }

  return {
    left: mergeSegments(leftSegments),
    right: mergeSegments(rightSegments),
  }
}

function createModifiedRow(leftText: string, rightText: string, leftLineNo: number, rightLineNo: number): DiffRow {
  const segments = buildInlineSegments(leftText, rightText)
  return {
    left: { type: 'modify', text: leftText, lineNo: leftLineNo, segments: segments.left },
    right: { type: 'modify', text: rightText, lineNo: rightLineNo, segments: segments.right },
  }
}

function lineSimilarity(left: string, right: string): number {
  if (left === right)
    return 1

  const leftTokens = tokenizeInlineText(left).filter(token => !/^\s+$/.test(token))
  const rightTokens = tokenizeInlineText(right).filter(token => !/^\s+$/.test(token))
  if (leftTokens.length === 0 || rightTokens.length === 0)
    return 0

  const width = rightTokens.length + 1
  const dp = Array.from({ length: leftTokens.length + 1 }, () => new Uint16Array(width))
  for (let i = leftTokens.length - 1; i >= 0; i--) {
    for (let j = rightTokens.length - 1; j >= 0; j--) {
      dp[i][j] = leftTokens[i] === rightTokens[j]
        ? dp[i + 1][j + 1] + 1
        : Math.max(dp[i + 1][j], dp[i][j + 1])
    }
  }

  return (dp[0][0] * 2) / (leftTokens.length + rightTokens.length)
}

function shouldTreatAsChanged(left: string, right: string): boolean {
  return lineSimilarity(left, right) >= 0.45
}

const diffRows = computed<DiffRow[]>(() => {
  const aLines = leftText.value.split('\n')
  const bLines = rightText.value.split('\n')
  const ops = myersDiff(aLines, bLines)

  const rows: DiffRow[] = []
  let ai = 0
  let bi = 0

  for (let i = 0; i < ops.length; i++) {
    const op = ops[i]
    if (op === 'equal') {
      rows.push({
        left: { type: 'equal', text: aLines[ai], lineNo: ai + 1 },
        right: { type: 'equal', text: bLines[bi], lineNo: bi + 1 },
      })
      ai++
      bi++
    }
    else {
      const deletes: DiffLine[] = []
      const inserts: DiffLine[] = []

      while (i < ops.length && ops[i] !== 'equal') {
        if (ops[i] === 'delete') {
          deletes.push({ type: 'delete', text: aLines[ai], lineNo: ai + 1 })
          ai++
        }
        else {
          inserts.push({ type: 'insert', text: bLines[bi], lineNo: bi + 1 })
          bi++
        }
        i++
      }
      i--

      const count = Math.max(deletes.length, inserts.length)
      for (let j = 0; j < count; j++) {
        const deleted = deletes[j]
        const inserted = inserts[j]
        if (deleted && inserted && shouldTreatAsChanged(deleted.text, inserted.text)) {
          rows.push(createModifiedRow(deleted.text, inserted.text, deleted.lineNo ?? 0, inserted.lineNo ?? 0))
        }
        else if (deleted && inserted) {
          rows.push({
            left: deleted,
            right: null,
          })
          rows.push({
            left: null,
            right: inserted,
          })
        }
        else if (deleted) {
          rows.push({
            left: deleted,
            right: null,
          })
        }
        else if (inserted) {
          rows.push({
            left: null,
            right: inserted,
          })
        }
      }
    }
  }

  return rows
})

const diffStats = computed(() => {
  return diffRows.value.reduce(
    (stats, row) => {
      if (row.left?.type === 'delete')
        stats.deleted++
      else if (row.right?.type === 'insert')
        stats.added++
      else if (row.left?.type === 'modify' || row.right?.type === 'modify')
        stats.changed++
      return stats
    },
    { added: 0, deleted: 0, changed: 0 },
  )
})

function marker(line: DiffLine | null, side: 'left' | 'right'): string {
  if (!line)
    return ''
  if (line.type === 'delete')
    return '-'
  if (line.type === 'insert')
    return '+'
  if (line.type === 'modify')
    return side === 'left' ? '-' : '+'
  return ''
}
</script>

<template>
  <div flex="~ col gap-4">
    <Panel :title="t('input')">
      <div flex="~ col gap-4 md:row" p-3>
        <textarea
          v-model="leftText"
          :placeholder="t('placeholder_left')"
          rows="8"
          border="~ c-border focus:c-border-strong" text-sm font-mono px-3 py-2 outline-none rounded-xl bg-c-input flex-1 min-w-0 resize-y transition-colors
        />
        <textarea
          v-model="rightText"
          :placeholder="t('placeholder_right')"
          rows="8"
          border="~ c-border focus:c-border-strong" text-sm font-mono px-3 py-2 outline-none rounded-xl bg-c-input flex-1 min-w-0 resize-y transition-colors
        />
      </div>
    </Panel>

    <Panel :title="t('diff')">
      <div flex="~ gap-2 wrap" border="b c-border" text-xs px-4 py-3>
        <span px-2 py-1 rounded-md bg="[rgba(34,197,94,0.12)]" text="[rgb(22,163,74)]">
          +{{ diffStats.added }} {{ t('added') }}
        </span>
        <span px-2 py-1 rounded-md bg="[rgba(239,68,68,0.12)]" text="[rgb(220,38,38)]">
          -{{ diffStats.deleted }} {{ t('deleted') }}
        </span>
        <span px-2 py-1 rounded-md bg="[rgba(245,158,11,0.14)]" text="[rgb(217,119,6)]">
          ~{{ diffStats.changed }} {{ t('changed') }}
        </span>
      </div>
      <div max-h-500px overflow-auto class="diff-container">
        <table text-sm font-mono w-full border-collapse class="diff-table">
          <thead>
            <tr>
              <th class="diff-heading" colspan="2">
                {{ t('original') }}
              </th>
              <th class="diff-separator" />
              <th class="diff-heading" colspan="2">
                {{ t('modified') }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, i) in diffRows" :key="i" class="diff-row">
              <td
                class="diff-gutter"
                :class="{ 'diff-delete-bg': row.left?.type === 'delete' || row.left?.type === 'modify' }"
              >
                <span class="diff-line-no">{{ row.left?.lineNo ?? '' }}</span>
                <span class="diff-marker">{{ marker(row.left, 'left') }}</span>
              </td>
              <td
                class="diff-content"
                :class="{
                  'diff-delete-bg': row.left?.type === 'delete' || row.left?.type === 'modify',
                  'diff-empty': !row.left,
                }"
              >
                <template v-if="row.left">
                  <span
                    v-for="(segment, segmentIndex) in row.left.segments ?? [{ type: 'equal' as const, text: row.left.text }]"
                    :key="segmentIndex"
                    :class="{
                      'diff-inline-delete': segment.type === 'delete',
                      'diff-inline-insert': segment.type === 'insert',
                    }"
                  >{{ segment.text }}</span>
                </template>
              </td>
              <td class="diff-separator" />
              <td
                class="diff-gutter"
                :class="{ 'diff-insert-bg': row.right?.type === 'insert' || row.right?.type === 'modify' }"
              >
                <span class="diff-line-no">{{ row.right?.lineNo ?? '' }}</span>
                <span class="diff-marker">{{ marker(row.right, 'right') }}</span>
              </td>
              <td
                class="diff-content"
                :class="{
                  'diff-insert-bg': row.right?.type === 'insert' || row.right?.type === 'modify',
                  'diff-empty': !row.right,
                }"
              >
                <template v-if="row.right">
                  <span
                    v-for="(segment, segmentIndex) in row.right.segments ?? [{ type: 'equal' as const, text: row.right.text }]"
                    :key="segmentIndex"
                    :class="{
                      'diff-inline-delete': segment.type === 'delete',
                      'diff-inline-insert': segment.type === 'insert',
                    }"
                  >{{ segment.text }}</span>
                </template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Panel>
  </div>
</template>

<style scoped>
.diff-container {
  background: linear-gradient(to right, rgba(0, 0, 0, 0.025), transparent 12px), var(--c-surface);
}
.diff-table {
  min-width: 100%;
  width: max-content;
  table-layout: auto;
}
.diff-heading {
  position: sticky;
  top: 0;
  z-index: 1;
  padding: 10px 12px;
  background: var(--c-surface-raised);
  color: color-mix(in srgb, currentColor 70%, transparent);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-align: left;
  text-transform: uppercase;
}
.diff-row {
  line-height: 1.55;
}
.diff-gutter {
  display: grid;
  grid-template-columns: minmax(22px, 1fr) 14px;
  width: 46px;
  min-width: 46px;
  padding: 0 4px;
  color: rgba(128, 128, 128, 0.62);
  vertical-align: top;
  user-select: none;
  white-space: nowrap;
}
.diff-line-no {
  text-align: right;
}
.diff-marker {
  color: rgba(128, 128, 128, 0.78);
  text-align: center;
}
.diff-content {
  min-width: 360px;
  padding: 0 12px;
  overflow-wrap: normal;
  white-space: pre;
  vertical-align: top;
}
.diff-separator {
  width: 1px;
  min-width: 1px;
  background: var(--c-border);
}
.diff-delete-bg {
  background-color: rgba(239, 68, 68, 0.105);
}
.diff-insert-bg {
  background-color: rgba(34, 197, 94, 0.105);
}
.diff-empty {
  background-image: repeating-linear-gradient(
    -45deg,
    rgba(128, 128, 128, 0.08) 0,
    rgba(128, 128, 128, 0.08) 6px,
    transparent 6px,
    transparent 12px
  );
}
.diff-inline-delete {
  border-radius: 3px;
  background-color: rgba(239, 68, 68, 0.26);
}
.diff-inline-insert {
  border-radius: 3px;
  background-color: rgba(34, 197, 94, 0.26);
}
:root.dark .diff-delete-bg {
  background-color: rgba(239, 68, 68, 0.16);
}
:root.dark .diff-insert-bg {
  background-color: rgba(34, 197, 94, 0.16);
}
:root.dark .diff-inline-delete {
  background-color: rgba(248, 113, 113, 0.32);
}
:root.dark .diff-inline-insert {
  background-color: rgba(74, 222, 128, 0.32);
}
</style>
