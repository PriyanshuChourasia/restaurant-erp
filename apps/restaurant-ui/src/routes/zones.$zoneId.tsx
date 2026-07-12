import { createFileRoute } from '@tanstack/react-router'
import { ZoneFloorPlanPage } from '../modules/zones/pages/ZoneFloorPlanPage'

export const Route = createFileRoute('/zones/$zoneId')({
  component: ZoneFloorPlanPage,
})
