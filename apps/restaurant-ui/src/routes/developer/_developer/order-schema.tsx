import { createFileRoute } from '@tanstack/react-router'
import { OrderSchemaPage } from '@/modules/developer/pages/order-schema-page'

export const Route = createFileRoute('/developer/_developer/order-schema')({
  component: OrderSchemaPage,
})
