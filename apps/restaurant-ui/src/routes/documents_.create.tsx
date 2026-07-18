import { createFileRoute } from '@tanstack/react-router'
import { DocumentFormPage } from '../modules/document/pages/DocumentFormPage'

export const Route = createFileRoute('/documents_/create')({
  component: DocumentFormPage,
})
