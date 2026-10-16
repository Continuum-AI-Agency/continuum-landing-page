import type { APIRoute } from 'astro';
import { listAllPosts } from '../lib/posts';

const escapeXml = (value: string) => value.replace(/[<>&"']/g, (char) => ({
  '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;',
}[char]!));

export const GET: APIRoute = async ({ site }) => {
  const base = site ?? new URL('https://trycontinuum.ai');
  const pages = ['/', '/about/', '/blog/', '/press/', '/podcasts/', '/social-plus/', '/technology/'];
  const posts = await listAllPosts();
  const urls = [
    ...pages.map((path) => `<url><loc>${escapeXml(new URL(path, base).href)}</loc></url>`),
    ...posts.map((post) => `<url><loc>${escapeXml(new URL(`/blog/${post.slug}/`, base).href)}</loc><lastmod>${(post.updatedDate ?? post.pubDate).toISOString()}</lastmod></url>`),
  ];
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}</urlset>`, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
