import { z } from 'zod'

export const documentTypeSchema = z.enum([
  'invoice',
  'receipt',
  'purchase_order',
  'delivery_note',
  'quotation',
  'contract',
  'license',
  'certificate',
  'other',
])

export const documentStatusSchema = z.enum([
  'draft',
  'pending',
  'approved',
  'rejected',
  'archived',
])

export const createDocumentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  type: documentTypeSchema.default('other'),
  status: documentStatusSchema.default('draft'),
  description: z.string().max(500).optional().or(z.literal('')),
  fileName: z.string().max(255).optional().or(z.literal('')),
  filePath: z.string().max(500).optional().or(z.literal('')),
  mimeType: z.string().max(100).optional().or(z.literal('')),
  linkedEntityType: z.string().max(50).optional().or(z.literal('')),
  linkedEntityId: z.string().optional().or(z.literal('')),
  documentDate: z.string().optional().or(z.literal('')),
  expiryDate: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
})

export type CreateDocumentFormValues = z.infer<typeof createDocumentSchema>

export const updateDocumentSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  type: documentTypeSchema.optional(),
  status: documentStatusSchema.optional(),
  description: z.string().max(500).optional().or(z.literal('')),
  fileName: z.string().max(255).optional().or(z.literal('')),
  filePath: z.string().max(500).optional().or(z.literal('')),
  mimeType: z.string().max(100).optional().or(z.literal('')),
  linkedEntityType: z.string().max(50).optional().or(z.literal('')),
  linkedEntityId: z.string().optional().or(z.literal('')),
  documentDate: z.string().optional().or(z.literal('')),
  expiryDate: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
})

export type UpdateDocumentFormValues = z.infer<typeof updateDocumentSchema>
