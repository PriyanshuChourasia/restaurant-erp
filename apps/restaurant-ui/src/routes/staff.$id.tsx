import { createFileRoute } from '@tanstack/react-router'
import { StaffDetailPage } from '../modules/staff/pages/StaffDetailPage'

export const Route = createFileRoute('/staff/$id')({
  component: StaffDetailPage,
})
