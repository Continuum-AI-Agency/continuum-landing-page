# Bun

This project uses **Bun 1.4.0** as the runtime, package manager, and build toolchain. Node.js / npm are not used.

## Quick Start

```bash
# Install Bun 1.4.0 if needed
curl -fsSL https://bun.sh/install | bash -s "bun-v1.4.0"

# Install dependencies
bun install

# Development server
bun run dev

# Production build
bun run build

# Preview production build
bun run preview
```

## How Bun is enforced

- `package.json` `"packageManager": "bun@1.4.0"` and `"engines.bun": "1.4.0"`
- `.bun-version` pins 1.4.0 for version managers
- `bunfig.toml` `[run] bun = true` aliases `node` → `bun` for every `bun run` script (Astro/Vite shebangs included)
- Netlify: `BUN_VERSION=1.4.0`, `BUN_FLAGS=--frozen-lockfile`, build command `bun --bun run build`
- Only `bun.lock` is committed. `package-lock.json` / yarn / pnpm lockfiles are gitignored.

## CI/CD

```yaml
- uses: oven-sh/setup-bun@v2
  with:
    bun-version: "1.4.0"
- run: bun install --frozen-lockfile
- run: bun --bun run build
```
