import { createFileRoute } from '@tanstack/react-router'
import { ConfigReportPage } from '../../modules/reports/pages/ConfigReportPage'

export const Route = createFileRoute('/reports/kitchen-item-frequency')({
  component: () => <ConfigReportPage reportId="kitchen-item-frequency" />,
})
