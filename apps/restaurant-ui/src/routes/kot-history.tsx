import { createFileRoute } from '@tanstack/react-router'
import { KotListPage } from '../modules/kot/pages/KotListPage'

export const Route = createFileRoute('/kot-history')({
  component: KotListPage,
})
