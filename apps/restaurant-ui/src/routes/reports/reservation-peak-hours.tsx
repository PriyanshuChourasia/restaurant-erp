import { createFileRoute } from '@tanstack/react-router'
import { ConfigReportPage } from '../../modules/reports/pages/ConfigReportPage'

export const Route = createFileRoute('/reports/reservation-peak-hours')({
  component: () => <ConfigReportPage reportId="reservation-peak-hours" />,
})
