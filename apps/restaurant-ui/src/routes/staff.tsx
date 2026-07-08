import { createFileRoute } from '@tanstack/react-router'
import { StaffPage } from '../modules/staff/pages/StaffPage'

export const Route = createFileRoute('/staff')({
  component: StaffPage,
})
