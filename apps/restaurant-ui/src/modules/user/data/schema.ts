import { z } from 'zod'

export const userRoleEnum = z.enum(['admin', 'manager', 'chef', 'server', 'host', 'bartender'])
export const userStatusEnum = z.enum(['active', 'inactive', 'on_leave'])
export const shiftEnum = z.enum(['morning', 'evening', 'night'])

export const userSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  phone: z
    .string()
    .regex(/^\+?[\d\s\-()]{7,20}$/, 'Invalid phone number'),
  role: userRoleEnum,
  status: userStatusEnum,
  department: z.string().min(1, 'Department is required'),
  shift: shiftEnum,
  avatar: z.string().url().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export const profileFormSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  email: z
    .string()
    .email('Please enter a valid email address'),
  phone: z
    .string()
    .regex(/^\+?[\d\s\-()]{7,20}$/, 'Please enter a valid phone number'),
  role: userRoleEnum,
  department: z
    .string()
    .min(1, 'Department is required'),
  shift: shiftEnum,
  bio: z.string().max(500, 'Bio must be less than 500 characters'),
})

export type ProfileFormData = z.infer<typeof profileFormSchema>

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export type PasswordChangeData = z.infer<typeof passwordChangeSchema>
