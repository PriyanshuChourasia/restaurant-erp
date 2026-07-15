import { createFileRoute } from '@tanstack/react-router'
import { ConfigReportPage } from '../../modules/reports/pages/ConfigReportPage'

export const Route = createFileRoute('/reports/kitchen-dietary-mix')({
  component: () => <ConfigReportPage reportId="kitchen-dietary-mix" />,
})
