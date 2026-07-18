import { createFileRoute } from '@tanstack/react-router'
import { DocumentDetailPage } from '../modules/document/pages/DocumentDetailPage'

export const Route = createFileRoute('/documents/$id')({
  component: DocumentDetailPage,
})
