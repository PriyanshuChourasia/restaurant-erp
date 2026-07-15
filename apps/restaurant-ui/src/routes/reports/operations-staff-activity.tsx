import { createFileRoute } from '@tanstack/react-router'
import { ConfigReportPage } from '../../modules/reports/pages/ConfigReportPage'

export const Route = createFileRoute('/reports/operations-staff-activity')({
  component: () => <ConfigReportPage reportId="operations-staff-activity" />,
})
