import { createFileRoute } from '@tanstack/react-router'
import { ZoneListPage } from '../modules/zones/pages/ZoneListPage'

export const Route = createFileRoute('/zones')({
  component: ZoneListPage,
})
