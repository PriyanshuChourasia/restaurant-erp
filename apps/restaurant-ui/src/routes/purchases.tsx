import { createFileRoute } from '@tanstack/react-router'
import { PurchasesPage } from '../modules/purchases/pages/PurchasesPage'

export const Route = createFileRoute('/purchases')({
  component: PurchasesPage,
})
