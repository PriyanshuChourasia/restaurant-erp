import { createFileRoute } from '@tanstack/react-router'
import { EditItemPage } from '../modules/items/pages/EditItemPage'

export const Route = createFileRoute('/items_/$id')({
  component: function EditItemRoute() {
    const { id } = Route.useParams()
    return <EditItemPage itemId={id} />
  },
})
