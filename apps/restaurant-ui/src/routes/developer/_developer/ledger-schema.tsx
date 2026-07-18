import { createFileRoute } from '@tanstack/react-router'
import { LedgerSchemaPage } from '@/modules/developer/pages/ledger-schema-page'

export const Route = createFileRoute('/developer/_developer/ledger-schema')({
  component: LedgerSchemaPage,
})
