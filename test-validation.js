const { z } = require('zod');

const mediaItemSchema = z.object({
  id: z.string(),
  file: z.any().nullable(),
  preview: z.string(),
  type: z.enum(['image', 'video']),
  order: z.number(),
  isPrimary: z.boolean(),
  isGroupPrimary: z.boolean().optional(),
});

const variantMediaSchema = z.object({
  key: z.string(),
  attributeValues: z.record(z.string(), z.string()),
  media: z.array(mediaItemSchema).min(1, 'Required'),
});

const schema = z.object({
    variantMedia: z.array(variantMediaSchema).min(2, 'Expected 2 media variants')
});

const data = {
    variantMedia: [
        {
            key: '1',
            attributeValues: { '3': '6' },
            media: []
        },
        {
            key: '2',
            attributeValues: { '3': '7' },
            media: [{ id: '1', file: null, preview: 'test', type: 'image', order: 0, isPrimary: true }]
        }
    ]
};

const result = schema.safeParse(data);
if (!result.success) {
    for (const issue of result.error.issues) {
        console.log("path:", issue.path.join('.'), " -> ", issue.message);
    }
}
