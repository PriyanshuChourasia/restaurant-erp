import { createFileRoute } from '@tanstack/react-router'
import { TrendAnalysisPage } from '../../modules/reports/pages/TrendAnalysisPage'

export const Route = createFileRoute('/reports/trends')({
  component: TrendAnalysisPage,
})
