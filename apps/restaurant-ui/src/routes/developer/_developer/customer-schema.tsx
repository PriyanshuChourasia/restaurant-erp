import { createFileRoute } from '@tanstack/react-router'
import { CustomerSchemaPage } from '@/modules/developer/pages/customer-schema-page'

export const Route = createFileRoute('/developer/_developer/customer-schema')({
  component: CustomerSchemaPage,
})
