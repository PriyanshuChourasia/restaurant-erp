import { createFileRoute } from '@tanstack/react-router'
import { SupplierPerformancePage } from '../../modules/reports/pages/SupplierPerformancePage'

export const Route = createFileRoute('/reports/procurement-supplier-performance')({
  component: SupplierPerformancePage,
})
