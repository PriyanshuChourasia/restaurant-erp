import { createFileRoute } from '@tanstack/react-router'
import { KotDisplayPage } from '../modules/kot/pages/KotDisplayPage'

export const Route = createFileRoute('/kot')({
  component: KotDisplayPage,
})
