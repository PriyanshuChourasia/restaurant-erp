import { createFileRoute, Outlet } from '@tanstack/react-router'
import { DeveloperLayout } from '@/layouts/DeveloperLayout'

export const Route = createFileRoute('/developer/_developer')({
  component: () => (
    <DeveloperLayout>
      <Outlet />
    </DeveloperLayout>
  ),
})
