import { createFileRoute } from '@tanstack/react-router'
import { ConfigReportPage } from '../../modules/reports/pages/ConfigReportPage'

export const Route = createFileRoute('/reports/executive-profitability')({
  component: () => <ConfigReportPage reportId="executive-profitability" />,
})
