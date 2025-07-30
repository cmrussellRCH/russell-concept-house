export default {
  name: 'article',
  title: 'Article',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: Rule => Rule.required()
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96
      },
      validation: Rule => Rule.required()
    },
    {
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          { title: 'Design', value: 'design' },
          { title: 'Objects', value: 'objects' },
          { title: 'Crafts', value: 'crafts' },
          { title: 'Art', value: 'art' },
          { title: 'Pottery', value: 'pottery' },
          { title: 'Textiles', value: 'textiles' },
          { title: 'Lifestyle', value: 'lifestyle' },
          { title: 'Interior', value: 'interior' }
        ]
      },
      validation: Rule => Rule.required()
    },
    {
      name: 'mainImage',
      title: 'Main Image',
      type: 'image',
      description: 'The main hero image for the article',
      options: {
        hotspot: true
      },
      validation: Rule => Rule.required()
    },
    {
      name: 'excerpt',
      title: 'Excerpt',
      type: 'text',
      rows: 3,
      description: 'A short description of the article'
    },
    {
      name: 'publishedAt',
      title: 'Published at',
      type: 'datetime',
      initialValue: () => new Date().toISOString()
    },
    {
      name: 'author',
      title: 'Author',
      type: 'string',
      initialValue: 'Russell Concept House'
    },
    {
      name: 'body',
      title: 'Body',
      type: 'array',
      of: [
        {
          type: 'block',
          styles: [
            { title: 'Normal', value: 'normal' },
            { title: 'H2', value: 'h2' },
            { title: 'H3', value: 'h3' },
            { title: 'Quote', value: 'blockquote' }
          ],
          marks: {
            decorators: [
              { title: 'Strong', value: 'strong' },
              { title: 'Emphasis', value: 'em' }
            ],
            annotations: [
              {
                title: 'URL',
                name: 'link',
                type: 'object',
                fields: [
                  {
                    title: 'URL',
                    name: 'href',
                    type: 'url'
                  }
                ]
              }
            ]
          }
        },
        {
          type: 'image',
          title: 'Image',
          options: {
            hotspot: true
          }
        }
      ]
    },
    {
      name: 'mediaType',
      title: 'Media Type',
      type: 'string',
      options: {
        list: [
          { title: 'Images', value: 'images' },
          { title: 'Video', value: 'video' }
        ],
        layout: 'radio'
      },
      initialValue: 'images',
      description: 'Choose between image gallery or video for this article'
    },
    {
      name: 'videoUrl',
      title: 'YouTube Video URL',
      type: 'url',
      hidden: ({ document }) => document?.mediaType !== 'video',
      validation: Rule => Rule.custom((url, context) => {
        if (context.document?.mediaType === 'video') {
          if (!url) {
            return 'Video URL is required when media type is video'
          }
          const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/)|youtu\.be\/)[\w-]+(&[\w=]*)?$/
          if (!youtubeRegex.test(url)) {
            return 'Please enter a valid YouTube URL'
          }
        }
        return true
      }),
      description: 'Enter the YouTube video URL (e.g., https://www.youtube.com/watch?v=VIDEO_ID)'
    },
    {
      name: 'videoDuration',
      title: 'Video Duration',
      type: 'string',
      description: 'Enter video duration in M:SS or MM:SS format (e.g., 3:08 or 15:42)',
      validation: Rule => Rule.regex(/^\d{1,2}:\d{2}$/, {
        name: 'duration',
        invert: false
      }).error('Duration must be in M:SS or MM:SS format (e.g., 3:08)'),
      hidden: ({ document }) => document?.mediaType !== 'video',
    },
    {
      name: 'gallery',
      title: 'Image Gallery',
      type: 'array',
      of: [
        {
          type: 'image',
          options: {
            hotspot: true
          }
        }
      ],
      hidden: ({ document }) => document?.mediaType === 'video',
      description: 'Additional images for the article'
    },
    {
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        layout: 'tags'
      }
    }
  ],
  preview: {
    select: {
      title: 'title',
      author: 'author',
      media: 'mainImage'
    },
    prepare(selection) {
      const { author } = selection
      return { ...selection, subtitle: author && `by ${author}` }
    }
  }
}