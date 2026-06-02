## What Is Unified Password

**Unified Password** uses a single **master password** and a corresponding **platform alias**, together with your **length** and **character set** settings, to generate a unique, strong password for each platform via the [Argon2](https://en.wikipedia.org/wiki/Argon2) key derivation function.

It does not store passwords. The same inputs always derive the same password, so you only need to remember one master password and its platform alias.

## How It Works

- **Master password** — Every password is derived from the master password, so make sure it is strong enough.
- **Platform alias** — The alias changes the result. For example, `github` and `google` produce different passwords.
- **Password generation** — The algorithm derives a raw hash from the master password and alias, then formats it into the final password according to your length and character set settings. Each enabled character type appears at least once.
- **Reproducing a password** — Using the same master password, alias, length, and character set always produces the same password.

## Notes

- The master password is the only credential you rely on. If it is weak or leaked, every derived password is at risk.
- Because passwords are derived rather than stored, reproducing a password requires the exact same settings. Changing the length or character set produces a different result.
- All processing runs locally in your browser. Passwords are not uploaded to any server.
