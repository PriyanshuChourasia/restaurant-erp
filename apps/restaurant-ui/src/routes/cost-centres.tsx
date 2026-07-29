import { createFileRoute } from '@tanstack/react-router'
import { CostCentresPage } from '../modules/cost-centres/pages/CostCentresPage'

export const Route = createFileRoute('/cost-centres')({
  component: CostCentresPage,
})
