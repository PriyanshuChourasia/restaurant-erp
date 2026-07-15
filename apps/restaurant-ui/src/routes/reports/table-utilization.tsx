import { createFileRoute } from '@tanstack/react-router'
import { ConfigReportPage } from '../../modules/reports/pages/ConfigReportPage'

export const Route = createFileRoute('/reports/table-utilization')({
  component: () => <ConfigReportPage reportId="table-utilization" />,
})
