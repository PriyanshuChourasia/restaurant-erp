import { createFileRoute } from '@tanstack/react-router'
import { OrdersPage } from '../modules/orders/pages/OrdersPage'

export const Route = createFileRoute('/orders')({
  component: OrdersPage,
})
