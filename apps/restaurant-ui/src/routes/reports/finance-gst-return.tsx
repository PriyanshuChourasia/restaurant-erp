import { createFileRoute } from '@tanstack/react-router'
import { ConfigReportPage } from '../../modules/reports/pages/ConfigReportPage'

export const Route = createFileRoute('/reports/finance-gst-return')({
  component: () => <ConfigReportPage reportId="finance-gst-return" />,
})
