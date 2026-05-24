<script setup lang="ts">
import Panel from '~/components/container/Panel.vue'

const sampleFields = [
  ['Input', 'https://tools.lujiejie.de/color-converter'],
  ['Format', 'HEX / RGB / HSL'],
  ['Status', 'Ready'],
]

const sampleOutputs = [
  ['HEX', '#14b8a6'],
  ['RGB', '20, 184, 166'],
  ['HSL', '174deg 80% 40%'],
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
        Panel Titles<span text-c-accent>.</span>
      </h1>
      <p text-base text-c-text-muted leading-relaxed mt-5 max-w-2xl>
        对比现有 Panel title、短线 serif title，以及更接近页面 section heading 的 header 方案。
      </p>
    </header>

    <section mb-12>
      <div mb-5 flex="~ items-end gap-4" select-none>
        <span rounded-full bg-c-accent h-8 w-1.5 translate-y--0.5 />
        <div min-w-0>
          <h2 text="2xl md:3xl c-text" leading-none font="serif normal" op-90>
            Side by Side
          </h2>
          <p text-sm text-c-text-muted leading-relaxed mt-2>
            内容保持一致，方便比较标题气质、视觉重量，以及 panel 与页面 section 的边界感。
          </p>
        </div>
      </div>

      <div grid="~ cols-1 lg:cols-3 gap-5">
        <div>
          <div mb-3 flex="~ items-center justify-between gap-3" select-none>
            <span text-xs text-c-text-faint tracking-widest font-mono uppercase>
              current
            </span>
            <span bg-c-border flex-1 h-px />
          </div>

          <Panel title="Input">
            <div p-5 flex="~ col gap-3">
              <div
                v-for="[label, value] in sampleFields"
                :key="label"
                flex="~ items-center justify-between gap-4"
                border="b c-border"
                pb-3 last:pb-0 last:border-b-0
              >
                <span text-xs text-c-text-muted font-mono>{{ label }}</span>
                <span text-sm text-c-text truncate>{{ value }}</span>
              </div>
            </div>
          </Panel>
        </div>

        <div>
          <div mb-3 flex="~ items-center justify-between gap-3" select-none>
            <span text-xs text-c-text-faint tracking-widest font-mono uppercase>
              proposed a
            </span>
            <span bg-c-border flex-1 h-px />
          </div>

          <section border="~ c-border" rounded-2xl bg-c-surface overflow-hidden>
            <header p="x-5 t-5 b-4" select-none>
              <div flex="~ items-end gap-4">
                <span rounded-full bg-c-accent h-7 w-1.5 translate-y--0.5 />
                <div flex-1 min-w-0>
                  <h2 text="2xl c-text" leading-none font="serif normal" op-90>
                    Input
                  </h2>
                </div>
              </div>
            </header>

            <div border="t c-border" p-5 flex="~ col gap-3">
              <div
                v-for="[label, value] in sampleFields"
                :key="label"
                flex="~ items-center justify-between gap-4"
                border="b c-border"
                pb-3 last:pb-0 last:border-b-0
              >
                <span text-xs text-c-text-muted font-mono>{{ label }}</span>
                <span text-sm text-c-text truncate>{{ value }}</span>
              </div>
            </div>
          </section>
        </div>

        <div>
          <div mb-3 flex="~ items-center justify-between gap-3" select-none>
            <span text-xs text-c-text-faint tracking-widest font-mono uppercase>
              proposed b
            </span>
            <span bg-c-border flex-1 h-px />
          </div>

          <div mb-5 flex="~ items-end gap-4" select-none>
            <span rounded-full bg-c-accent h-8 w-1.5 translate-y--0.5 />
            <div min-w-0>
              <h2 text="2xl md:3xl c-text" leading-none font="serif normal" op-90>
                Input
              </h2>
            </div>
          </div>

          <Panel>
            <div p-5 flex="~ col gap-3">
              <div
                v-for="[label, value] in sampleFields"
                :key="label"
                flex="~ items-center justify-between gap-4"
                border="b c-border"
                pb-3 last:pb-0 last:border-b-0
              >
                <span text-xs text-c-text-muted font-mono>{{ label }}</span>
                <span text-sm text-c-text truncate>{{ value }}</span>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </section>

    <section>
      <div mb-5 flex="~ items-end gap-4" select-none>
        <span rounded-full bg-c-accent h-8 w-1.5 translate-y--0.5 />
        <div min-w-0>
          <h2 text="2xl md:3xl c-text" leading-none font="serif normal" op-90>
            In Context
          </h2>
          <p text-sm text-c-text-muted leading-relaxed mt-2>
            多个 panel 连续出现时，方案 B 会把标题层级交给 panel 外部，Panel 本身只保留容器边界。
          </p>
        </div>
      </div>

      <div grid="~ cols-1 lg:cols-3 gap-5">
        <div flex="~ col gap-4">
          <div flex="~ items-center justify-between gap-3" select-none>
            <span text-xs text-c-text-faint tracking-widest font-mono uppercase>
              current
            </span>
            <span bg-c-border flex-1 h-px />
          </div>

          <Panel title="Input">
            <div text-sm text-c-text-muted leading-relaxed p-5>
              Convert a color value between common formats.
            </div>
          </Panel>

          <Panel title="Output">
            <div p-5 flex="~ col gap-3">
              <div
                v-for="[label, value] in sampleOutputs"
                :key="label"
                flex="~ items-center justify-between gap-4"
              >
                <span text-xs text-c-text-muted font-mono>{{ label }}</span>
                <span text-sm text-c-text font-mono>{{ value }}</span>
              </div>
            </div>
          </Panel>
        </div>

        <div flex="~ col gap-4">
          <div flex="~ items-center justify-between gap-3" select-none>
            <span text-xs text-c-text-faint tracking-widest font-mono uppercase>
              proposed a
            </span>
            <span bg-c-border flex-1 h-px />
          </div>

          <section
            v-for="title in ['Input', 'Output']"
            :key="title"
            border="~ c-border"
            rounded-2xl bg-c-surface overflow-hidden
          >
            <header p="x-5 t-5 b-4" select-none>
              <div flex="~ items-end gap-4">
                <span rounded-full bg-c-accent h-7 w-1.5 translate-y--0.5 />
                <h2 text="2xl c-text" leading-none font="serif normal" op-90>
                  {{ title }}
                </h2>
              </div>
            </header>

            <div
              v-if="title === 'Input'"
              border="t c-border"
              text-sm text-c-text-muted leading-relaxed p-5
            >
              Convert a color value between common formats.
            </div>

            <div v-else border="t c-border" p-5 flex="~ col gap-3">
              <div
                v-for="[label, value] in sampleOutputs"
                :key="label"
                flex="~ items-center justify-between gap-4"
              >
                <span text-xs text-c-text-muted font-mono>{{ label }}</span>
                <span text-sm text-c-text font-mono>{{ value }}</span>
              </div>
            </div>
          </section>
        </div>

        <div flex="~ col gap-4">
          <div flex="~ items-center justify-between gap-3" select-none>
            <span text-xs text-c-text-faint tracking-widest font-mono uppercase>
              proposed b
            </span>
            <span bg-c-border flex-1 h-px />
          </div>

          <div
            v-for="title in ['Input', 'Output']"
            :key="title"
          >
            <div mb-5 flex="~ items-end gap-4" select-none>
              <span rounded-full bg-c-accent h-8 w-1.5 translate-y--0.5 />
              <h2 text="2xl md:3xl c-text" leading-none font="serif normal" op-90>
                {{ title }}
              </h2>
            </div>

            <Panel>
              <div
                v-if="title === 'Input'"
                text-sm text-c-text-muted leading-relaxed p-5
              >
                Convert a color value between common formats.
              </div>

              <div v-else p-5 flex="~ col gap-3">
                <div
                  v-for="[label, value] in sampleOutputs"
                  :key="label"
                  flex="~ items-center justify-between gap-4"
                >
                  <span text-xs text-c-text-muted font-mono>{{ label }}</span>
                  <span text-sm text-c-text font-mono>{{ value }}</span>
                </div>
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>
