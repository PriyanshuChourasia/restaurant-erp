import { createFileRoute } from '@tanstack/react-router'
import { UserSchemaPage } from '@/modules/developer/pages/user-schema-page'

export const Route = createFileRoute('/developer/_developer/user-schema')({
  component: UserSchemaPage,
})
