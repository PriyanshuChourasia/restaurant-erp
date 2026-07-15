import { createFileRoute } from '@tanstack/react-router'
import { ConfigReportPage } from "../../modules/reports/pages/ConfigReportPage"

export const Route = createFileRoute('/reports/executive-comparative')({
  component: () => <ConfigReportPage reportId="executive-comparative" />,
})
