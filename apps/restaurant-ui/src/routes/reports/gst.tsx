import { createFileRoute } from '@tanstack/react-router'
import { GstReportPage } from '../../modules/reports/pages/GstReportPage'

export const Route = createFileRoute('/reports/gst')({
  component: GstReportPage,
})
