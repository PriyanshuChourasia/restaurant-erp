import { createFileRoute } from '@tanstack/react-router'
import { CreateItemPage } from '../modules/items/pages/CreateItemPage'

export const Route = createFileRoute('/items_/create')({
  component: CreateItemPage,
})
