import { createFileRoute } from '@tanstack/react-router'
import { TableListPage } from '../modules/tables/pages/TableListPage'

export const Route = createFileRoute('/tables')({
  component: TableListPage,
})
