import { createFileRoute } from '@tanstack/react-router'
import { ConfigReportPage } from '../../modules/reports/pages/ConfigReportPage'

export const Route = createFileRoute('/reports/operations-weekly-review')({
  component: () => <ConfigReportPage reportId="operations-weekly-review" />,
})
