import { createFileRoute } from '@tanstack/react-router'
import { PaymentMethodPage } from '../../modules/reports/pages/PaymentMethodPage'

export const Route = createFileRoute('/reports/payment-methods')({
  component: PaymentMethodPage,
})
