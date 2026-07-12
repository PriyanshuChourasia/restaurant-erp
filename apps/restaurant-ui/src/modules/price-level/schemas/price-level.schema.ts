import { z } from 'zod'

export const priceLevelFormSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(255, 'Name must be less than 255 characters'),
  code: z
    .string()
    .min(1, 'Code is required')
    .max(100, 'Code must be less than 100 characters')
    .regex(
      /^[a-z0-9-]+$/,
      'Code must contain only lowercase alphanumeric characters and hyphens',
    ),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional()
    .nullable(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
})

export type PriceLevelFormValues = z.infer<typeof priceLevelFormSchema>
