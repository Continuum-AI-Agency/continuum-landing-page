import {defineArrayMember, defineField, defineType} from 'sanity'

// Links may be internal ("/blog/...") as well as full URLs; internal links help SEO.
const link = {
  name: 'link',
  type: 'object',
  title: 'Link',
  fields: [
    defineField({
      name: 'href',
      type: 'url',
      title: 'URL',
      validation: (rule) =>
        rule.required().uri({allowRelative: true, scheme: ['http', 'https', 'mailto', 'tel']}),
    }),
  ],
}

const decorators = [
  {title: 'Bold', value: 'strong'},
  {title: 'Italic', value: 'em'},
  {title: 'Code', value: 'code'},
  {title: 'Strike', value: 'strike-through'},
]

/** Post body. No H1: the page renders the title as the only h1. */
export const content = defineType({
  name: 'content',
  title: 'Body',
  type: 'array',
  of: [
    defineArrayMember({
      type: 'block',
      styles: [
        {title: 'Paragraph', value: 'normal'},
        {title: 'Heading', value: 'h2'},
        {title: 'Subheading', value: 'h3'},
        {title: 'Quote', value: 'blockquote'},
      ],
      lists: [
        {title: 'Bullets', value: 'bullet'},
        {title: 'Numbered', value: 'number'},
      ],
      marks: {decorators, annotations: [link]},
    }),
    defineArrayMember({
      type: 'image',
      options: {hotspot: true},
      fields: [
        defineField({
          name: 'alt',
          type: 'string',
          title: 'Alt text',
          description: 'Describe the image for screen readers and search engines.',
          validation: (rule) => rule.required(),
        }),
      ],
    }),
    defineArrayMember({type: 'table'}),
    defineArrayMember({type: 'break'}),
  ],
})

export const table = defineType({
  name: 'table',
  title: 'Table',
  type: 'object',
  fields: [
    defineField({
      name: 'rows',
      type: 'array',
      description: 'The first row is the header.',
      of: [defineArrayMember({type: 'tableRow'})],
    }),
  ],
  preview: {
    select: {rows: 'rows'},
    prepare: ({rows}) => ({title: `Table, ${rows?.length ?? 0} rows`}),
  },
})

export const tableRow = defineType({
  name: 'tableRow',
  title: 'Row',
  type: 'object',
  fields: [defineField({name: 'cells', type: 'array', of: [defineArrayMember({type: 'tableCell'})]})],
  preview: {
    select: {cells: 'cells'},
    prepare: ({cells}) => ({
      title: (cells ?? [])
        .map((cell: {content?: {children?: {text?: string}[]}[]}) =>
          (cell.content?.[0]?.children ?? []).map((span) => span.text).join(''),
        )
        .join(' | '),
    }),
  },
})

export const tableCell = defineType({
  name: 'tableCell',
  title: 'Cell',
  type: 'object',
  fields: [
    defineField({name: 'isHeader', type: 'boolean', title: 'Header cell'}),
    defineField({
      name: 'content',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'block',
          styles: [{title: 'Paragraph', value: 'normal'}],
          lists: [],
          marks: {decorators, annotations: [link]},
        }),
      ],
    }),
  ],
})

export const lineBreak = defineType({
  name: 'break',
  title: 'Divider',
  type: 'object',
  fields: [
    defineField({
      name: 'style',
      type: 'string',
      initialValue: 'line',
      options: {list: [{title: 'Line', value: 'line'}]},
    }),
  ],
  preview: {prepare: () => ({title: '────── Divider ──────'})},
})

export const faqItem = defineType({
  name: 'faqItem',
  title: 'Question',
  type: 'object',
  fields: [
    defineField({name: 'question', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'answer', type: 'text', rows: 3, validation: (rule) => rule.required()}),
  ],
  preview: {select: {title: 'question', subtitle: 'answer'}},
})
