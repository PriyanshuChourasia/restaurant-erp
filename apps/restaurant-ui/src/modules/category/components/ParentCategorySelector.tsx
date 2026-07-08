import { useState, useCallback } from 'react'
import { ChevronRight, ChevronDown, Folder, FolderOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TreeCategory } from '../types/category.types'

interface ParentCategorySelectorProps {
  tree: TreeCategory[]
  value: string | null | undefined
  onChange: (value: string | null) => void
  excludeId?: string
  isLoading?: boolean
  error?: string
}

interface TreeNodeProps {
  node: TreeCategory
  level: number
  selectedId: string | null | undefined
  excludeId?: string
  expandedIds: Set<string>
  onToggle: (id: string) => void
  onSelect: (id: string) => void
}

function TreeNode({
  node,
  level,
  selectedId,
  excludeId,
  expandedIds,
  onToggle,
  onSelect,
}: TreeNodeProps) {
  const hasChildren = node.children.length > 0
  const isExpanded = expandedIds.has(node.id)
  const isSelected = selectedId === node.id
  const isDisabled = excludeId === node.id || (excludeId ? isDescendantOfNode(node, excludeId) : false)

  function isDescendantOfNode(n: TreeCategory, targetId: string): boolean {
    for (const child of n.children) {
      if (child.id === targetId) return true
      if (isDescendantOfNode(child, targetId)) return true
    }
    return false
  }

  return (
    <div>
      <button
        type="button"
        className={cn(
          'flex w-full items-center gap-1.5 rounded px-2 py-1 text-left text-sm transition-colors',
          isSelected
            ? 'bg-primary/10 text-primary font-medium'
            : 'hover:bg-muted text-foreground',
          isDisabled && 'opacity-40 cursor-not-allowed',
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={() => {
          if (isDisabled) return
          onSelect(node.id)
        }}
        disabled={isDisabled}
      >
        {hasChildren ? (
          <span
            onClick={(e) => {
              e.stopPropagation()
              onToggle(node.id)
            }}
            className="flex items-center"
          >
            {isExpanded ? (
              <ChevronDown size={14} className="text-muted-foreground" />
            ) : (
              <ChevronRight size={14} className="text-muted-foreground" />
            )}
          </span>
        ) : (
          <span className="w-3.5" />
        )}
        {isExpanded ? (
          <FolderOpen size={14} className="text-muted-foreground shrink-0" />
        ) : (
          <Folder size={14} className="text-muted-foreground shrink-0" />
        )}
        <span className="truncate">{node.name}</span>
        {isDisabled && (
          <span className="ml-auto text-xs text-muted-foreground">(self)</span>
        )}
      </button>
      {hasChildren && isExpanded && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              selectedId={selectedId}
              excludeId={excludeId}
              expandedIds={expandedIds}
              onToggle={onToggle}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function ParentCategorySelector({
  tree,
  value,
  onChange,
  excludeId,
  isLoading,
  error,
}: ParentCategorySelectorProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    // Auto-expand to the selected node
    if (!value) return new Set<string>()
    const ids = new Set<string>()
    function findPath(nodes: TreeCategory[], targetId: string): boolean {
      for (const node of nodes) {
        if (node.id === targetId) return true
        if (node.children.length > 0 && findPath(node.children, targetId)) {
          ids.add(node.id)
          return true
        }
      }
      return false
    }
    findPath(tree, value)
    return ids
  })

  const [isOpen, setIsOpen] = useState(false)

  const handleToggle = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const handleSelect = useCallback(
    (id: string) => {
      onChange(id)
      setIsOpen(false)
    },
    [onChange],
  )

  // Find selected name for display
  const findName = (nodes: TreeCategory[], id: string): string | null => {
    for (const node of nodes) {
      if (node.id === id) return node.name
      if (node.children.length > 0) {
        const found = findName(node.children, id)
        if (found) return found
      }
    }
    return null
  }

  const selectedName = value ? findName(tree, value) : null

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">
        Parent Category
      </label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'flex h-8 w-full items-center justify-between rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors',
            isOpen && 'border-ring ring-3 ring-ring/50',
            error && 'border-destructive',
            isLoading && 'opacity-50',
          )}
          disabled={isLoading}
        >
          <span className={selectedName ? 'text-foreground' : 'text-muted-foreground'}>
            {selectedName || 'None (root category)'}
          </span>
          <ChevronDown
            size={14}
            className={cn(
              'text-muted-foreground transition-transform',
              isOpen && 'rotate-180',
            )}
          />
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-64 overflow-auto rounded-lg border border-border bg-popover p-1 shadow-lg">
              <button
                type="button"
                onClick={() => {
                  onChange(null)
                  setIsOpen(false)
                }}
                className={cn(
                  'flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors',
                  !value
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'hover:bg-muted text-foreground',
                )}
              >
                <Folder size={14} className="text-muted-foreground" />
                None (Root Category)
              </button>
              <div className="mx-2 my-1 border-t border-border" />
              {tree.map((node) => (
                <TreeNode
                  key={node.id}
                  node={node}
                  level={0}
                  selectedId={value}
                  excludeId={excludeId}
                  expandedIds={expandedIds}
                  onToggle={handleToggle}
                  onSelect={handleSelect}
                />
              ))}
            </div>
          </>
        )}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
