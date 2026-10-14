# Continuum Blog Studio

The editor for trycontinuum.ai/blog. Writers use the hosted Studio at https://continuum.sanity.studio.

- Project `ermndauy`, dataset `production` (public read; the site reads published posts only).
- Schema: `schemaTypes/post.ts` (the post document) and `schemaTypes/content.ts` (the body, tables, dividers, FAQ).
- Run locally: `bun install && bun run dev` (http://localhost:3333).
- Ship schema or Studio changes: `bun run deploy` (deploys to the app id in `sanity.cli.ts`).

Publishing a post calls a Cloudflare Pages deploy hook (Sanity webhook `sanity-publish`), which rebuilds the static site in about two minutes.
