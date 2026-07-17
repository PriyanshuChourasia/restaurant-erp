import { createFileRoute } from '@tanstack/react-router'
import { DeveloperSchemaPage } from '@/modules/developer/pages/DeveloperSchemaPage'

export const Route = createFileRoute('/developer/_developer/schema')({
  component: DeveloperSchemaPage,
})
