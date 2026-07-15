import { createFileRoute } from '@tanstack/react-router'
import { VouchersPage } from '../modules/vouchers/pages/VouchersPage'

export const Route = createFileRoute('/vouchers')({
  component: VouchersPage,
})
