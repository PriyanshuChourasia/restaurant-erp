import { createFileRoute } from '@tanstack/react-router'
import { PriceLevelListPage } from '../modules/price-level/pages/PriceLevelListPage'

export const Route = createFileRoute('/price-levels')({
  component: PriceLevelListPage,
})
