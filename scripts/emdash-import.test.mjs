import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { buildSeed, markdownToPortableText } from './emdash-import.mjs';

test('Markdown conversion keeps inline marks, links, nested lists, quotes, and native tables', () => {
  const blocks = markdownToPortableText([
    '# Heading',
    '',
    'A **bold** and *italic* [linked phrase](https://example.com) with `code`.',
    '',
    '> A quoted line.',
    '',
    '- Parent',
    '  - Child',
    '',
    '| Column A | Column B |',
    '| --- | --- |',
    '| **Cell** | Value |',
  ].join('\n'));

  assert.equal(blocks[0].style, 'h1');
  const paragraph = blocks[1];
  assert.ok(paragraph.children.some((span) => span.text === 'bold' && span.marks.includes('strong')));
  assert.ok(paragraph.children.some((span) => span.text === 'italic' && span.marks.includes('em')));
  assert.ok(paragraph.children.some((span) => span.text === 'code' && span.marks.includes('code')));
  assert.ok(paragraph.markDefs.some((mark) => mark._type === 'link' && mark.href === 'https://example.com'));
  assert.ok(blocks.some((block) => block.style === 'blockquote'));

  const list = blocks.filter((block) => block.listItem);
  assert.equal(list.length, 2);
  assert.equal(list[0].level, 1);
  assert.equal(list[1].level, 2);
  assert.equal(list[0].listItem, 'bullet');

  const table = blocks.find((block) => block._type === 'table');
  assert.equal(table.hasHeaderRow, true);
  assert.equal(table.rows[0].cells[0].isHeader, true);
  assert.ok(table.rows[1].cells[0].content.some((span) => span.text === 'Cell' && span.marks.includes('strong')));
  assert.equal(table.rows[1].cells[1].content[0].text, 'Value');
  assert.ok(table.rows[1].cells[1].content[0]._key);
});

test('seed keeps all local post slugs, press metadata, draft state, and FAQs', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'emdash-seed-'));
  try {
    fs.writeFileSync(path.join(tempDir, 'press-story.md'), [
      '---',
      'title: A Press Story',
      'metaDescription: Search description',
      'pubDate: 2025-01-02',
      'press: true',
      'sourcePublication: Example News',
      'sourceUrl: https://example.com/story',
      'sourceAuthor: Reporter Name',
      'sourceDate: 2024-12-30',
      'faq:',
      '  - question: How?',
      '    answer: This way.',
      '---',
      '',
      'Article body.',
    ].join('\n'));
    fs.writeFileSync(path.join(tempDir, 'draft.md'), [
      '---',
      'title: Draft Story',
      'metaDescription: Draft description',
      'pubDate: 2025-01-03',
      'draft: true',
      '---',
      '',
      'Draft body.',
    ].join('\n'));

    const seed = buildSeed(tempDir);
    assert.equal(seed.version, '1');
    assert.equal(seed.$schema, 'https://emdashcms.com/seed.schema.json');
    assert.equal(seed.collections[0].slug, 'posts');
    assert.equal(seed.collections[0].urlPattern, '/blog/{slug}');
    assert.equal(seed.collections[0].fields.find((field) => field.slug === 'source_url').type, 'url');
    assert.equal(seed.collections[0].fields.find((field) => field.slug === 'pub_date').indexed, true);
    assert.deepEqual(seed.collections[0].fields.find((field) => field.slug === 'faq').validation.subFields.map(({ slug }) => slug), ['question', 'answer']);

    const [draft, press] = seed.content.posts;
    assert.equal(draft.slug, 'draft');
    assert.equal(draft.status, 'draft');
    assert.equal('draft' in draft.data, false);
    assert.equal(draft.data.pub_date, '2025-01-03T00:00:00.000Z');
    assert.equal(press.slug, 'press-story');
    assert.equal(press.id, 'blog-press-story');
    assert.equal(press.status, 'published');
    assert.equal(press.data.press, true);
    assert.equal(press.data.source_publication, 'Example News');
    assert.equal(press.data.source_url, 'https://example.com/story');
    assert.equal(press.data.source_author, 'Reporter Name');
    assert.equal(press.data.source_date, '2024-12-30T00:00:00.000Z');
    assert.deepEqual(press.data.faq, [{ question: 'How?', answer: 'This way.' }]);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('current blog migration includes every local entry and preserves both rich tables', () => {
  const seed = buildSeed();
  const posts = seed.content.posts;
  const tables = posts.flatMap((post) =>
    post.data.content.filter((block) => block._type === 'table').map((table) => ({ slug: post.slug, table })),
  );

  assert.equal(posts.length, 14);
  assert.equal(posts.filter((post) => post.data.press).length, 4);
  assert.equal(posts.filter((post) => post.status === 'draft').length, 0);
  assert.deepEqual(tables.map(({ slug }) => slug).sort(), ['legacy-vs-ai-native-dco', 'the-creative-factory']);
  for (const { table } of tables) {
    assert.equal(table.hasHeaderRow, true);
    assert.ok(table.rows[0].cells.every((cell) => cell.isHeader));
    assert.ok(table.rows.flatMap((row) => row.cells).some((cell) => cell.content.some((span) => span.marks.includes('strong'))));
  }
});
