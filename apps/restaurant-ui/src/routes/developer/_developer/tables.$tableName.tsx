import { createFileRoute } from '@tanstack/react-router'
import { DeveloperTablePage } from '@/modules/developer/pages/DeveloperTablePage'

export const Route = createFileRoute('/developer/_developer/tables/$tableName')({
  component: DeveloperTablePage,
})
