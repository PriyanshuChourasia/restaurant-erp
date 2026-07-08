import { z } from 'zod'

export const categoryFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(255, 'Name must be less than 255 characters'),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(255, 'Slug must be less than 255 characters')
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Slug must contain only lowercase alphanumeric characters and hyphens',
    ),
  description: z
    .string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional()
    .nullable(),
  parentId: z.string().uuid('Invalid parent').optional().nullable(),
  displayOrder: z
    .number()
    .int('Display order must be a whole number')
    .min(0, 'Display order cannot be negative')
    .optional(),
  isActive: z.boolean().optional(),
  icon: z
    .string()
    .max(500, 'Icon URL must be less than 500 characters')
    .optional()
    .nullable(),
  image: z
    .string()
    .max(500, 'Image URL must be less than 500 characters')
    .url('Image must be a valid URL')
    .optional()
    .nullable()
    .or(z.literal('')),
})

export type CategoryFormValues = z.infer<typeof categoryFormSchema>

export const moveCategorySchema = z.object({
  parentId: z.string().uuid('Select a valid category').optional().nullable(),
})

export type MoveCategoryFormValues = z.infer<typeof moveCategorySchema>
