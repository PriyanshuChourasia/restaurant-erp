import { createFileRoute } from '@tanstack/react-router'
import { InvoiceDrillDownPage } from '../../modules/reports/pages/InvoiceDrillDownPage'

export const Route = createFileRoute('/reports/invoice-drilldown')({
  component: InvoiceDrillDownPage,
})
