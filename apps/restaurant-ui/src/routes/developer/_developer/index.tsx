import { createFileRoute } from '@tanstack/react-router'
import { DeveloperIndexPage } from '@/modules/developer/pages/DeveloperIndexPage'

export const Route = createFileRoute('/developer/_developer/')({
  component: DeveloperIndexPage,
})
