import { createFileRoute } from '@tanstack/react-router'
import { ConfigReportPage } from '../../modules/reports/pages/ConfigReportPage'

export const Route = createFileRoute('/reports/kitchen-station-load')({
  component: () => <ConfigReportPage reportId="kitchen-station-load" />,
})
