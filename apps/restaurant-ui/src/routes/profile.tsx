import { createFileRoute } from '@tanstack/react-router'
import { ProfilePage } from '../modules/user/pages/ProfilePage'

export const Route = createFileRoute('/profile')({
  component: ProfilePage,
})
