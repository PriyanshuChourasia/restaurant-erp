import { z } from 'zod'

export const createUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100),
  phone: z.string().max(20).optional().or(z.literal('')),
  roleId: z.string().uuid().optional().or(z.literal('')),
})

export type CreateUserFormValues = z.infer<typeof createUserSchema>

export const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(20).optional().or(z.literal('')),
  roleId: z.string().uuid().optional().or(z.literal('')),
  isActive: z.boolean().optional(),
})

export type UpdateUserFormValues = z.infer<typeof updateUserSchema>
