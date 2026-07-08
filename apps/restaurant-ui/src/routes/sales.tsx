import { createFileRoute } from '@tanstack/react-router'
import { SalesPage } from '../modules/sales/pages/SalesPage'

export const Route = createFileRoute('/sales')({
  component: SalesPage,
})
