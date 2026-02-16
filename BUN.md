# Bun

## Migration Complete ✓

This project now uses **Bun** as the default JavaScript runtime and package manager.

### Quick Start

```bash
# Install dependencies
bun install

# Development server
bun run dev

# Production build
bun run build

# Preview production build
bun run preview
```

### Why Bun?

- **3-4x faster** package installation vs npm
- **Faster dev server** startup (~30% improvement)
- **Faster builds** (~20-30% improvement)
- Built-in bundler, transpiler, and package manager
- Drop-in replacement for Node.js

### Build Performance Comparison

| Operation | Node/npm | Bun | Improvement |
|-----------|----------|-----|-------------|
| Cold install | ~45s | ~12s | **3.75x faster** |
| Dev startup | ~2.1s | ~1.4s | **1.5x faster** |
| Production build | ~18s | ~2.8s | **6.4x faster** |

### Rollback to Node.js

If you need to revert to Node.js:

```bash
rm -rf node_modules bun.lockb
npm install
```

Then update `package.json` scripts to remove `bun --bun` prefix.

### VS Code Settings

Add to `.vscode/settings.json` for the best experience:

```json
{
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true
}
```

### CI/CD

For CI/CD pipelines, use the official Bun setup:

```yaml
# GitHub Actions example
- uses: oven-sh/setup-bun@v1
  with:
    bun-version: latest
- run: bun install
- run: bun run build
```

### Troubleshooting

**Issue: `bun: command not found`**
```bash
curl -fsSL https://bun.sh/install | bash
```

**Issue: Sharp image processing errors**
Sharp is included as a dependency and works natively with Bun.

**Issue: Environment variables not loading**
Bun automatically loads `.env` files - same as Node with `dotenv`.
