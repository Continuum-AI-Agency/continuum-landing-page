import { getEmDashCollection, getEmDashEntry } from 'emdash';
import type { ImageValue, PortableTextBlock } from 'emdash';

export const BLOG_PAGE_SIZE = 10;

type EmDashPostData = {
  title?: string;
  content?: PortableTextBlock[];
  meta_title?: string;
  meta_description?: string;
  description?: string;
  excerpt?: string;
  category?: string;
  author?: string;
  author_title?: string;
  pub_date?: string | Date;
  updated_date?: string | Date;
  press?: boolean;
  source_publication?: string;
  source_url?: string;
  source_author?: string;
  source_date?: string | Date;
  faq?: { question: string; answer: string }[];
  cover_image?: ImageValue | null;
  [key: string]: unknown;
};

export type Post = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  pubDate: Date;
  updatedDate?: Date;
  author: string;
  authorTitle?: string;
  metaTitle?: string;
  metaDescription?: string;
  description?: string;
  content?: PortableTextBlock[];
  faq?: { question: string; answer: string }[];
  press: boolean;
  sourcePublication?: string;
  sourceUrl?: string;
  sourceAuthor?: string;
  sourceDate?: Date;
  coverImage?: ImageValue | null;
};

type Entry = { id: string; data: EmDashPostData };
type CollectionResult = {
  entries?: Entry[];
  error?: unknown;
  nextCursor?: string;
  hasMore?: boolean;
};

const PORTABLE_TEXT_METADATA_FIELDS = new Set([
  '_key',
  '_type',
  'asset',
  'href',
  'id',
  'listItem',
  'markDefs',
  'marks',
  'provider',
  'src',
  'storageKey',
  'style',
  'url',
]);

function asDate(value: string | Date | undefined): Date | undefined {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.valueOf()) ? undefined : date;
}

function toPost(entry: Entry): Post {
  const { data } = entry;
  const pubDate = asDate(data.pub_date);
  if (!data.title || !pubDate) {
    throw new Error(`EmDash post "${entry.id}" is missing a title or valid pub_date.`);
  }

  return {
    slug: entry.id,
    title: data.title,
    excerpt: data.excerpt ?? data.description ?? data.meta_description ?? '',
    category: data.category ?? 'Insights',
    pubDate,
    updatedDate: asDate(data.updated_date),
    author: data.author ?? 'Michelle Shocron',
    authorTitle: data.author_title,
    metaTitle: data.meta_title,
    metaDescription: data.meta_description,
    description: data.description,
    content: data.content,
    faq: data.faq,
    press: data.press === true,
    sourcePublication: data.source_publication,
    sourceUrl: data.source_url,
    sourceAuthor: data.source_author,
    sourceDate: asDate(data.source_date),
    coverImage: data.cover_image,
  };
}

async function queryPage(
  page: { cursor?: string } | { offset: number } = {},
): Promise<CollectionResult> {
  const pagination = 'offset' in page ? { offset: page.offset } : { cursor: page.cursor };
  const result = (await getEmDashCollection('posts', {
    limit: BLOG_PAGE_SIZE,
    ...pagination,
    orderBy: { pub_date: 'desc' },
  })) as CollectionResult;
  if (result.error) throw result.error;
  return result;
}

/** Return a 1-based page of published posts using EmDash's documented offset API. */
export async function listPostsPage(page = 1): Promise<{
  posts: Post[];
  hasPrevious: boolean;
  hasNext: boolean;
}> {
  const requestedPage = Number.isSafeInteger(page) && page > 0 ? page : 1;
  const offset = (requestedPage - 1) * BLOG_PAGE_SIZE;
  if (!Number.isSafeInteger(offset)) {
    return { posts: [], hasPrevious: false, hasNext: false };
  }
  const result = await queryPage({ offset });

  return {
    posts: (result.entries ?? []).map(toPost),
    hasPrevious: requestedPage > 1,
    hasNext: Boolean(result.hasMore),
  };
}

/** Read all published posts. Used for sitemap generation and small press/related collections. */
export async function listAllPosts(): Promise<Post[]> {
  const posts: Post[] = [];
  let cursor: string | undefined;

  do {
    const result = await queryPage({ cursor });
    posts.push(...(result.entries ?? []).map(toPost));
    cursor = result.nextCursor;
  } while (cursor);

  return posts;
}

export async function getPost(slug: string): Promise<Post | null> {
  const result = (await getEmDashEntry('posts', slug)) as {
    entry?: Entry | null;
    error?: unknown;
  };
  if (result.error) throw result.error;
  return result.entry ? toPost(result.entry) : null;
}

export function formatPostDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

export function readingTimeMinutes(value: unknown): number {
  const text = portableTextToText(value);
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

export function portableTextToText(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(portableTextToText).join(' ');
  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !PORTABLE_TEXT_METADATA_FIELDS.has(key))
      .map(([, child]) => portableTextToText(child))
      .filter(Boolean)
      .join(' ');
  }
  return '';
}

/** Prevent embedded content from closing an inline JSON-LD script element. */
export function jsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}
