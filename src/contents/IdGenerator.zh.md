## 什么是 ID 生成器

**ID（Identifier）** 是一种用于唯一标识对象、记录或实体的字符串或数字。

在软件开发中，ID 常用于数据库主键、订单号、用户标识、分布式系统、消息队列以及 API 资源标识等场景。

本工具支持生成 UUID、ULID、NanoID、ObjectId 和 Snowflake 等常见 ID 格式，并支持批量生成。

## 支持的 ID 类型

| 类型                                                                            | 特点                   | 适用场景                 |
| ------------------------------------------------------------------------------- | ---------------------- | ------------------------ |
| [UUID](https://zh.wikipedia.org/wiki/通用唯一识别码)                            | 通用唯一标识符         | 数据库主键、API 资源标识 |
| [ULID](https://github.com/ulid/spec)                                            | 包含时间信息且可排序   | 日志、事件流、数据库     |
| [NanoID](https://github.com/ai/nanoid)                                          | 短小、高性能、随机性强 | Web 应用、前端生成 ID    |
| [ObjectId](https://www.mongodb.com/zh-cn/docs/manual/reference/method/ObjectId) | MongoDB 默认 ID 格式   | MongoDB 及兼容系统       |
| [Snowflake](https://zh.wikipedia.org/wiki/雪花算法)                             | 分布式递增 ID          | 大规模分布式系统         |

## UUID 版本

| 版本     | 说明                 |
| -------- | -------------------- |
| UUID v1  | 基于时间戳生成       |
| UUID v3  | 基于命名空间和 MD5   |
| UUID v4  | 基于随机数生成       |
| UUID v5  | 基于命名空间和 SHA-1 |
| NIL UUID | 全零 UUID            |

## 注意事项

- UUID v3 和 UUID v5 属于确定性 ID，相同命名空间和名称会生成相同结果。
- ULID、ObjectId、Snowflake 和 UUID v1 会包含时间信息，因此通常可以按生成时间排序。
- 如果不希望暴露生成时间，建议使用 UUID v4 或 NanoID。
- Snowflake 依赖 Datacenter ID 和 Worker ID 组合，不同节点应使用不同配置以避免冲突。
- UUID v3 使用 MD5，UUID v5 使用 SHA-1，它们主要用于兼容标准规范，而非安全用途。
