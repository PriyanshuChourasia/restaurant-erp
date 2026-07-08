// Types
export type {
  CategoryResponse,
  TreeCategory,
  TreeResponse,
  BreadcrumbItem,
  BreadcrumbResponse,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  MoveCategoryRequest,
  CategoryListParams,
  PaginatedResponse,
} from './types/category.types'

// Schemas
export { categoryFormSchema, moveCategorySchema } from './schemas/category.schema'
export type { CategoryFormValues, MoveCategoryFormValues } from './schemas/category.schema'

// API
export {
  getCategories,
  getCategory,
  getCategoryTree,
  getCategoryBreadcrumb,
  getCategoryChildren,
  getCategoryDescendants,
  getCategoryAncestors,
  getCategoryRoots,
  createCategory,
  updateCategory,
  deleteCategory,
  restoreCategory,
  moveCategory,
  activateCategory,
  deactivateCategory,
} from './api/category.api'

// Hooks
export {
  categoryKeys,
  useCategories,
  useCategory,
  useCategoryTree,
  useCategoryBreadcrumb,
  useCategoryChildren,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useRestoreCategory,
  useMoveCategory,
  useActivateCategory,
  useDeactivateCategory,
} from './hooks/useCategoryQueries'

// Components
export { CategoryTable } from './components/CategoryTable'
export { CategoryTree } from './components/CategoryTree'
export { CategoryBreadcrumb } from './components/CategoryBreadcrumb'
export { CategoryToolbar } from './components/CategoryToolbar'
export { CategorySearch } from './components/CategorySearch'
export { CategoryFilters } from './components/CategoryFilters'
export { StatusBadge } from './components/StatusBadge'
export { ActivateToggle } from './components/ActivateToggle'
export { EmptyState } from './components/EmptyState'
export { LoadingState, CardLoadingState, TreeLoadingState } from './components/LoadingState'
export { ParentCategorySelector } from './components/ParentCategorySelector'
export { SlugInput } from './components/SlugInput'

// Dialogs
export { DeleteCategoryDialog } from './dialogs/DeleteCategoryDialog'
export { RestoreCategoryDialog } from './dialogs/RestoreCategoryDialog'
export { MoveCategoryDialog } from './dialogs/MoveCategoryDialog'

// Forms
export { CategoryForm } from './forms/CategoryForm'

// Utils
export {
  getStatusColor,
  getStatusLabel,
  formatDate,
  formatDateTime,
  slugify,
} from './utils/category.utils'

// Pages
export { CategoryListPage } from './pages/CategoryListPage'
export { CreateCategoryPage } from './pages/CreateCategoryPage'
export { EditCategoryPage } from './pages/EditCategoryPage'
export { CategoryDetailsPage } from './pages/CategoryDetailsPage'
export { CategoryTreePage } from './pages/CategoryTreePage'
