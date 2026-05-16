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
import Panel from '~/components/Panel.vue'
import { useI18n } from '~/composables/useI18n'

const { t } = useI18n({
  placeholder_left: ['Paste original text here...', '在此粘贴原始文本...'],
  placeholder_right: ['Paste modified text here...', '在此粘贴修改后的文本...'],
})

const leftText = shallowRef('the quick brown fox\njumped over the lazy dog\nhello world\nthis line stays\nremove me')
const rightText = shallowRef('the quick red fox\njumped over the sleepy dog\nhello world\nthis line stays\nnew line here')

// Myers diff algorithm
type DiffOp = 'equal' | 'delete' | 'insert'
interface DiffLine {
  type: DiffOp
  text: string
  lineNo: number | null
}

function myersDiff(a: string[], b: string[]): DiffOp[] {
  const n = a.length
  const m = b.length
  const max = n + m
  const v = new Int32Array(2 * max + 1)
  const trace: Int32Array[] = []

  for (let d = 0; d <= max; d++) {
    trace.push(v.slice())
    for (let k = -d; k <= d; k += 2) {
      let x: number
      if (k === -d || (k !== d && v[k - 1 + max] < v[k + 1 + max]))
        x = v[k + 1 + max]
      else
        x = v[k - 1 + max] + 1

      let y = x - k
      while (x < n && y < m && a[x] === b[y]) {
        x++
        y++
      }
      v[k + max] = x
      if (x >= n && y >= m) {
        return backtrack(trace, a, b, max)
      }
    }
  }
  return []
}

function backtrack(trace: Int32Array[], a: string[], b: string[], max: number): DiffOp[] {
  const ops: DiffOp[] = []
  let x = a.length
  let y = b.length

  for (let d = trace.length - 1; d > 0; d--) {
    const v = trace[d - 1]
    const k = x - y
    let prevK: number
    if (k === -d || (k !== d && v[k - 1 + max] < v[k + 1 + max]))
      prevK = k + 1
    else
      prevK = k - 1

    const prevX = v[prevK + max]
    const prevY = prevX - prevK

    while (x > prevX && y > prevY) {
      ops.push('equal')
      x--
      y--
    }
    if (x > prevX) {
      ops.push('delete')
      x--
    }
    else if (y > prevY) {
      ops.push('insert')
      y--
    }
  }

  while (x > 0 && y > 0 && a[x - 1] === b[y - 1]) {
    ops.push('equal')
    x--
    y--
  }

  ops.reverse()
  return ops
}

interface DiffRow {
  left: DiffLine | null
  right: DiffLine | null
}

const diffRows = computed<DiffRow[]>(() => {
  const aLines = leftText.value.split('\n')
  const bLines = rightText.value.split('\n')
  const ops = myersDiff(aLines, bLines)

  const rows: DiffRow[] = []
  let ai = 0
  let bi = 0

  for (const op of ops) {
    if (op === 'equal') {
      rows.push({
        left: { type: 'equal', text: aLines[ai], lineNo: ai + 1 },
        right: { type: 'equal', text: bLines[bi], lineNo: bi + 1 },
      })
      ai++
      bi++
    }
    else if (op === 'delete') {
      rows.push({
        left: { type: 'delete', text: aLines[ai], lineNo: ai + 1 },
        right: null,
      })
      ai++
    }
    else {
      rows.push({
        left: null,
        right: { type: 'insert', text: bLines[bi], lineNo: bi + 1 },
      })
      bi++
    }
  }

  return rows
})
</script>

<template>
  <div flex="~ col gap-4">
    <Panel>
      <div flex="~ gap-4" p-3>
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

    <Panel title="Diff">
      <div class="diff-container" max-h-500px overflow-auto>
        <table text-sm font-mono w-full border-collapse>
          <tbody>
            <tr v-for="(row, i) in diffRows" :key="i" class="diff-row">
              <td
                class="diff-line-no"
                :class="{ 'diff-delete-bg': row.left?.type === 'delete' }"
              >
                {{ row.left?.lineNo ?? '' }}
              </td>
              <td
                class="diff-content"
                :class="{
                  'diff-delete-bg': row.left?.type === 'delete',
                  'diff-empty': !row.left,
                }"
              >
                <span v-if="row.left">{{ row.left.text }}</span>
              </td>
              <td class="diff-divider" />
              <td
                class="diff-line-no"
                :class="{ 'diff-insert-bg': row.right?.type === 'insert' }"
              >
                {{ row.right?.lineNo ?? '' }}
              </td>
              <td
                class="diff-content"
                :class="{
                  'diff-insert-bg': row.right?.type === 'insert',
                  'diff-empty': !row.right,
                }"
              >
                <span v-if="row.right">{{ row.right.text }}</span>
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
  scrollbar-width: thin;
}

.diff-row {
  line-height: 1.6;
}

.diff-line-no {
  width: 40px;
  min-width: 40px;
  padding: 0 8px;
  text-align: right;
  color: rgba(128, 128, 128, 0.6);
  user-select: none;
  vertical-align: top;
  white-space: nowrap;
}

.diff-content {
  padding: 0 12px;
  white-space: pre;
  vertical-align: top;
  width: 50%;
}

.diff-divider {
  width: 1px;
  min-width: 1px;
  background: var(--c-border, rgba(128, 128, 128, 0.2));
}

.diff-delete-bg {
  background-color: rgba(239, 68, 68, 0.12);
}

.diff-insert-bg {
  background-color: rgba(34, 197, 94, 0.12);
}

.diff-empty {
  background-color: rgba(128, 128, 128, 0.04);
}

:root.dark .diff-delete-bg {
  background-color: rgba(239, 68, 68, 0.15);
}

:root.dark .diff-insert-bg {
  background-color: rgba(34, 197, 94, 0.15);
}
</style>
