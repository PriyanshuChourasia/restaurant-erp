import { createFileRoute } from '@tanstack/react-router'
import { VoucherSchemaPage } from '@/modules/developer/pages/voucher-schema-page'

export const Route = createFileRoute('/developer/_developer/voucher-schema')({
  component: VoucherSchemaPage,
})
