import { createFileRoute } from '@tanstack/react-router'
import { DocumentListPage } from '../modules/document/pages/DocumentListPage'

export const Route = createFileRoute('/documents')({
  component: DocumentListPage,
})
