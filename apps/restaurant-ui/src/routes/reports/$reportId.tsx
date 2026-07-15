import { createFileRoute } from '@tanstack/react-router'
import { GenericReportPage } from '../../modules/reports/pages/GenericReportPage'

export const Route = createFileRoute('/reports/$reportId')({
  component: ReportRoute,
})

function ReportRoute() {
  const { reportId } = Route.useParams()
  return <GenericReportPage reportId={reportId} />
}
