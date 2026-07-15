import { createFileRoute } from '@tanstack/react-router'
import { ConfigReportPage } from '../../modules/reports/pages/ConfigReportPage'

export const Route = createFileRoute('/reports/procurement-monthly-trend')({
  component: () => <ConfigReportPage reportId="procurement-monthly-trend" />,
})
