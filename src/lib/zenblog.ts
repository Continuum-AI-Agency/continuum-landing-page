/**
 * ZenBlog integration — server-side helpers (Astro frontmatter only).
 *
 * Strategy:
 * - At build time we fetch from ZenBlog so /blog and /blog/[slug] are
 *   fully server-rendered (SEO preserved).
 * - If `PUBLIC_ZENBLOG_BLOG_ID` is missing or the API fails, we fall back
 *   to the local `src/content/blog` markdown collection, so the site
 *   always builds and existing content keeps working.
 * - Client-side lazy loading lives in `src/components/blog/*.tsx` and
 *   talks to the ZenBlog public API directly (no server proxy needed,
 *   which keeps this deployable as a fully static site).
 */
import { createZenblogClient } from 'zenblog';
import { getCollection } from 'astro:content';

export const ZENBLOG_API_BASE = 'https://zenblog.com/api/public';

/** Number of posts rendered as static HTML on /blog (SEO). The rest lazy-loads. */
export const BLOG_PAGE_SIZE = 10;

export function getZenblogBlogId(): string | undefined {
  const id =
    import.meta.env.PUBLIC_ZENBLOG_BLOG_ID ?? import.meta.env.ZENBLOG_BLOG_ID;
  return typeof id === 'string' && id.trim().length > 0 ? id.trim() : undefined;
}

export function isZenblogConfigured(): boolean {
  return Boolean(getZenblogBlogId());
}

let cachedClient: ReturnType<typeof createZenblogClient> | undefined;

export function getZenblogClient() {
  const blogId = getZenblogBlogId();
  if (!blogId) throw new Error('ZenBlog is not configured (missing blog ID).');
  if (!cachedClient) cachedClient = createZenblogClient({ blogId });
  return cachedClient;
}

export interface UnifiedAuthor {
  name: string;
  slug?: string;
  image_url?: string;
}

export interface UnifiedPost {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  publishedAt: Date;
  updatedAt?: Date;
  authors: UnifiedAuthor[];
  tags: { name: string; slug: string }[];
  cover_image?: string;
  /** Only set for ZenBlog posts fetched by slug (article body). */
  html_content?: string;
  source: 'zenblog' | 'local';
  /** Local collection id (markdown fallback rendering path). */
  localId?: string;
}

interface ZenblogListItem {
  title: string;
  slug: string;
  excerpt?: string;
  published_at: string;
  cover_image?: string;
  category?: { name: string; slug: string } | null;
  tags?: { name: string; slug: string }[];
  authors?: { name: string; slug: string; image_url?: string }[];
}

function mapZenblogListItem(p: ZenblogListItem): UnifiedPost {
  return {
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt ?? '',
    category: p.category?.name ?? 'Insights',
    publishedAt: new Date(p.published_at),
    authors: (p.authors ?? []).map((a) => ({
      name: a.name,
      slug: a.slug,
      image_url: a.image_url,
    })),
    tags: p.tags ?? [],
    cover_image: p.cover_image,
    source: 'zenblog',
  };
}

async function listLocalPosts(limit: number, offset: number): Promise<{ posts: UnifiedPost[]; total: number }> {
  const all = (await getCollection('blog'))
    .filter((p) => !p.data.draft)
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
  const total = all.length;
  const posts: UnifiedPost[] = all.slice(offset, offset + limit).map((p) => ({
    slug: p.id,
    title: p.data.title,
    excerpt: p.data.excerpt ?? p.data.metaDescription,
    category: p.data.category,
    publishedAt: p.data.pubDate,
    updatedAt: p.data.updatedDate,
    authors: [{ name: p.data.author }],
    tags: [],
    source: 'local' as const,
    localId: p.id,
  }));
  return { posts, total };
}

export interface ListPostsOptions {
  limit?: number;
  offset?: number;
  category?: string;
  tags?: string[];
  author?: string;
}

export async function listUnifiedPosts(
  opts: ListPostsOptions = {},
): Promise<{ posts: UnifiedPost[]; total: number; source: 'zenblog' | 'local' }> {
  const { limit = BLOG_PAGE_SIZE, offset = 0, category, tags, author } = opts;
  if (isZenblogConfigured()) {
    try {
      const client = getZenblogClient();
      const res = await client.posts.list({ limit, offset, category, tags, author });
      return {
        posts: (res.data ?? []).map(mapZenblogListItem),
        total: typeof res.total === 'number' ? res.total : (res.data ?? []).length,
        source: 'zenblog',
      };
    } catch (err) {
      console.warn('[zenblog] list failed, falling back to local collection:', err);
    }
  }
  const local = await listLocalPosts(limit, offset);
  return { ...local, source: 'local' };
}

export async function getUnifiedPost(slug: string): Promise<UnifiedPost | null> {
  if (isZenblogConfigured()) {
    try {
      const client = getZenblogClient();
      const res = await client.posts.get({ slug });
      const p = res.data as ZenblogListItem & { html_content: string; updated_at?: string };
      if (p) {
        return {
          ...mapZenblogListItem(p),
          html_content: p.html_content,
        };
      }
    } catch (err) {
      console.warn(`[zenblog] get("${slug}") failed, trying local collection:`, err);
    }
  }
  const all = await getCollection('blog');
  const found = all.find((p) => p.id === slug && !p.data.draft);
  if (!found) return null;
  return {
    slug: found.id,
    title: found.data.title,
    excerpt: found.data.excerpt ?? found.data.metaDescription,
    category: found.data.category,
    publishedAt: found.data.pubDate,
    updatedAt: found.data.updatedDate,
    authors: [{ name: found.data.author }],
    tags: [],
    source: 'local',
    localId: found.id,
  };
}

/** All slugs to prerender: ZenBlog slugs + local slugs (deduplicated). */
export async function listAllPostSlugs(): Promise<string[]> {
  const slugs = new Set<string>();
  if (isZenblogConfigured()) {
    try {
      const client = getZenblogClient();
      // Paginate defensively in case the blog grows past one page.
      let offset = 0;
      const pageSize = 100;
      for (;;) {
        const res = await client.posts.list({ limit: pageSize, offset });
        for (const p of res.data ?? []) slugs.add(p.slug);
        const total = typeof res.total === 'number' ? res.total : (res.data ?? []).length;
        offset += (res.data ?? []).length;
        if (offset >= total || (res.data ?? []).length === 0) break;
      }
    } catch (err) {
      console.warn('[zenblog] slug listing failed, using local collection:', err);
    }
  }
  const local = await getCollection('blog');
  for (const p of local) {
    if (!p.data.draft) slugs.add(p.id);
  }
  return [...slugs];
}

/**
 * Optimize ZenBlog article HTML for performance:
 * - images: loading="lazy" + decoding="async" (unless already set),
 *   so below-the-fold media never blocks first paint.
 * - iframes / videos: loading="lazy".
 * - images get responsive sizing via CSS class hooks (styled in .prose-blog).
 */
export function optimizeZenblogHtml(html: string): string {
  if (!html) return html;
  let out = html.replace(/<img\b([^>]*?)>/gi, (match, attrs: string) => {
    let a = attrs as string;
    if (!/\bloading\s*=/i.test(a)) a += ' loading="lazy"';
    if (!/\bdecoding\s*=/i.test(a)) a += ' decoding="async"';
    return `<img${a}>`;
  });
  out = out.replace(/<(iframe|video|embed)\b([^>]*?)>/gi, (match, tag: string, attrs: string) => {
    let a = attrs as string;
    if (!/\bloading\s*=/i.test(a)) a += ' loading="lazy"';
    return `<${tag}${a}>`;
  });
  return out;
}

export function readingTimeMinutes(text: string | undefined): number {
  const words = (text ?? '').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

export function formatPostDate(d: Date): string {
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}
