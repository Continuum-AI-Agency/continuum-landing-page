import { useEffect, useState } from 'react';

const API_BASE = 'https://zenblog.com/api/public';

interface RelatedPost {
  slug: string;
  title: string;
  excerpt?: string;
  published_at: string;
  category?: { name: string; slug: string } | null;
}

interface Props {
  blogId: string;
  currentSlug: string;
  limit?: number;
}

/**
 * Lazy-loaded "keep reading" block for article pages.
 * Mounted with `client:visible` so it costs zero JS/HTML on first paint
 * and only fetches when the reader scrolls near the end of the article.
 */
export default function RelatedPosts({ blogId, currentSlug, limit = 3 }: Props) {
  const [posts, setPosts] = useState<RelatedPost[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const url = `${API_BASE}/blogs/${encodeURIComponent(blogId)}/posts?limit=${limit + 1}&offset=0`;
        const res = await fetch(url, { headers: { Accept: 'application/json' } });
        if (!res.ok) return;
        const json = await res.json();
        const items: RelatedPost[] = Array.isArray(json?.data) ? json.data : [];
        if (!cancelled) {
          setPosts(items.filter((p) => p.slug !== currentSlug).slice(0, limit));
        }
      } catch {
        if (!cancelled) setPosts([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [blogId, currentSlug, limit]);

  // Loading skeleton (also reserves layout to avoid CLS).
  if (posts === null) {
    return (
      <div className="mt-16" aria-hidden="true">
        <div className="h-6 w-40 rounded bg-border/50 animate-pulse mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-xl border border-border/40 p-6 animate-pulse">
              <div className="h-3 w-20 rounded bg-border/60 mb-4" />
              <div className="h-5 w-full rounded bg-border/50 mb-2" />
              <div className="h-4 w-2/3 rounded bg-border/40" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (posts.length === 0) return null;

  return (
    <section className="mt-16" aria-label="Keep reading">
      <h2 className="text-xl md:text-2xl font-semibold font-display text-foreground mb-6">
        Keep reading
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {posts.map((post) => (
          <a
            key={post.slug}
            href={`/blog/${post.slug}/`}
            className="group rounded-xl border border-border/40 bg-card/30 hover:bg-card/60 transition-colors p-6 flex flex-col gap-3"
          >
            <span className="text-[10px] tracking-wide font-mono text-primary font-bold">
              {post.category?.name ?? 'Insights'}
            </span>
            <span className="text-base font-medium font-display text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-3">
              {post.title}
            </span>
            <span className="mt-auto inline-flex items-center gap-2 text-sm font-medium text-primary">
              Read <span className="group-hover:translate-x-1 transition-transform">→</span>
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}
