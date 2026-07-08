import { createFileRoute } from '@tanstack/react-router'
import { ReservationsPage } from '../modules/reservations/pages/ReservationsPage'

export const Route = createFileRoute('/reservations')({
  component: ReservationsPage,
})
