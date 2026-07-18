import { createFileRoute } from '@tanstack/react-router'
import { SeatingSchemaPage } from '@/modules/developer/pages/seating-schema-page'

export const Route = createFileRoute('/developer/_developer/seating-schema')({
  component: SeatingSchemaPage,
})
