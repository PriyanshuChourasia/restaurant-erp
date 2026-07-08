// ---- Response Types ----

export interface CategoryResponse {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  displayOrder: number;
  isActive: boolean;
  parentId: string | null;
  path: string;
  level: number;
  icon: string | null;
  image: string | null;
  childrenCount: number;
  version: number;
  createdBy: string | null;
  updatedBy: string | null;
  deletedBy: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface TreeCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  displayOrder: number;
  isActive: boolean;
  parentId: string | null;
  path: string;
  level: number;
  icon: string | null;
  image: string | null;
  children: TreeCategory[];
}

export interface TreeResponse {
  items: TreeCategory[];
}

export interface BreadcrumbItem {
  id: string;
  name: string;
  slug: string;
  level: number;
}

export interface BreadcrumbResponse {
  items: BreadcrumbItem[];
}

// ---- Request Types ----

export interface CreateCategoryRequest {
  name: string;
  slug: string;
  description?: string;
  displayOrder?: number;
  isActive?: boolean;
  parentId?: string;
  icon?: string;
  image?: string;
}

export interface UpdateCategoryRequest {
  name?: string;
  slug?: string;
  description?: string;
  displayOrder?: number;
  isActive?: boolean;
  icon?: string;
  image?: string;
}

export interface MoveCategoryRequest {
  parentId?: string | null;
}

// ---- Query Types ----

export interface CategoryListParams {
  page?: number;
  limit?: number;
  search?: string;
  parentId?: string;
  isActive?: boolean;
  includeDeleted?: boolean;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
