import { createFileRoute } from '@tanstack/react-router'
import { ItemListPage } from '../modules/items/pages/ItemListPage'

export const Route = createFileRoute('/items')({
  component: ItemListPage,
})
