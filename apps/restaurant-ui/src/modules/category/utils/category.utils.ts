import type { TreeCategory } from '../types/category.types'

export function getStatusColor(isActive: boolean): string {
  return isActive
    ? 'bg-success/10 text-success border-success/20'
    : 'bg-muted text-muted-foreground border-border'
}

export function getStatusLabel(isActive: boolean): string {
  return isActive ? 'Active' : 'Inactive'
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim()
}

export function isDescendantOf(
  tree: TreeCategory[],
  categoryId: string,
  potentialAncestorId: string,
): boolean {
  for (const node of tree) {
    if (node.id === potentialAncestorId) {
      return hasDescendant(node, categoryId)
    }
    if (node.children.length > 0) {
      if (isDescendantOf(node.children, categoryId, potentialAncestorId)) {
        return true
      }
    }
  }
  return false
}

function hasDescendant(node: TreeCategory, targetId: string): boolean {
  for (const child of node.children) {
    if (child.id === targetId) return true
    if (hasDescendant(child, targetId)) return true
  }
  return false
}

export function getAllCategoryIds(tree: TreeCategory[]): string[] {
  const ids: string[] = []
  function traverse(nodes: TreeCategory[]) {
    for (const node of nodes) {
      ids.push(node.id)
      traverse(node.children)
    }
  }
  traverse(tree)
  return ids
}

export function findCategoryInTree(
  tree: TreeCategory[],
  id: string,
): TreeCategory | null {
  for (const node of tree) {
    if (node.id === id) return node
    if (node.children.length > 0) {
      const found = findCategoryInTree(node.children, id)
      if (found) return found
    }
  }
  return null
}
