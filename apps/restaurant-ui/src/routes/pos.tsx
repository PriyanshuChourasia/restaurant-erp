import { createFileRoute } from '@tanstack/react-router'
import { POSDashboard } from '../modules/pos/pages/POSDashboard'

export const Route = createFileRoute('/pos')({
  component: POSDashboard,
})
