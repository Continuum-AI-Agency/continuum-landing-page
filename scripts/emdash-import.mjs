#!/usr/bin/env node
/** Build an EmDash seed from the site's Astro Markdown blog collection. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'yaml';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const SOURCE_DIR = path.join(ROOT, 'src/content/blog');
const OUTPUT = path.join(ROOT, 'seed/seed.json');
const processor = unified().use(remarkParse).use(remarkGfm);

const metadataFields = [
  ['meta_title', 'Meta title', 'string'],
  ['meta_description', 'Meta description', 'text'],
  ['description', 'Description', 'text'],
  ['excerpt', 'Excerpt', 'text'],
  ['target_keyword', 'Target keyword', 'string'],
  ['audience', 'Audience', 'text'],
  ['category', 'Category', 'string'],
  ['type', 'Article type', 'string'],
  ['author', 'Author', 'string'],
  ['author_title', 'Author title', 'string'],
  ['pub_date', 'Publication date', 'datetime'],
  ['updated_date', 'Updated date', 'datetime'],
  ['press', 'Press coverage', 'boolean'],
  ['source_publication', 'Source publication', 'string'],
  ['source_url', 'Source URL', 'url'],
  ['source_author', 'Source author', 'string'],
  ['source_date', 'Source date', 'datetime'],
  ['notes', 'Editorial notes', 'text'],
];

const frontmatterToFields = {
  title: 'title',
  metaTitle: 'meta_title',
  metaDescription: 'meta_description',
  description: 'description',
  excerpt: 'excerpt',
  targetKeyword: 'target_keyword',
  audience: 'audience',
  category: 'category',
  type: 'type',
  author: 'author',
  authorTitle: 'author_title',
  pubDate: 'pub_date',
  updatedDate: 'updated_date',
  press: 'press',
  sourcePublication: 'source_publication',
  sourceUrl: 'source_url',
  sourceAuthor: 'source_author',
  sourceDate: 'source_date',
  notes: 'notes',
};

function key(prefix, serial) {
  return `${prefix}-${serial.toString(36)}`;
}

function inlineNodes(nodes, context, state) {
  const spans = [];
  for (const node of nodes ?? []) {
    if (node.type === 'text') {
      const marks = [...context.marks];
      if (context.link) {
        let def = context.linkDefs.get(context.link);
        if (def === undefined) {
          def = key('link', state.markSerial++);
          context.linkDefs.set(context.link, def);
          context.markDefs.push({ _key: def, _type: 'link', href: context.link });
        }
        marks.push(def);
      }
      if (node.value) spans.push({ _type: 'span', _key: key('span', state.spanSerial++), text: node.value, marks });
    } else if (node.type === 'inlineCode') {
      spans.push({ _type: 'span', _key: key('span', state.spanSerial++), text: node.value, marks: [...context.marks, 'code'] });
    } else if (node.type === 'strong' || node.type === 'emphasis' || node.type === 'delete') {
      const portableMark = ({ strong: 'strong', emphasis: 'em', delete: 'strike-through' })[node.type];
      spans.push(...inlineNodes(node.children, { ...context, marks: [...context.marks, portableMark] }, state));
    } else if (node.type === 'link') {
      spans.push(...inlineNodes(node.children, { ...context, link: node.url }, state));
    } else if (node.type === 'break') {
      spans.push({ _type: 'span', _key: key('span', state.spanSerial++), text: '\n', marks: [...context.marks] });
    } else if (node.type === 'image') {
      throw new Error(`Unsupported Markdown image '${node.url}' in blog content; add a media import mapping before migrating it.`);
    } else {
      throw new Error(`Unsupported inline Markdown node '${node.type}'; extend the EmDash importer before migrating it.`);
    }
  }
  return spans;
}

function inlineContext(block, state) {
  const markDefs = [];
  return {
    spans: inlineNodes(block.children, {
      marks: [],
      link: undefined,
      linkDefs: new Map(),
      markDefs,
    }, state),
    markDefs,
  };
}

function paragraphBlock(node, state, style = 'normal') {
  const { spans, markDefs } = inlineContext(node, state);
  return {
    _type: 'block',
    _key: key('block', state.blockSerial++),
    style,
    children: spans.length ? spans : [{ _type: 'span', _key: key('span', state.spanSerial++), text: '', marks: [] }],
    markDefs,
  };
}

function tableBlock(node, state) {
  // Match EmDash's built-in table editor, including rich cell spans and the
  // explicit header row and cell markers used by its native renderer.
  return {
    _type: 'table',
    _key: key('table', state.blockSerial++),
    rows: (node.children ?? []).map((row, rowIndex) => ({
      _type: 'tableRow',
      _key: key('row', state.rowSerial++),
      cells: (row.children ?? []).map((cell) => {
        const { spans, markDefs } = inlineContext(cell, state);
        return {
          _type: 'tableCell',
          _key: key('cell', state.cellSerial++),
          content: spans,
          markDefs,
          ...(rowIndex === 0 ? { isHeader: true } : {}),
        };
      }),
    })),
    hasHeaderRow: true,
  };
}

function listBlocks(node, state, level = 1) {
  const output = [];
  for (const item of node.children ?? []) {
    const paragraphs = (item.children ?? []).filter((child) => child.type === 'paragraph');
    const nested = (item.children ?? []).filter((child) => child.type === 'list');
    const unsupported = (item.children ?? []).filter((child) => child.type !== 'paragraph' && child.type !== 'list');
    if (unsupported.length) {
      throw new Error(`Unsupported list Markdown node '${unsupported[0].type}'; extend the EmDash importer before migrating it.`);
    }
    for (const paragraph of paragraphs) {
      const block = paragraphBlock(paragraph, state);
      block.listItem = node.ordered ? 'number' : 'bullet';
      block.level = level;
      output.push(block);
    }
    for (const list of nested) output.push(...listBlocks(list, state, level + 1));
  }
  return output;
}

export function markdownToPortableText(markdown) {
  const tree = processor.parse(markdown);
  const state = { blockSerial: 0, rowSerial: 0, cellSerial: 0, spanSerial: 0, markSerial: 0 };
  const result = [];
  for (const node of tree.children) {
    if (node.type === 'paragraph') result.push(paragraphBlock(node, state));
    else if (node.type === 'heading') result.push(paragraphBlock(node, state, `h${node.depth}`));
    else if (node.type === 'blockquote') {
      for (const child of node.children ?? []) {
        if (child.type === 'paragraph') result.push(paragraphBlock(child, state, 'blockquote'));
        else throw new Error(`Unsupported blockquote Markdown node '${child.type}'; extend the EmDash importer before migrating it.`);
      }
    } else if (node.type === 'list') result.push(...listBlocks(node, state));
    else if (node.type === 'table') result.push(tableBlock(node, state));
    else if (node.type === 'thematicBreak') result.push({ _type: 'break', _key: key('break', state.blockSerial++) });
    else if (node.type === 'code') {
      result.push({
        _type: 'code',
        _key: key('code', state.blockSerial++),
        code: node.value,
        language: node.lang ?? '',
      });
    } else throw new Error(`Unsupported Markdown block node '${node.type}'; extend the EmDash importer before migrating it.`);
  }
  return result;
}

export function parseMarkdownFile(filePath) {
  const source = fs.readFileSync(filePath, 'utf8');
  const match = source.match(/^---\s*\n([\s\S]*?)\n---\s*(?:\n|$)/);
  if (!match) throw new Error(`Missing YAML frontmatter: ${filePath}`);
  const metadata = yaml.parse(match[1]);
  if (!metadata?.title || !metadata?.metaDescription || !metadata?.pubDate) {
    throw new Error(`Missing required title, metaDescription, or pubDate: ${filePath}`);
  }
  const body = source.slice(match[0].length).trim();
  return { metadata, body };
}

function toIso(value) {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return `${value}T00:00:00.000Z`;
  return value;
}

export function buildSeed(sourceDir = SOURCE_DIR) {
  const files = fs.readdirSync(sourceDir).filter((file) => file.endsWith('.md')).sort();
  const content = files.map((file) => {
    const slug = file.replace(/\.md$/, '');
    const { metadata, body } = parseMarkdownFile(path.join(sourceDir, file));
    const data = { content: markdownToPortableText(body) };
    for (const [sourceKey, targetKey] of Object.entries(frontmatterToFields)) {
      if (metadata[sourceKey] !== undefined) {
        data[targetKey] = ['pub_date', 'updated_date', 'source_date'].includes(targetKey)
          ? toIso(metadata[sourceKey])
          : metadata[sourceKey];
      }
    }
    if (metadata.faq?.length) data.faq = metadata.faq.map(({ question, answer }) => ({ question, answer }));
    return {
      id: `blog-${slug}`,
      slug,
      status: metadata.draft ? 'draft' : 'published',
      data,
    };
  });

  return {
    $schema: 'https://emdashcms.com/seed.schema.json',
    version: '1',
    defaultLocale: 'en',
    meta: {
      name: 'Continuum Blog and Press',
      description: 'Existing Continuum blog and press entries migrated from Astro Markdown.',
      author: 'Continuum',
    },
    collections: [
      {
        slug: 'posts',
        label: 'Blog and press',
        labelSingular: 'Post',
        description: 'Editorial posts and founder press coverage.',
        supports: ['drafts', 'revisions', 'preview', 'scheduling', 'search', 'seo'],
        urlPattern: '/blog/{slug}',
        titleField: 'title',
        dateField: 'pub_date',
        fields: [
          { slug: 'title', label: 'Title', type: 'string', required: true },
          { slug: 'content', label: 'Content', type: 'portableText' },
          ...metadataFields.map(([slug, label, type]) => ({
            slug,
            label,
            type,
            ...(slug === 'meta_description' ? { required: true } : {}),
            ...(slug === 'pub_date' ? { required: true, indexed: true } : {}),
            ...(slug === 'category' ? { defaultValue: 'Insights' } : {}),
            ...(slug === 'author' ? { defaultValue: 'Michelle Shocron' } : {}),
            ...(slug === 'author_title' ? { defaultValue: 'Founder & CEO' } : {}),
            ...(slug === 'press' ? { defaultValue: false } : {}),
          })),
          {
            slug: 'faq',
            label: 'FAQs',
            type: 'repeater',
            validation: {
              subFields: [
                { slug: 'question', label: 'Question', type: 'text', required: true },
                { slug: 'answer', label: 'Answer', type: 'text', required: true },
              ],
            },
          },
          { slug: 'cover_image', label: 'Cover image', type: 'image' },
        ],
      },
    ],
    content: { posts: content },
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, `${JSON.stringify(buildSeed(), null, 2)}\n`);
  const count = fs.readdirSync(SOURCE_DIR).filter((file) => file.endsWith('.md')).length;
  console.log(`Wrote ${count} blog and press entries to ${path.relative(ROOT, OUTPUT)}.`);
}
