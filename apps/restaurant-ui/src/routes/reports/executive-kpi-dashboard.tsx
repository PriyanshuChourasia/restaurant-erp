import { createFileRoute } from '@tanstack/react-router'
import { ExecutiveKpiPage } from '../../modules/reports/pages/ExecutiveKpiPage'

export const Route = createFileRoute('/reports/executive-kpi-dashboard')({
  component: ExecutiveKpiPage,
})
