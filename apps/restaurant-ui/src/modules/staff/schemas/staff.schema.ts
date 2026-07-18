import { z } from 'zod'

export const createStaffSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100),
  phone: z.string().max(20).optional().or(z.literal('')),
  roleId: z.string().uuid('Please select a role'),
})

export type CreateStaffFormValues = z.infer<typeof createStaffSchema>
