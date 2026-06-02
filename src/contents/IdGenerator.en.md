# What Is an ID Generator

An **ID (Identifier)** is a string or number used to uniquely identify an object, record, or entity.

In software development, IDs are commonly used for database primary keys, order numbers, user identifiers, distributed systems, message queues, and API resource identifiers.

This tool can generate several widely used ID formats, including UUID, ULID, NanoID, ObjectId, and Snowflake, and supports batch generation.

## Supported ID Types

| Type                                                                       | Features                                  | Common Use Cases                            |
| -------------------------------------------------------------------------- | ----------------------------------------- | ------------------------------------------- |
| [UUID](https://en.wikipedia.org/wiki/Universally_unique_identifier)        | Universally unique identifier             | Database primary keys, API resource IDs     |
| [ULID](https://github.com/ulid/spec)                                       | Time-based and lexicographically sortable | Logs, event streams, databases              |
| [NanoID](https://github.com/ai/nanoid)                                     | Compact, fast, and highly random          | Web applications, client-side ID generation |
| [ObjectId](https://www.mongodb.com/docs/manual/reference/method/ObjectId/) | Default MongoDB identifier format         | MongoDB and compatible systems              |
| [Snowflake](https://en.wikipedia.org/wiki/Snowflake_ID)                    | Distributed, time-ordered unique ID       | Large-scale distributed systems             |

## UUID Versions

| Version  | Description                                            |
| -------- | ------------------------------------------------------ |
| UUID v1  | Generated from timestamps and node information         |
| UUID v3  | Generated from a namespace and MD5 hash                |
| UUID v4  | Generated using random values                          |
| UUID v5  | Generated from a namespace and SHA-1 hash              |
| NIL UUID | All-zero UUID (`00000000-0000-0000-0000-000000000000`) |

## Notes

- UUID v3 and UUID v5 are deterministic IDs. The same namespace and name will always produce the same result.
- ULID, ObjectId, Snowflake, and UUID v1 contain timestamp information and are generally sortable by creation time.
- If you do not want the creation time to be exposed, consider using UUID v4 or NanoID.
- Snowflake IDs rely on the combination of Datacenter ID and Worker ID. Different nodes should use different configurations to avoid collisions.
- UUID v3 uses MD5 and UUID v5 uses SHA-1. These algorithms are included for standards compatibility and deterministic ID generation, not for cryptographic security.
