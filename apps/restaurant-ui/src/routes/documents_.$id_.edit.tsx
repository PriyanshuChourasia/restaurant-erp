import { createFileRoute } from '@tanstack/react-router'
import { DocumentFormPage } from '../modules/document/pages/DocumentFormPage'

export const Route = createFileRoute('/documents_/$id_/edit')({
  component: function DocumentEditRoute() {
    const { id } = Route.useParams()
    return <DocumentFormPage documentId={id} />
  },
})
