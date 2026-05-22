export type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue }

export interface JsonSchemaNode {
  $schema?: string
  title?: string
  type?: string | string[]
  properties?: Record<string, JsonSchemaNode>
  required?: string[]
  items?: JsonSchemaNode
  enum?: JsonValue[]
  examples?: JsonValue[]
  additionalProperties?: boolean | JsonSchemaNode
  minItems?: number
  minimum?: number
  maximum?: number
}

export interface GenerateSchemaOptions {
  title?: string
  includeExamples?: boolean
  additionalProperties?: boolean
  requiredMode?: 'all' | 'present'
}

export interface ValidationIssue {
  path: string
  message: string
}

export interface ValidationResult {
  valid: boolean
  issues: ValidationIssue[]
}

export function parseJsonDocument(text: string): { data?: JsonValue, error: string } {
  if (!text.trim())
    return { data: undefined, error: '' }

  try {
    return { data: JSON.parse(text) as JsonValue, error: '' }
  }
  catch (error) {
    return { data: undefined, error: error instanceof Error ? error.message : String(error) }
  }
}

export function generateJsonSchema(data: JsonValue, options: GenerateSchemaOptions = {}): JsonSchemaNode {
  const schema = inferSchema(data, {
    includeExamples: options.includeExamples ?? true,
    additionalProperties: options.additionalProperties ?? false,
    requiredMode: options.requiredMode ?? 'all',
  })

  return {
    $schema: 'http://json-schema.org/draft-07/schema#',
    ...(options.title ? { title: options.title } : {}),
    ...schema,
  } as JsonSchemaNode
}

export function validateJsonAgainstSchema(schema: JsonSchemaNode, data: JsonValue): ValidationResult {
  const issues: ValidationIssue[] = []
  validateNode(schema, data, '$', issues)
  return {
    valid: issues.length === 0,
    issues,
  }
}

function inferSchema(data: JsonValue, options: Required<Omit<GenerateSchemaOptions, 'title'>>): JsonSchemaNode {
  if (Array.isArray(data)) {
    return {
      type: 'array',
      minItems: data.length > 0 ? 1 : 0,
      items: mergeSchemas(data.map(item => inferSchema(item, options)), options),
      ...(options.includeExamples && data.length > 0 ? { examples: [data.slice(0, 3) as JsonValue] } : {}),
    }
  }

  if (data && typeof data === 'object') {
    const entries = Object.entries(data)
    return {
      type: 'object',
      properties: Object.fromEntries(entries.map(([key, value]) => [key, inferSchema(value, options)])),
      required: options.requiredMode === 'present' ? entries.map(([key]) => key) : entries.filter(([, value]) => value !== null).map(([key]) => key),
      additionalProperties: options.additionalProperties,
      ...(options.includeExamples ? { examples: [data] } : {}),
    }
  }

  if (data === null)
    return { type: 'null' }

  if (typeof data === 'number') {
    const schema: JsonSchemaNode = { type: Number.isInteger(data) ? 'integer' : 'number' }
    if (options.includeExamples)
      schema.examples = [data]
    return schema
  }

  const schema: JsonSchemaNode = { type: typeof data }
  if (options.includeExamples)
    schema.examples = [data]
  return schema
}

function mergeSchemas(schemas: JsonSchemaNode[], options: Required<Omit<GenerateSchemaOptions, 'title'>>): JsonSchemaNode {
  if (schemas.length === 0)
    return {}
  if (schemas.length === 1)
    return schemas[0]

  const typeSet = new Set(schemas.flatMap(schema => normalizeTypes(schema.type)))
  const types = [...typeSet]

  if (types.length === 1 && types[0] === 'object')
    return mergeObjectSchemas(schemas, options)
  if (types.length === 1 && types[0] === 'array')
    return mergeArraySchemas(schemas, options)
  if (types.every(type => type === 'integer' || type === 'number'))
    return { type: types.includes('number') ? 'number' : 'integer' }

  return { type: types.length === 1 ? types[0] : types }
}

function mergeObjectSchemas(schemas: JsonSchemaNode[], options: Required<Omit<GenerateSchemaOptions, 'title'>>): JsonSchemaNode {
  const allKeys = new Set<string>()
  for (const schema of schemas) {
    for (const key of Object.keys(schema.properties ?? {}))
      allKeys.add(key)
  }

  const properties: Record<string, JsonSchemaNode> = {}
  for (const key of allKeys) {
    const propertySchemas = schemas
      .map(schema => schema.properties?.[key])
      .filter((schema): schema is JsonSchemaNode => !!schema)
    properties[key] = mergeSchemas(propertySchemas, options)
  }

  return {
    type: 'object',
    properties,
    required: [...allKeys].filter(key => schemas.every(schema => !!schema.properties?.[key])),
    additionalProperties: options.additionalProperties,
  }
}

function mergeArraySchemas(schemas: JsonSchemaNode[], options: Required<Omit<GenerateSchemaOptions, 'title'>>): JsonSchemaNode {
  const itemSchemas = schemas
    .map(schema => schema.items)
    .filter((schema): schema is JsonSchemaNode => !!schema)

  return {
    type: 'array',
    items: mergeSchemas(itemSchemas, options),
  }
}

function validateNode(schema: JsonSchemaNode, value: JsonValue, path: string, issues: ValidationIssue[]) {
  if (schema.enum && !schema.enum.some(item => deepEqual(item, value))) {
    issues.push({ path, message: `must be one of ${schema.enum.map(item => JSON.stringify(item)).join(', ')}` })
    return
  }

  const expectedTypes = normalizeTypes(schema.type)
  if (expectedTypes.length > 0 && !expectedTypes.some(type => matchesType(type, value))) {
    issues.push({ path, message: `expected ${expectedTypes.join(' or ')}, got ${detectType(value)}` })
    return
  }

  if (typeof value === 'number') {
    if (schema.minimum !== undefined && value < schema.minimum)
      issues.push({ path, message: `must be >= ${schema.minimum}` })
    if (schema.maximum !== undefined && value > schema.maximum)
      issues.push({ path, message: `must be <= ${schema.maximum}` })
  }

  if (Array.isArray(value) && schema.items) {
    if (schema.minItems !== undefined && value.length < schema.minItems)
      issues.push({ path, message: `must contain at least ${schema.minItems} item(s)` })
    value.forEach((item, index) => validateNode(schema.items!, item, `${path}[${index}]`, issues))
  }

  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const record = value as Record<string, JsonValue>
    for (const key of schema.required ?? []) {
      if (!(key in record))
        issues.push({ path: appendPath(path, key), message: 'is required' })
    }

    for (const [key, childValue] of Object.entries(record)) {
      const childSchema = schema.properties?.[key]
      if (childSchema) {
        validateNode(childSchema, childValue, appendPath(path, key), issues)
      }
      else if (schema.additionalProperties === false) {
        issues.push({ path: appendPath(path, key), message: 'is not allowed' })
      }
      else if (typeof schema.additionalProperties === 'object') {
        validateNode(schema.additionalProperties, childValue, appendPath(path, key), issues)
      }
    }
  }
}

function normalizeTypes(type: JsonSchemaNode['type']): string[] {
  if (!type)
    return []
  return Array.isArray(type) ? type : [type]
}

function matchesType(type: string, value: JsonValue): boolean {
  switch (type) {
    case 'array':
      return Array.isArray(value)
    case 'object':
      return !!value && typeof value === 'object' && !Array.isArray(value)
    case 'integer':
      return typeof value === 'number' && Number.isInteger(value)
    case 'number':
      return typeof value === 'number'
    case 'null':
      return value === null
    default:
      return (
        (type === 'boolean' && typeof value === 'boolean')
        || (type === 'string' && typeof value === 'string')
      )
  }
}

function detectType(value: JsonValue): string {
  if (Array.isArray(value))
    return 'array'
  if (value === null)
    return 'null'
  if (typeof value === 'number' && Number.isInteger(value))
    return 'integer'
  return typeof value
}

function appendPath(path: string, key: string): string {
  return /^[a-z_$][\w$]*$/i.test(key) ? `${path}.${key}` : `${path}[${JSON.stringify(key)}]`
}

function deepEqual(a: JsonValue, b: JsonValue): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}
