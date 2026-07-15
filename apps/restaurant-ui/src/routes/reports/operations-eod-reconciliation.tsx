import { createFileRoute } from '@tanstack/react-router'
import { ConfigReportPage } from '../../modules/reports/pages/ConfigReportPage'

export const Route = createFileRoute('/reports/operations-eod-reconciliation')({
  component: () => <ConfigReportPage reportId="operations-eod-reconciliation" />,
})
