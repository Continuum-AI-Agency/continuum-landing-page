import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    metaTitle: z.string().optional(),
    metaDescription: z.string(),
    description: z.string().optional(),
    excerpt: z.string().optional(),
    targetKeyword: z.string().optional(),
    audience: z.string().optional(),
    category: z.string().default('Insights'),
    type: z.string().optional(),
    author: z.string().default('Michelle Shocron'),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    draft: z.boolean().default(false),
    // Press / media coverage of the founder. `press: true` surfaces the post on /press.
    press: z.boolean().default(false),
    sourcePublication: z.string().optional(),
    sourceUrl: z.string().url().optional(),
    sourceAuthor: z.string().optional(),
    sourceDate: z.coerce.date().optional(),
    // Structured FAQ powers the FAQPage JSON-LD (Answer Engine Optimization).
    faq: z
      .array(
        z.object({
          question: z.string(),
          answer: z.string(),
        }),
      )
      .optional(),
  }),
});

export const collections = { blog };
