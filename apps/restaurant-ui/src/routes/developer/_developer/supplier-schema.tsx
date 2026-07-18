import { createFileRoute } from '@tanstack/react-router'
import { SupplierSchemaPage } from '@/modules/developer/pages/supplier-schema-page'

export const Route = createFileRoute('/developer/_developer/supplier-schema')({
  component: SupplierSchemaPage,
})
