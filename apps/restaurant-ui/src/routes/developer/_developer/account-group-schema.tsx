import { createFileRoute } from '@tanstack/react-router'
import { AccountGroupSchemaPage } from '@/modules/developer/pages/account-group-schema-page'

export const Route = createFileRoute('/developer/_developer/account-group-schema')({
  component: AccountGroupSchemaPage,
})
