import { createFileRoute } from '@tanstack/react-router'
import { HealthScorecardPage } from '../../modules/reports/pages/HealthScorecardPage'

export const Route = createFileRoute('/reports/executive-health-scorecard')({
  component: HealthScorecardPage,
})
