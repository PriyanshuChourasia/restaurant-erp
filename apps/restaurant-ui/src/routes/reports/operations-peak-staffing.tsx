import { createFileRoute } from '@tanstack/react-router'
import { ConfigReportPage } from '../../modules/reports/pages/ConfigReportPage'

export const Route = createFileRoute('/reports/operations-peak-staffing')({
  component: () => <ConfigReportPage reportId="operations-peak-staffing" />,
})
