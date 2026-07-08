import { createFileRoute } from '@tanstack/react-router'
import { ReportsPage } from '../modules/reports/pages/ReportsPage'

export const Route = createFileRoute('/reports')({
  component: ReportsPage,
})
