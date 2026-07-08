import { getCurrentUser } from './api'

// React Query integration will be added when @tanstack/react-query is installed.
// For now, use a simple fetch helper.
export async function fetchCurrentUser() {
  return getCurrentUser()
}
