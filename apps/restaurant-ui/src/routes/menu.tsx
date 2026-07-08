import { createFileRoute } from '@tanstack/react-router'
import { MenuPage } from '../modules/menu/pages/MenuPage'

export const Route = createFileRoute('/menu')({
  component: MenuPage,
})
