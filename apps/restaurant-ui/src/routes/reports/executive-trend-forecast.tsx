import { createFileRoute } from '@tanstack/react-router'
import { ConfigReportPage } from '../../modules/reports/pages/ConfigReportPage'

export const Route = createFileRoute('/reports/executive-trend-forecast')({
  component: () => <ConfigReportPage reportId="executive-trend-forecast" />,
})
