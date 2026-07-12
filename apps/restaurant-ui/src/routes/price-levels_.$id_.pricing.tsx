import { createFileRoute } from '@tanstack/react-router'
import { PriceLevelPricingPage } from '../modules/price-level/pages/PriceLevelPricingPage'

export const Route = createFileRoute('/price-levels_/$id_/pricing')({
  component: function PriceLevelPricingRoute() {
    const { id } = Route.useParams()
    return <PriceLevelPricingPage priceLevelId={id} />
  },
})
