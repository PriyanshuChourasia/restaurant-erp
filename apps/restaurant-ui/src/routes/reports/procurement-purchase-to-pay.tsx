import { createFileRoute } from '@tanstack/react-router'
import { ConfigReportPage } from '../../modules/reports/pages/ConfigReportPage'

export const Route = createFileRoute('/reports/procurement-purchase-to-pay')({
  component: () => <ConfigReportPage reportId="procurement-purchase-to-pay" />,
})
