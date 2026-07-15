import { createFileRoute } from '@tanstack/react-router'
import { DiscountAnalysisPage } from '../../modules/reports/pages/DiscountAnalysisPage'

export const Route = createFileRoute('/reports/discount-analysis')({
  component: DiscountAnalysisPage,
})
