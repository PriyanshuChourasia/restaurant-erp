import { createFileRoute } from '@tanstack/react-router'
import { AccountNatureSchemaPage } from '@/modules/developer/pages/account-nature-schema-page'

export const Route = createFileRoute('/developer/_developer/account-nature-schema')({
  component: AccountNatureSchemaPage,
})
