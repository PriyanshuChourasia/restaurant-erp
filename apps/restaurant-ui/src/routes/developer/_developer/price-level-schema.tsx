import { createFileRoute } from '@tanstack/react-router'
import { PriceLevelSchemaPage } from '@/modules/developer/pages/price-level-schema-page'

export const Route = createFileRoute('/developer/_developer/price-level-schema')({
  component: PriceLevelSchemaPage,
})
