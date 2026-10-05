import { useCallback, useEffect, useRef, useState } from 'react';

const API_BASE = 'https://zenblog.com/api/public';

interface LazyPost {
  slug: string;
  title: string;
  excerpt?: string;
  published_at: string;
  category?: { name: string; slug: string } | null;
  cover_image?: string;
}

interface Props {
  blogId: string;
  /** Posts already rendered as static HTML (SEO first page). */
  initialOffset: number;
  total: number;
  pageSize?: number;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.valueOf())) return '';
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

function SkeletonCard() {
  return (
    <div aria-hidden="true" className="block bg-background p-8 md:p-10">
      <div className="flex flex-col gap-4 animate-pulse">
        <div className="h-3 w-48 rounded bg-border/60" />
        <div className="h-7 w-3/4 rounded bg-border/60" />
        <div className="h-4 w-full rounded bg-border/40" />
        <div className="h-4 w-24 rounded bg-border/40" />
      </div>
    </div>
  );
}

/**
 * Lazy-loaded continuation of the blog list.
 * - Mounted with `client:visible`, so its JS only downloads when the
 *   reader scrolls near it (code-split + deferred hydration).
 * - Fetches further pages from the ZenBlog public API with an
 *   IntersectionObserver (infinite scroll) + explicit button fallback.
 */
export default function BlogLazyList({ blogId, initialOffset, total, pageSize = 10 }: Props) {
  const [posts, setPosts] = useState<LazyPost[]>([]);
  const [offset, setOffset] = useState(initialOffset);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const hasMore = offset < total;

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    setError(false);
    try {
      const url = `${API_BASE}/blogs/${encodeURIComponent(blogId)}/posts?limit=${pageSize}&offset=${offset}`;
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`ZenBlog responded ${res.status}`);
      const json = await res.json();
      const items: LazyPost[] = Array.isArray(json?.data) ? json.data : [];
      setPosts((prev) => [...prev, ...items]);
      setOffset((prev) => prev + items.length);
      // If the API returned fewer than requested, we've reached the end.
      if (items.length < pageSize) setOffset(total);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [blogId, offset, total, pageSize, loading, hasMore]);

  // Infinite scroll: auto-load when the sentinel enters the viewport.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: '600px 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loadMore, posts.length]);

  if (!hasMore && posts.length === 0) return null;

  return (
    <>
      {posts.map((post) => (
        <a
          key={post.slug}
          href={`/blog/${post.slug}/`}
          className="group block bg-background hover:bg-card/40 transition-colors duration-300 p-8 md:p-10"
        >
          <article className="flex flex-col gap-4">
            <div className="flex items-center gap-3 text-[10px] tracking-wide font-mono">
              <span className="text-primary font-bold">{post.category?.name ?? 'Insights'}</span>
              <span className="text-muted-foreground/40">•</span>
              <span className="text-muted-foreground/70">{formatDate(post.published_at)}</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-semibold font-display text-foreground leading-tight group-hover:text-primary transition-colors">
              {post.title}
            </h2>
            {post.excerpt && (
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-3xl">
                {post.excerpt}
              </p>
            )}
            <span className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-primary">
              Read article
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </span>
          </article>
        </a>
      ))}

      {loading && (
        <>
          <SkeletonCard />
          <SkeletonCard />
        </>
      )}

      {hasMore && !loading && (
        <div ref={sentinelRef} className="bg-background p-8 text-center">
          <button
            type="button"
            onClick={loadMore}
            className="inline-flex items-center justify-center h-11 px-6 rounded-md border border-border/40 text-sm font-medium text-foreground hover:border-primary hover:text-primary transition-colors"
          >
            {error ? 'Retry loading more articles' : 'Load more articles'}
          </button>
          {error && (
            <p className="mt-3 text-xs text-muted-foreground">
              Couldn&apos;t reach the blog service. Please try again.
            </p>
          )}
        </div>
      )}
      {/* Sentinel keeps infinite-scroll alive after list grows */}
      {hasMore && loading && <div ref={sentinelRef} aria-hidden="true" />}
    </>
  );
}
