import { createFileRoute } from '@tanstack/react-router'
import { LandingPage } from '../modules/landing/pages/LandingPage'

export const Route = createFileRoute('/')({
  component: LandingPage,
})
