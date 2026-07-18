import { useParams, useNavigate } from '@tanstack/react-router'
import {
  ArrowLeft,
  Users,
  Mail,
  Phone,
  Shield,
  Calendar,
  Loader2,
  Trash2,
  Undo2,
} from 'lucide-react'
import { useStaffMember, useDeleteStaff, useRestoreStaff, useUpdateStaff } from '../hooks/useStaffQueries'
import { EntityDocuments } from '@/modules/document/components/EntityDocuments'

export function StaffDetailPage() {
  const { id } = useParams({ from: '/staff/$id' })
  const navigate = useNavigate()

  const { data: member, isLoading } = useStaffMember(id)
  const deleteMutation = useDeleteStaff()
  const restoreMutation = useRestoreStaff()
  const updateMutation = useUpdateStaff()

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this staff member?')) {
      await deleteMutation.mutateAsync(id)
      navigate({ to: '/staff' })
    }
  }

  const handleRestore = async () => {
    await restoreMutation.mutateAsync(id)
  }

  const handleToggleActive = async () => {
    if (!member) return
    await updateMutation.mutateAsync({
      id: member.id,
      payload: { isActive: !member.isActive },
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={24} className="animate-spin text-violet-500" />
      </div>
    )
  }

  if (!member) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <Users size={48} className="mb-3 opacity-30" />
        <p className="text-lg font-medium text-gray-600">Staff member not found</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate({ to: '/staff' })}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary text-lg font-bold uppercase">
              {member.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{member.name}</h1>
              <p className="text-sm text-gray-500">{member.role?.name || 'No Role'}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {member.deletedAt ? (
            <button
              onClick={handleRestore}
              disabled={restoreMutation.isPending}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <Undo2 size={14} />
              Restore
            </button>
          ) : (
            <>
              <button
                onClick={handleToggleActive}
                disabled={updateMutation.isPending}
                className={`inline-flex items-center gap-1.5 h-9 px-4 rounded-lg border text-sm font-medium transition-colors disabled:opacity-50 ${
                  member.isActive
                    ? 'border-amber-200 text-amber-600 hover:bg-amber-50'
                    : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                }`}
              >
                {member.isActive ? 'Deactivate' : 'Activate'}
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg border border-red-200 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                <Trash2 size={14} />
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {/* Staff Info */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Staff Information</h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-xs text-gray-500 mb-1">Email</p>
            <div className="flex items-center gap-2">
              <Mail size={14} className="text-gray-400" />
              <p className="text-sm text-gray-900">{member.email}</p>
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Phone</p>
            <div className="flex items-center gap-2">
              <Phone size={14} className="text-gray-400" />
              <p className="text-sm text-gray-900">{member.phone || '-'}</p>
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Role</p>
            <div className="flex items-center gap-2">
              <Shield size={14} className="text-gray-400" />
              <p className="text-sm text-gray-900">{member.role?.name || '-'}</p>
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Status</p>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                member.deletedAt
                  ? 'bg-red-50 text-red-700'
                  : member.isActive
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-amber-50 text-amber-700'
              }`}
            >
              {member.deletedAt ? 'Deleted' : member.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Created</p>
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-gray-400" />
              <p className="text-sm text-gray-900">
                {new Date(member.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Documents Section */}
      <EntityDocuments
        entityType="user"
        entityId={member.id}
        entityName={member.name}
        onCreateNew={() => navigate({ to: '/documents/create' })}
      />
    </div>
  )
}
