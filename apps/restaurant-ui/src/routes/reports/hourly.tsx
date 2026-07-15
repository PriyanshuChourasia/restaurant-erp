import { createFileRoute } from '@tanstack/react-router'
import { HourlyDistributionPage } from '../../modules/reports/pages/HourlyDistributionPage'

export const Route = createFileRoute('/reports/hourly')({
  component: HourlyDistributionPage,
})
