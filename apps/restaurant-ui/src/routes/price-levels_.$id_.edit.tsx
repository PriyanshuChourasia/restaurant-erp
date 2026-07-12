import { createFileRoute } from '@tanstack/react-router'
import { PriceLevelFormPage } from '../modules/price-level/pages/PriceLevelFormPage'

export const Route = createFileRoute('/price-levels_/$id_/edit')({
  component: function PriceLevelEditRoute() {
    const { id } = Route.useParams()
    return <PriceLevelFormPage priceLevelId={id} />
  },
})
