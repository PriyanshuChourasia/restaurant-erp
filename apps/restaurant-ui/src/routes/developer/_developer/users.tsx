import { createFileRoute } from '@tanstack/react-router'
import { DeveloperUsersPage } from '@/modules/developer/pages/developer-users-page'

export const Route = createFileRoute('/developer/_developer/users')({
  component: DeveloperUsersPage,
})
