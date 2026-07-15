import { z } from 'zod'

export const kotStatusSchema = z.enum(['pending', 'preparing', 'ready', 'served', 'cancelled'])

export const kotStationSchema = z.enum(['main_kitchen', 'tandoor', 'beverages', 'desserts', 'snacks'])

export const createKotItemSchema = z.object({
  itemId: z.string().min(1, 'Item is required'),
  itemName: z.string().min(1, 'Item name is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  instructions: z.string().optional(),
})

export const createKotSchema = z.object({
  station: kotStationSchema,
  notes: z.string().optional(),
  tableIds: z.array(z.string()).optional(),
  items: z.array(createKotItemSchema).min(1, 'At least one item is required'),
})

export type CreateKotFormValues = z.infer<typeof createKotSchema>
