interface UserStatusBadgeProps {
  isActive: boolean
  deletedAt: string | null
}

export function UserStatusBadge({ isActive, deletedAt }: UserStatusBadgeProps) {
  if (deletedAt) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700">
        Deleted
      </span>
    )
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
        isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
      }`}
    >
      {isActive ? 'Active' : 'Inactive'}
    </span>
  )
}
