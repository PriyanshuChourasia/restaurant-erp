import { createFileRoute } from '@tanstack/react-router'
import { PriceLevelFormPage } from '../modules/price-level/pages/PriceLevelFormPage'

export const Route = createFileRoute('/price-levels_/create')({
  component: function PriceLevelCreateRoute() {
    return <PriceLevelFormPage />
  },
})
