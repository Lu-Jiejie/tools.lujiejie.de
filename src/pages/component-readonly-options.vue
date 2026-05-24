<script setup lang="ts">
const codeSample = `const result = tools
  .filter(tool => tool.readonly)
  .map(tool => tool.name)

export default result`

const labelOptions = [
  {
    id: 'A',
    name: 'Muted Sans',
    note: '推荐。比当前浅，但仍然像正常字段标题。',
    labelClass: 'text-c-text-muted font-medium',
  },
  {
    id: 'B',
    name: 'Soft Mono',
    note: '更像工具索引 metadata，适合输出字段。',
    labelClass: 'text-c-text-muted font-mono tracking-wide',
  },
  {
    id: 'C',
    name: 'Faint Serif',
    note: '更 editorial，但表单感弱一点。',
    labelClass: 'text-c-text-muted font-serif',
  },
]

const codeEditorOptions = [
  {
    id: 'A',
    name: 'Header Pill',
    note: '推荐。只在 header 右侧加一个轻量 READ ONLY 标识。',
  },
  {
    id: 'B',
    name: 'Left Rail',
    note: '用左侧细色条标记状态，适合不想增加文字噪音。',
  },
  {
    id: 'C',
    name: 'Corner Stamp',
    note: '更明显，但会更“设计化”，适合输出/预览区域。',
  },
]

const textInputOptions = [
  {
    id: 'A',
    name: 'Inline Suffix',
    note: '推荐。右侧小 lock + readonly，信息清楚但不抢。',
  },
  {
    id: 'B',
    name: 'Top Caption',
    note: '把说明放在字段名旁边，输入框本体保持干净。',
  },
  {
    id: 'C',
    name: 'Quiet Watermark',
    note: '最低干扰，但可发现性弱一些。',
  },
]
</script>

<template>
  <main page-container max-w-5xl>
    <header mb-10 border="b c-border" pb-8>
      <div mb-5 flex="~ items-center gap-3" select-none>
        <span bg-c-border h-px w-10 />
        <span text-xs text-c-text-faint tracking-widest font-mono uppercase>
          component options
        </span>
        <span bg-c-border flex-1 h-px />
      </div>

      <h1 text="5xl md:7xl c-text" leading="[0.86]" font="serif normal" op-92>
        Readonly Marks<span text-c-accent>.</span>
      </h1>
      <p text-base text-c-text-muted leading-relaxed mt-5 max-w-2xl>
        LabelField 色阶、CodeEditor 只读状态、TextInput 只读提示的候选方案。
      </p>
    </header>

    <section mb-12>
      <div mb-5 flex="~ items-end gap-4" select-none>
        <span rounded-full bg-c-accent h-8 w-1.5 translate-y--0.5 />
        <div min-w-0>
          <h2 text="2xl md:3xl c-text" leading-none font="serif normal" op-90>
            LabelField
          </h2>
          <p text-sm text-c-text-muted mt-2>
            当前 label 过深时，可以把颜色降到 muted 层级，但不要回到 unreadable 的 faint。
          </p>
        </div>
      </div>

      <div grid="~ cols-1 md:cols-3 gap-3">
        <article
          v-for="option in labelOptions"
          :key="option.id"
          border="~ c-border"
          p-5 rounded-2xl bg-c-surface
        >
          <div mb-5 flex="~ items-center justify-between gap-3">
            <span text-xs text-c-text-faint font-mono>{{ option.id }}</span>
            <span text-xs text-c-text-muted>{{ option.name }}</span>
          </div>

          <div flex="~ col gap-2">
            <label :class="option.labelClass" text="[0.8125rem]" leading-snug select-none>
              Output hash
            </label>
            <div
              border="~ transparent"

              text-sm text-c-text-muted font-mono px-3.5 py-2.5 rounded-xl bg-c-input min-h-10
            >
              9f86d081884c7d65...
            </div>
          </div>

          <p text-sm text-c-text-muted leading-relaxed mt-5>
            {{ option.note }}
          </p>
        </article>
      </div>
    </section>

    <section mb-12>
      <div mb-5 flex="~ items-end gap-4" select-none>
        <span rounded-full bg-c-accent h-8 w-1.5 translate-y--0.5 />
        <div min-w-0>
          <h2 text="2xl md:3xl c-text" leading-none font="serif normal" op-90>
            CodeEditor readonly
          </h2>
          <p text-sm text-c-text-muted mt-2>
            只读状态建议出现在 editor header 或边界，不遮挡代码。
          </p>
        </div>
      </div>

      <div grid="~ cols-1 lg:cols-3 gap-3">
        <article
          v-for="option in codeEditorOptions"
          :key="option.id"
          border="~ c-border"
          rounded-2xl bg-c-surface overflow-hidden
        >
          <div
            border="b c-border"
            bg="[color-mix(in_srgb,var(--c-surface-raised)_42%,var(--c-surface))]"
            p="x-3 y-2.25"
            flex="~ items-center justify-between gap-3"
          >
            <div flex="~ items-center gap-2" min-w-0>
              <span
                :class="option.id === 'B' ? 'bg-c-border-strong' : 'bg-c-accent'"
                rounded-full op-75 shrink-0 h-3 w-0.75
              />
              <span text="[0.6875rem] c-text-muted" leading-none font-mono truncate>
                typescript
              </span>
            </div>

            <span
              v-if="option.id === 'A'"
              border="~ c-border"

              text="[0.625rem] c-text-muted"
              leading-none font-mono px-2 py-1 rounded-full bg-c-surface
            >
              READ ONLY
            </span>
            <span
              v-else
              text="[0.625rem] c-text-faint"
              leading-none font-mono
            >
              5 lines
            </span>
          </div>

          <div bg-c-surface min-h-54 relative overflow-hidden>
            <div
              v-if="option.id === 'B'"
              bg-c-accent op-60 h-full w-1 left-0 top-0 absolute
            />
            <div
              v-if="option.id === 'C'"

              border="~ c-border"

              text="[0.625rem] c-text-muted"
              leading-none font-mono px-2 py-1 rounded-lg bg-c-surface right-3 top-3 absolute
            >
              LOCKED
            </div>

            <pre p="x-4 y-4" text-sm text-c-text-muted leading-relaxed font-mono m-0 whitespace-pre-wrap>{{ codeSample }}</pre>
          </div>

          <div border="t c-border" p-4>
            <div flex="~ items-center justify-between gap-3">
              <span text-xs text-c-text-faint font-mono>{{ option.id }}</span>
              <span text-sm text-c-text>{{ option.name }}</span>
            </div>
            <p text-sm text-c-text-muted leading-relaxed mt-2>
              {{ option.note }}
            </p>
          </div>
        </article>
      </div>
    </section>

    <section>
      <div mb-5 flex="~ items-end gap-4" select-none>
        <span rounded-full bg-c-accent h-8 w-1.5 translate-y--0.5 />
        <div min-w-0>
          <h2 text="2xl md:3xl c-text" leading-none font="serif normal" op-90>
            TextInput readonly
          </h2>
          <p text-sm text-c-text-muted mt-2>
            输入框只读标识需要比 disabled 更轻，避免用户误解为不可复制。
          </p>
        </div>
      </div>

      <div grid="~ cols-1 md:cols-3 gap-3">
        <article
          v-for="option in textInputOptions"
          :key="option.id"
          border="~ c-border"
          p-5 rounded-2xl bg-c-surface
        >
          <div mb-5 flex="~ items-center justify-between gap-3">
            <span text-xs text-c-text-faint font-mono>{{ option.id }}</span>
            <span text-xs text-c-text-muted>{{ option.name }}</span>
          </div>

          <div flex="~ col gap-2">
            <div flex="~ items-center justify-between gap-3">
              <label text="[0.8125rem] c-text-muted" leading-snug font-medium select-none>
                Generated value
              </label>
              <span
                v-if="option.id === 'B'"
                text="[0.625rem] c-text-faint"
                leading-none font-mono
              >
                read only
              </span>
            </div>

            <div relative>
              <div
                border="~ transparent"

                p="l-3.5 r-3.5 y-2.5"

                text-sm text-c-text-muted font-mono rounded-xl bg-c-input-readonly min-h-10 overflow-hidden
              >
                01HV9P8BQ9Z7XK4H6M2TQY3LNR
              </div>

              <span
                v-if="option.id === 'A'"

                flex="~ items-center gap-1"

                text="[0.625rem] c-text-muted"
                leading-none font-mono px-2 py-1 rounded-lg bg-c-surface right-2 top-1.75 absolute
              >
                <span i-carbon-locked text-xs />
                readonly
              </span>

              <span
                v-if="option.id === 'C'"

                text="[0.625rem] c-text-faint"
                leading-none font-mono right-3 top-2.75 absolute
              >
                READ ONLY
              </span>
            </div>
          </div>

          <p text-sm text-c-text-muted leading-relaxed mt-5>
            {{ option.note }}
          </p>
        </article>
      </div>
    </section>
  </main>
</template>
