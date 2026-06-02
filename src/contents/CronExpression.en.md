## What Is a Cron Expression?

A [**Cron expression**](https://en.wikipedia.org/wiki/Cron) is a compact format used to schedule recurring tasks.

It defines **when** a task should run by specifying values for five fields: minute, hour, day of month, month, and day of week.

Cron expressions are commonly used in servers, automation workflows, scheduled scripts, backups, monitoring systems, and CI/CD pipelines.

## How to Use

- Select a preset schedule or build one using the visual generator.
- Adjust the Minute, Hour, Day, Month, and Weekday fields as needed.
- Alternatively, enter a Cron expression directly in the input box.
- Review the human-readable description to verify the schedule.
- Check the upcoming execution times to confirm the result.

## Field Order

A standard 5-field Cron expression follows this order:

```text
* * * * *
│ │ │ │ │
│ │ │ │ └─ Day of Week (0–6)
│ │ │ └─── Month (1–12)
│ │ └───── Day of Month (1–31)
│ └─────── Hour (0–23)
└───────── Minute (0–59)
```

## Common Symbols

| Symbol | Meaning         | Example     |
| ------ | --------------- | ----------- |
| `*`    | Every value     | `* * * * *` |
| `,`    | Multiple values | `1,15,30`   |
| `-`    | Range of values | `1-5`       |
| `/`    | Step interval   | `*/10`      |

## Examples

| Expression    | Meaning                  |
| ------------- | ------------------------ |
| `*/5 * * * *` | Every 5 minutes          |
| `0 * * * *`   | Every hour               |
| `0 0 * * *`   | Every day at midnight    |
| `0 9 * * 1-5` | Weekdays at 09:00        |
| `0 0 1 * *`   | First day of every month |
| `0 0 1 1 *`   | January 1st every year   |
