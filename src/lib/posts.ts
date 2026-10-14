import { createClient } from '@sanity/client';
import { createImageUrlBuilder, type SanityImageSource } from '@sanity/image-url';
import type { TypedObject } from 'astro-portabletext/types';

// Public project and dataset: the site reads published posts without a token.
const sanity = { projectId: 'ermndauy', dataset: 'production' };
const client = createClient({ ...sanity, apiVersion: '2025-02-19', useCdn: false, perspective: 'published' });
const images = createImageUrlBuilder(sanity);

/** Image URL builder for Sanity image fields (cover images, body images). */
export const imageUrl = (source: SanityImageSource) => images.image(source).auto('format');

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
  metaDescription: string;
  content?: TypedObject[];
  faq?: { question: string; answer: string }[];
  press: boolean;
  sourcePublication?: string;
  sourceUrl?: string;
  sourceAuthor?: string;
  sourceDate?: Date;
  coverImage?: SanityImageSource & { alt?: string };
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

const POSTS_QUERY = `*[_type == "post" && defined(slug.current)] | order(pubDate desc) {
  "slug": slug.current, title, excerpt, category, pubDate, updatedDate, author, authorTitle,
  metaTitle, metaDescription, content, faq[]{question, answer}, press,
  sourcePublication, sourceUrl, sourceAuthor, sourceDate, coverImage
}`;

type PostRow = Omit<Post, 'pubDate' | 'updatedDate' | 'sourceDate' | 'press'> & {
  pubDate: string;
  updatedDate?: string;
  sourceDate?: string;
  press?: boolean;
};

const asDate = (value?: string) => (value ? new Date(value) : undefined);

let allPosts: Promise<Post[]> | undefined;

/** Every published post, newest first. Fetched once per build; every page shares the result. */
// ponytail: cached for the process lifetime, so `astro dev` needs a restart to show new Sanity edits.
export function listAllPosts(): Promise<Post[]> {
  allPosts ??= client.fetch<PostRow[]>(POSTS_QUERY).then((rows) =>
    rows.map((row) => ({
      ...row,
      excerpt: row.excerpt ?? row.metaDescription,
      press: row.press === true,
      pubDate: new Date(row.pubDate),
      updatedDate: asDate(row.updatedDate),
      sourceDate: asDate(row.sourceDate),
    })),
  );
  return allPosts;
}

export async function getPost(slug: string): Promise<Post | null> {
  return (await listAllPosts()).find((post) => post.slug === slug) ?? null;
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
