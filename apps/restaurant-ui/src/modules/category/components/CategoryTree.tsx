import { useState, useCallback } from 'react'
import { ChevronRight, ChevronDown, Folder, FolderOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TreeCategory } from '../types/category.types'

interface CategoryTreeProps {
  tree: TreeCategory[]
  selectedId?: string
  onSelect: (category: TreeCategory) => void
  onMove?: (categoryId: string, targetParentId: string | null) => void
  className?: string
}

interface TreeNodeProps {
  node: TreeCategory
  level: number
  selectedId?: string
  expandedIds: Set<string>
  onToggle: (id: string) => void
  onSelect: (category: TreeCategory) => void
  onMove?: (categoryId: string, targetParentId: string | null) => void
}

function TreeNode({
  node,
  level,
  selectedId,
  expandedIds,
  onToggle,
  onSelect,
  onMove,
}: TreeNodeProps) {
  const hasChildren = node.children.length > 0
  const isExpanded = expandedIds.has(node.id)
  const isSelected = selectedId === node.id

  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      e.dataTransfer.setData('text/plain', node.id)
      e.dataTransfer.effectAllowed = 'move'
    },
    [node.id],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const draggedId = e.dataTransfer.getData('text/plain')
      if (draggedId !== node.id && onMove) {
        onMove(draggedId, node.id)
      }
    },
    [node.id, onMove],
  )

  return (
    <div>
      <div
        className={cn(
          'group flex items-center gap-1 rounded px-2 py-1.5 text-sm transition-colors cursor-pointer',
          isSelected
            ? 'bg-primary/10 text-primary font-medium'
            : 'hover:bg-muted text-foreground',
        )}
        style={{ paddingLeft: `${level * 20 + 8}px` }}
        onClick={() => onSelect(node)}
        draggable={!!onMove}
        onDragStart={onMove ? handleDragStart : undefined}
        onDragOver={onMove ? handleDragOver : undefined}
        onDrop={onMove ? handleDrop : undefined}
      >
        {hasChildren ? (
          <span
            onClick={(e) => {
              e.stopPropagation()
              onToggle(node.id)
            }}
            className="flex items-center text-muted-foreground"
          >
            {isExpanded ? (
              <ChevronDown size={14} />
            ) : (
              <ChevronRight size={14} />
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

        <span className="truncate flex-1">{node.name}</span>

        {!node.isActive && (
          <span className="rounded bg-destructive/10 px-1.5 py-0.5 text-[10px] font-medium text-destructive">
            Inactive
          </span>
        )}

        {onMove && (
          <span className="ml-auto opacity-0 group-hover:opacity-100 text-[10px] text-muted-foreground">
            Drag to reorder
          </span>
        )}
      </div>

      {hasChildren && isExpanded && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              selectedId={selectedId}
              expandedIds={expandedIds}
              onToggle={onToggle}
              onSelect={onSelect}
              onMove={onMove}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function CategoryTree({
  tree,
  selectedId,
  onSelect,
  onMove,
  className,
}: CategoryTreeProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    // Auto-expand root nodes
    return new Set(tree.map((n) => n.id))
  })

  const handleToggle = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const handleDropOnRoot = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const draggedId = e.dataTransfer.getData('text/plain')
      if (onMove) {
        onMove(draggedId, null)
      }
    },
    [onMove],
  )

  if (tree.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        No categories to display.
      </div>
    )
  }

  return (
    <div
      className={cn('rounded-lg border border-border bg-card', className)}
      onDragOver={(e) => {
        if (onMove) {
          e.preventDefault()
          e.dataTransfer.dropEffect = 'move'
        }
      }}
      onDrop={onMove ? handleDropOnRoot : undefined}
    >
      <div className="border-b border-border px-4 py-2.5">
        <h3 className="text-sm font-semibold text-foreground">Category Tree</h3>
      </div>
      <div className="p-2">
        {tree.map((node) => (
          <TreeNode
            key={node.id}
            node={node}
            level={0}
            selectedId={selectedId}
            expandedIds={expandedIds}
            onToggle={handleToggle}
            onSelect={onSelect}
            onMove={onMove}
          />
        ))}
      </div>
    </div>
  )
}
