<script lang="ts">
import { defineTool } from './index'

export const toolMeta = defineTool({
  id: 'url-parser',
  name: 'URL Parser',
  nameZh: 'URL 解析',
  description: 'Parse URLs into components: protocol, host, port, path, query parameters, and hash.',
  descriptionZh: '将 URL 解析为各组成部分：协议、主机、端口、路径、查询参数和哈希。',
  category: 'dev',
  keywords: ['url', 'parse', 'query', 'parameter', 'link', 'uri'],
})
</script>

<!-- eslint-disable import/first -->
<script setup lang="ts">
import { computed, ref } from 'vue'
import AlertTip from '~/components/AlertTip.vue'
import Panel from '~/components/Panel.vue'
import TextInput from '~/components/TextInput.vue'
import { useI18n } from '~/composables/useI18n'

const { t } = useI18n({
  input: ['URL Input', 'URL 输入'],
  placeholder: ['e.g. https://example.com:8080/path?key=value#hash', '例如 https://example.com:8080/path?key=value#hash'],
  result: ['Parsed Result', '解析结果'],
  protocol: ['Protocol', '协议'],
  host: ['Host', '主机'],
  port: ['Port', '端口'],
  pathname: ['Path', '路径'],
  search: ['Query String', '查询字符串'],
  hash: ['Hash', '哈希'],
  origin: ['Origin', '源'],
  username: ['Username', '用户名'],
  password: ['Password', '密码'],
  params: ['Query Parameters', '查询参数'],
  key: ['Key', '键'],
  value: ['Value', '值'],
  empty: ['(empty)', '(空)'],
  invalid: ['Invalid URL', '无效的 URL'],
  add_param: ['Add Parameter', '添加参数'],
  remove: ['Remove', '删除'],
})

const input = ref('')

const parsed = computed(() => {
  if (!input.value.trim())
    return null
  try {
    return new URL(input.value.trim())
  }
  catch {
    return null
  }
})

const isValid = computed(() => input.value.trim() === '' || parsed.value !== null)

const queryParams = computed(() => {
  if (!parsed.value)
    return []
  const params: { key: string, value: string }[] = []
  parsed.value.searchParams.forEach((value, key) => {
    params.push({ key, value })
  })
  return params
})

const parts = computed(() => {
  if (!parsed.value)
    return []
  const url = parsed.value
  return [
    { label: t('protocol'), value: url.protocol.replace(/:$/, '') },
    { label: t('username'), value: url.username, hide: !url.username },
    { label: t('password'), value: url.password, hide: !url.password },
    { label: t('host'), value: url.hostname },
    { label: t('port'), value: url.port || t('empty') },
    { label: t('origin'), value: url.origin },
    { label: t('pathname'), value: url.pathname },
    { label: t('search'), value: url.search || t('empty') },
    { label: t('hash'), value: url.hash || t('empty') },
  ].filter(p => !p.hide)
})
</script>

<template>
  <div flex="~ col gap-4">
    <Panel :title="t('input')">
      <div p-5 flex="~ col gap-3">
        <TextInput
          v-model="input"
          :placeholder="t('placeholder')"
          :error="!isValid"
          :copyable="true"
        />
        <AlertTip v-if="!isValid" type="error">
          <span text-sm>{{ t('invalid') }}</span>
        </AlertTip>
      </div>
    </Panel>

    <Panel v-if="parsed" :title="t('result')">
      <div p-5 flex="~ col gap-3">
        <TextInput
          v-for="part in parts" :key="part.label"
          :label="part.label"
          :model-value="part.value"
          readonly
          :copyable="true"
        />
      </div>
    </Panel>

    <Panel v-if="queryParams.length > 0" :title="t('params')">
      <div p-5 flex="~ col gap-3">
        <div
          v-for="(param, i) in queryParams" :key="i"
          flex="~ col gap-2" p-3 rounded-xl border="~ c-border" bg="c-raised"
        >
          <TextInput
            :label="t('key')"
            :model-value="param.key"
            readonly
            :copyable="true"
          />
          <TextInput
            :label="t('value')"
            :model-value="decodeURIComponent(param.value)"
            readonly
            :copyable="true"
          />
        </div>
      </div>
    </Panel>
  </div>
</template>
