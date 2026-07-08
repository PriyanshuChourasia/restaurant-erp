import { createFileRoute } from '@tanstack/react-router'
import { LedgerPage } from '../modules/ledger/pages/LedgerPage'

export const Route = createFileRoute('/ledger')({
  component: LedgerPage,
})
