import { createFileRoute } from '@tanstack/react-router'
import { CustomerDirectoryPage } from '../../modules/reports/pages/CustomerDirectoryPage'

export const Route = createFileRoute('/reports/customer-directory')({
  component: CustomerDirectoryPage,
})
