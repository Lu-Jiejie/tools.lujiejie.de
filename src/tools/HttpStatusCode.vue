<script lang="ts">
import { defineTool } from './index'

export const toolMeta = defineTool({
  id: 'http-status-code',
  name: 'HTTP Status Code',
  nameZh: 'HTTP 状态码查询',
  description: 'Look up HTTP status codes with descriptions and usage examples.',
  descriptionZh: '查询 HTTP 状态码及其含义、使用场景。',
  category: 'dev',
  keywords: ['http', 'status', 'code', '状态码', 'rest', 'api', 'response', '响应'],
})
</script>

<!-- eslint-disable import/first -->
<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import Panel from '~/components/container/Panel.vue'
import BaseButton from '~/components/input/BaseButton.vue'
import TextInput from '~/components/input/TextInput.vue'
import { useI18n } from '~/composables/useI18n'
import { useLocale } from '~/composables/useLocale'

const { t } = useI18n({
  search: ['Search', '搜索'],
  searchPlaceholder: ['Search by code or description...', '搜索状态码或描述...'],
  category: ['Category', '分类'],
  all: ['All', '全部'],
  informational: ['1xx Informational', '1xx 信息响应'],
  success: ['2xx Success', '2xx 成功'],
  redirection: ['3xx Redirection', '3xx 重定向'],
  clientError: ['4xx Client Error', '4xx 客户端错误'],
  serverError: ['5xx Server Error', '5xx 服务端错误'],
  code: ['Code', '状态码'],
  description: ['Description', '描述'],
  usage: ['Usage', '使用场景'],
  noResults: ['No matching status codes found.', '未找到匹配的状态码。'],
})

const { locale } = useLocale()

interface StatusCode {
  code: number
  nameEn: string
  nameZh: string
  descriptionEn: string
  descriptionZh: string
  category: 'informational' | 'success' | 'redirection' | 'clientError' | 'serverError'
}

const STATUS_CODES: StatusCode[] = [
  // 1xx Informational
  {
    code: 100,
    nameEn: 'Continue',
    nameZh: '继续',
    descriptionEn: 'The server has received the request headers and the client should proceed to send the request body.',
    descriptionZh: '服务器已接收请求头,客户端应继续发送请求体。',
    category: 'informational',
  },
  {
    code: 101,
    nameEn: 'Switching Protocols',
    nameZh: '切换协议',
    descriptionEn: 'The server is switching protocols as requested by the client.',
    descriptionZh: '服务器正在根据客户端请求切换协议。',
    category: 'informational',
  },
  {
    code: 102,
    nameEn: 'Processing',
    nameZh: '处理中',
    descriptionEn: 'The server has received and is processing the request, but no response is available yet.',
    descriptionZh: '服务器已收到并正在处理请求,但尚无响应。',
    category: 'informational',
  },
  {
    code: 103,
    nameEn: 'Early Hints',
    nameZh: '早期提示',
    descriptionEn: 'Used to return some response headers before final HTTP message.',
    descriptionZh: '用于在最终 HTTP 消息之前返回一些响应头。',
    category: 'informational',
  },

  // 2xx Success
  {
    code: 200,
    nameEn: 'OK',
    nameZh: '成功',
    descriptionEn: 'The request succeeded. The meaning depends on the HTTP method used.',
    descriptionZh: '请求成功。具体含义取决于使用的 HTTP 方法。',
    category: 'success',
  },
  {
    code: 201,
    nameEn: 'Created',
    nameZh: '已创建',
    descriptionEn: 'The request succeeded and a new resource was created as a result.',
    descriptionZh: '请求成功并创建了新资源。',
    category: 'success',
  },
  {
    code: 202,
    nameEn: 'Accepted',
    nameZh: '已接受',
    descriptionEn: 'The request has been accepted for processing, but the processing has not been completed.',
    descriptionZh: '请求已接受处理,但处理尚未完成。',
    category: 'success',
  },
  {
    code: 203,
    nameEn: 'Non-Authoritative Information',
    nameZh: '非权威信息',
    descriptionEn: 'The request was successful but the enclosed payload has been modified by a transforming proxy.',
    descriptionZh: '请求成功,但返回的信息可能来自另一来源。',
    category: 'success',
  },
  {
    code: 204,
    nameEn: 'No Content',
    nameZh: '无内容',
    descriptionEn: 'The server successfully processed the request and is not returning any content.',
    descriptionZh: '服务器成功处理请求,但不返回任何内容。',
    category: 'success',
  },
  {
    code: 205,
    nameEn: 'Reset Content',
    nameZh: '重置内容',
    descriptionEn: 'The server successfully processed the request and the user agent should reset the document view.',
    descriptionZh: '服务器成功处理请求,要求客户端重置文档视图。',
    category: 'success',
  },
  {
    code: 206,
    nameEn: 'Partial Content',
    nameZh: '部分内容',
    descriptionEn: 'The server is delivering only part of the resource due to a range header sent by the client.',
    descriptionZh: '服务器因客户端的范围请求只传递了部分资源。',
    category: 'success',
  },

  // 3xx Redirection
  {
    code: 300,
    nameEn: 'Multiple Choices',
    nameZh: '多种选择',
    descriptionEn: 'The request has more than one possible response. The user or user agent should choose one.',
    descriptionZh: '请求有多个可能的响应,用户应选择其中之一。',
    category: 'redirection',
  },
  {
    code: 301,
    nameEn: 'Moved Permanently',
    nameZh: '永久移动',
    descriptionEn: 'The URL of the requested resource has been changed permanently. The new URL is given in the response.',
    descriptionZh: '请求的资源已永久移动到新位置,新 URL 在响应中给出。',
    category: 'redirection',
  },
  {
    code: 302,
    nameEn: 'Found',
    nameZh: '临时移动',
    descriptionEn: 'The URI of requested resource has been changed temporarily. Further changes may be made in the future.',
    descriptionZh: '请求的资源临时位于不同的 URI,未来可能还会改变。',
    category: 'redirection',
  },
  {
    code: 303,
    nameEn: 'See Other',
    nameZh: '查看其他位置',
    descriptionEn: 'The server sent this response to direct the client to get the requested resource at another URI with a GET request.',
    descriptionZh: '服务器发送此响应以指示客户端用 GET 请求另一个 URI 来获取资源。',
    category: 'redirection',
  },
  {
    code: 304,
    nameEn: 'Not Modified',
    nameZh: '未修改',
    descriptionEn: 'The resource has not been modified since the version specified by the request headers.',
    descriptionZh: '自请求头指定的版本以来,资源未被修改。',
    category: 'redirection',
  },
  {
    code: 307,
    nameEn: 'Temporary Redirect',
    nameZh: '临时重定向',
    descriptionEn: 'The request should be repeated with another URI but future requests should still use the original URI.',
    descriptionZh: '请求应使用另一个 URI 重复,但将来的请求仍应使用原始 URI。',
    category: 'redirection',
  },
  {
    code: 308,
    nameEn: 'Permanent Redirect',
    nameZh: '永久重定向',
    descriptionEn: 'The request and all future requests should be repeated using another URI.',
    descriptionZh: '请求和所有将来的请求都应使用另一个 URI 重复。',
    category: 'redirection',
  },

  // 4xx Client Error
  {
    code: 400,
    nameEn: 'Bad Request',
    nameZh: '错误请求',
    descriptionEn: 'The server cannot or will not process the request due to something perceived to be a client error.',
    descriptionZh: '服务器因客户端错误而无法或不愿处理请求。',
    category: 'clientError',
  },
  {
    code: 401,
    nameEn: 'Unauthorized',
    nameZh: '未授权',
    descriptionEn: 'Authentication is required and has failed or has not yet been provided.',
    descriptionZh: '需要身份验证,但尚未提供或验证失败。',
    category: 'clientError',
  },
  {
    code: 402,
    nameEn: 'Payment Required',
    nameZh: '需要付款',
    descriptionEn: 'Reserved for future use. Originally intended for digital payment systems.',
    descriptionZh: '保留供将来使用,最初用于数字支付系统。',
    category: 'clientError',
  },
  {
    code: 403,
    nameEn: 'Forbidden',
    nameZh: '禁止访问',
    descriptionEn: 'The client does not have access rights to the content.',
    descriptionZh: '客户端没有访问内容的权限。',
    category: 'clientError',
  },
  {
    code: 404,
    nameEn: 'Not Found',
    nameZh: '未找到',
    descriptionEn: 'The server cannot find the requested resource.',
    descriptionZh: '服务器无法找到请求的资源。',
    category: 'clientError',
  },
  {
    code: 405,
    nameEn: 'Method Not Allowed',
    nameZh: '方法不允许',
    descriptionEn: 'The request method is known by the server but is not supported by the target resource.',
    descriptionZh: '服务器知道请求方法,但目标资源不支持该方法。',
    category: 'clientError',
  },
  {
    code: 406,
    nameEn: 'Not Acceptable',
    nameZh: '不可接受',
    descriptionEn: 'The server cannot produce a response matching the list of acceptable values defined in the request headers.',
    descriptionZh: '服务器无法生成与请求头中定义的可接受值匹配的响应。',
    category: 'clientError',
  },
  {
    code: 407,
    nameEn: 'Proxy Authentication Required',
    nameZh: '需要代理身份验证',
    descriptionEn: 'The client must first authenticate itself with the proxy.',
    descriptionZh: '客户端必须首先向代理进行身份验证。',
    category: 'clientError',
  },
  {
    code: 408,
    nameEn: 'Request Timeout',
    nameZh: '请求超时',
    descriptionEn: 'The server timed out waiting for the request.',
    descriptionZh: '服务器等待请求超时。',
    category: 'clientError',
  },
  {
    code: 409,
    nameEn: 'Conflict',
    nameZh: '冲突',
    descriptionEn: 'The request conflicts with the current state of the server.',
    descriptionZh: '请求与服务器的当前状态冲突。',
    category: 'clientError',
  },
  {
    code: 410,
    nameEn: 'Gone',
    nameZh: '已删除',
    descriptionEn: 'The requested resource is no longer available and will not be available again.',
    descriptionZh: '请求的资源已永久删除且不会再可用。',
    category: 'clientError',
  },
  {
    code: 411,
    nameEn: 'Length Required',
    nameZh: '需要内容长度',
    descriptionEn: 'The request did not specify the length of its content, which is required by the requested resource.',
    descriptionZh: '请求未指定其内容长度,而这是请求资源所必需的。',
    category: 'clientError',
  },
  {
    code: 412,
    nameEn: 'Precondition Failed',
    nameZh: '前提条件失败',
    descriptionEn: 'The server does not meet one of the preconditions that the requester put on the request.',
    descriptionZh: '服务器不满足请求者在请求中设置的前提条件之一。',
    category: 'clientError',
  },
  {
    code: 413,
    nameEn: 'Payload Too Large',
    nameZh: '请求实体过大',
    descriptionEn: 'The request entity is larger than limits defined by server.',
    descriptionZh: '请求实体大于服务器定义的限制。',
    category: 'clientError',
  },
  {
    code: 414,
    nameEn: 'URI Too Long',
    nameZh: 'URI 过长',
    descriptionEn: 'The URI provided was too long for the server to process.',
    descriptionZh: '提供的 URI 太长,服务器无法处理。',
    category: 'clientError',
  },
  {
    code: 415,
    nameEn: 'Unsupported Media Type',
    nameZh: '不支持的媒体类型',
    descriptionEn: 'The request entity has a media type which the server or resource does not support.',
    descriptionZh: '请求实体的媒体类型不受服务器或资源支持。',
    category: 'clientError',
  },
  {
    code: 416,
    nameEn: 'Range Not Satisfiable',
    nameZh: '请求范围不符合要求',
    descriptionEn: 'The client has asked for a portion of the file, but the server cannot supply that portion.',
    descriptionZh: '客户端请求了文件的一部分,但服务器无法提供该部分。',
    category: 'clientError',
  },
  {
    code: 417,
    nameEn: 'Expectation Failed',
    nameZh: '期望失败',
    descriptionEn: 'The server cannot meet the requirements of the Expect request-header field.',
    descriptionZh: '服务器无法满足 Expect 请求头字段的要求。',
    category: 'clientError',
  },
  {
    code: 418,
    nameEn: 'I\'m a teapot',
    nameZh: '我是茶壶',
    descriptionEn: 'The server refuses to brew coffee because it is, permanently, a teapot. (April Fools\' joke)',
    descriptionZh: '服务器拒绝煮咖啡,因为它永久地是一个茶壶。(愚人节玩笑)',
    category: 'clientError',
  },
  {
    code: 421,
    nameEn: 'Misdirected Request',
    nameZh: '错误定向的请求',
    descriptionEn: 'The request was directed at a server that is not able to produce a response.',
    descriptionZh: '请求被定向到无法生成响应的服务器。',
    category: 'clientError',
  },
  {
    code: 422,
    nameEn: 'Unprocessable Entity',
    nameZh: '无法处理的实体',
    descriptionEn: 'The request was well-formed but was unable to be followed due to semantic errors.',
    descriptionZh: '请求格式正确,但由于语义错误而无法执行。',
    category: 'clientError',
  },
  {
    code: 423,
    nameEn: 'Locked',
    nameZh: '已锁定',
    descriptionEn: 'The resource that is being accessed is locked.',
    descriptionZh: '正在访问的资源已被锁定。',
    category: 'clientError',
  },
  {
    code: 424,
    nameEn: 'Failed Dependency',
    nameZh: '依赖失败',
    descriptionEn: 'The request failed due to failure of a previous request.',
    descriptionZh: '由于先前请求失败,导致当前请求失败。',
    category: 'clientError',
  },
  {
    code: 425,
    nameEn: 'Too Early',
    nameZh: '太早',
    descriptionEn: 'The server is unwilling to risk processing a request that might be replayed.',
    descriptionZh: '服务器不愿意冒险处理可能被重放的请求。',
    category: 'clientError',
  },
  {
    code: 426,
    nameEn: 'Upgrade Required',
    nameZh: '需要升级',
    descriptionEn: 'The client should switch to a different protocol.',
    descriptionZh: '客户端应切换到不同的协议。',
    category: 'clientError',
  },
  {
    code: 428,
    nameEn: 'Precondition Required',
    nameZh: '需要前提条件',
    descriptionEn: 'The origin server requires the request to be conditional.',
    descriptionZh: '源服务器要求请求是有条件的。',
    category: 'clientError',
  },
  {
    code: 429,
    nameEn: 'Too Many Requests',
    nameZh: '请求过多',
    descriptionEn: 'The user has sent too many requests in a given amount of time ("rate limiting").',
    descriptionZh: '用户在给定时间内发送了太多请求(速率限制)。',
    category: 'clientError',
  },
  {
    code: 431,
    nameEn: 'Request Header Fields Too Large',
    nameZh: '请求头字段过大',
    descriptionEn: 'The server is unwilling to process the request because its header fields are too large.',
    descriptionZh: '服务器不愿意处理请求,因为其请求头字段过大。',
    category: 'clientError',
  },
  {
    code: 451,
    nameEn: 'Unavailable For Legal Reasons',
    nameZh: '因法律原因不可用',
    descriptionEn: 'The user requested a resource that is not available due to legal reasons.',
    descriptionZh: '由于法律原因,用户请求的资源不可用。',
    category: 'clientError',
  },

  // 5xx Server Error
  {
    code: 500,
    nameEn: 'Internal Server Error',
    nameZh: '服务器内部错误',
    descriptionEn: 'The server encountered an unexpected condition that prevented it from fulfilling the request.',
    descriptionZh: '服务器遇到意外情况,无法完成请求。',
    category: 'serverError',
  },
  {
    code: 501,
    nameEn: 'Not Implemented',
    nameZh: '未实现',
    descriptionEn: 'The server does not support the functionality required to fulfill the request.',
    descriptionZh: '服务器不支持完成请求所需的功能。',
    category: 'serverError',
  },
  {
    code: 502,
    nameEn: 'Bad Gateway',
    nameZh: '错误网关',
    descriptionEn: 'The server, while acting as a gateway or proxy, received an invalid response from the upstream server.',
    descriptionZh: '服务器作为网关或代理时,从上游服务器收到无效响应。',
    category: 'serverError',
  },
  {
    code: 503,
    nameEn: 'Service Unavailable',
    nameZh: '服务不可用',
    descriptionEn: 'The server is not ready to handle the request, usually due to maintenance or overload.',
    descriptionZh: '服务器尚未准备好处理请求,通常是由于维护或过载。',
    category: 'serverError',
  },
  {
    code: 504,
    nameEn: 'Gateway Timeout',
    nameZh: '网关超时',
    descriptionEn: 'The server, while acting as a gateway or proxy, did not receive a timely response from the upstream server.',
    descriptionZh: '服务器作为网关或代理时,未及时从上游服务器收到响应。',
    category: 'serverError',
  },
  {
    code: 505,
    nameEn: 'HTTP Version Not Supported',
    nameZh: 'HTTP 版本不支持',
    descriptionEn: 'The server does not support the HTTP protocol version used in the request.',
    descriptionZh: '服务器不支持请求中使用的 HTTP 协议版本。',
    category: 'serverError',
  },
  {
    code: 506,
    nameEn: 'Variant Also Negotiates',
    nameZh: '变体也在协商',
    descriptionEn: 'The server has an internal configuration error.',
    descriptionZh: '服务器存在内部配置错误。',
    category: 'serverError',
  },
  {
    code: 507,
    nameEn: 'Insufficient Storage',
    nameZh: '存储空间不足',
    descriptionEn: 'The server is unable to store the representation needed to complete the request.',
    descriptionZh: '服务器无法存储完成请求所需的表示。',
    category: 'serverError',
  },
  {
    code: 508,
    nameEn: 'Loop Detected',
    nameZh: '检测到循环',
    descriptionEn: 'The server detected an infinite loop while processing the request.',
    descriptionZh: '服务器在处理请求时检测到无限循环。',
    category: 'serverError',
  },
  {
    code: 510,
    nameEn: 'Not Extended',
    nameZh: '未扩展',
    descriptionEn: 'Further extensions to the request are required for the server to fulfill it.',
    descriptionZh: '服务器需要进一步扩展请求才能完成。',
    category: 'serverError',
  },
  {
    code: 511,
    nameEn: 'Network Authentication Required',
    nameZh: '需要网络身份验证',
    descriptionEn: 'The client needs to authenticate to gain network access.',
    descriptionZh: '客户端需要进行身份验证以获得网络访问权限。',
    category: 'serverError',
  },
]

type CategoryKey = 'all' | StatusCode['category']

const selectedCategory = shallowRef<CategoryKey>('all')
const searchQuery = shallowRef('')

const categories: { key: CategoryKey, label: string }[] = [
  { key: 'all', label: t('all') },
  { key: 'informational', label: t('informational') },
  { key: 'success', label: t('success') },
  { key: 'redirection', label: t('redirection') },
  { key: 'clientError', label: t('clientError') },
  { key: 'serverError', label: t('serverError') },
]

const filteredCodes = computed(() => {
  let result = STATUS_CODES

  // 按分类过滤
  if (selectedCategory.value !== 'all') {
    result = result.filter(code => code.category === selectedCategory.value)
  }

  // 按搜索词过滤
  const query = searchQuery.value.trim().toLowerCase()
  if (query) {
    result = result.filter((code) => {
      const codeStr = code.code.toString()
      const nameEn = code.nameEn.toLowerCase()
      const nameZh = code.nameZh.toLowerCase()
      const descEn = code.descriptionEn.toLowerCase()
      const descZh = code.descriptionZh.toLowerCase()

      return codeStr.includes(query)
        || nameEn.includes(query)
        || nameZh.includes(query)
        || descEn.includes(query)
        || descZh.includes(query)
    })
  }

  return result
})

function getCategoryColor(category: StatusCode['category']): string {
  const colors = {
    informational: 'sky',
    success: 'emerald',
    redirection: 'violet',
    clientError: 'amber',
    serverError: 'rose',
  }
  return colors[category]
}
</script>

<template>
  <div flex="~ col gap-4">
    <Panel :title="t('search')">
      <div p-5 flex="~ col gap-4">
        <TextInput
          v-model="searchQuery"
          :placeholder="t('searchPlaceholder')"
          icon="i-carbon-search"
        />

        <div>
          <div text-sm font-medium mb-2 op-60>
            {{ t('category') }}
          </div>
          <div flex="~ gap-2 wrap">
            <BaseButton
              v-for="cat in categories"
              :key="cat.key"
              :active="selectedCategory === cat.key"
              @click="selectedCategory = cat.key"
            >
              {{ cat.label }}
            </BaseButton>
          </div>
        </div>
      </div>
    </Panel>

    <Panel>
      <div p-5>
        <div
          v-if="filteredCodes.length === 0"
          py-8 text-center op-40
        >
          {{ t('noResults') }}
        </div>

        <div v-else flex="~ col" divide="y c-border">
          <div
            v-for="status in filteredCodes"
            :key="status.code"
            py-4 first:pt-0 last:pb-0
          >
            <div flex="~ gap-4" items-start>
              <div
                flex="~ col items-center justify-center"
                shrink-0
                w-20
              >
                <div
                  text="2xl"
                  font="mono bold"
                  :class="`text-${getCategoryColor(status.category)}-500`"
                >
                  {{ status.code }}
                </div>
                <div
                  text-xs
                  font-mono
                  mt-1
                  op-40
                  :class="`text-${getCategoryColor(status.category)}-500`"
                >
                  {{ status.code.toString()[0] }}xx
                </div>
              </div>

              <div flex="1" min-w-0>
                <div
                  text-lg
                  font="serif medium"
                  mb-1
                >
                  {{ status.nameEn }}
                  <span v-if="locale === 'zh'" text-base ml-2 op-60>
                    {{ status.nameZh }}
                  </span>
                </div>
                <div
                  text-sm
                  leading-relaxed
                >
                  <div op-80>
                    {{ status.descriptionEn }}
                  </div>
                  <div v-if="locale === 'zh'" mt-1 op-50>
                    {{ status.descriptionZh }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Panel>
  </div>
</template>
