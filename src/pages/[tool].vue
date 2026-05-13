<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from '~/composables/useI18n'
import { useTools } from '~/composables/useTools'
import { getToolComponent } from '~/tools'

const route = useRoute()
const router = useRouter()
const { findTool, isFavorite, toggleFavorite } = useTools()
const { t } = useI18n()

const tool = computed(() => findTool(route.params.tool as string))

if (!tool.value) {
  router.replace('/')
}
</script>

<template>
  <div v-if="tool" page-container>
    <!-- 工具头部 -->
    <div mb-8 flex="~ gap-4" items-start>
      <div flex="~ col gap-1.5" min-w-0>
        <div flex="~ wrap gap-3" items-center>
          <h1 text-xl tracking-tight font-bold op-90 select-none>
            {{ tool.name }}
          </h1>

          <span border="~ c-border" text-xs font-medium ml-1 px-2 py-0.5 rounded-md bg-c-raised op-30 inline-flex select-none items-center>{{ t(`category.${tool.category}`) }}</span>

          <button
            :class="isFavorite(tool.id) ? 'btn-favorite-active' : 'btn-favorite'"
            title="Favorite"
            @click="toggleFavorite(tool.id)"
          >
            <div :class="isFavorite(tool.id) ? 'i-carbon-star-filled' : 'i-carbon-star'" text-xl />
          </button>
        </div>
        <p text-sm leading-relaxed op-60>
          {{ tool.description }}
        </p>
      </div>
    </div>

    <!-- 工具内容区 -->
    <component :is="getToolComponent(tool.id)" />
  </div>
</template>
