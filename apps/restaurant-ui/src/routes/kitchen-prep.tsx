import { createFileRoute } from '@tanstack/react-router'
import { KitchenPrepPage } from '../modules/recipes/pages/KitchenPrepPage'

export const Route = createFileRoute('/kitchen-prep')({
  component: KitchenPrepPage,
})
