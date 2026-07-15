import { createFileRoute } from '@tanstack/react-router'
import { ConfigReportPage } from '../../modules/reports/pages/ConfigReportPage'

export const Route = createFileRoute('/reports/reservation-no-show')({
  component: () => <ConfigReportPage reportId="reservation-no-show" />,
})
