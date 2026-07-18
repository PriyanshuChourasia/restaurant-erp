import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Plus, Search, Users, Mail, Phone, Trash2, Undo2, RefreshCw, FileText } from 'lucide-react'
import { useStaff, useDeleteStaff, useRestoreStaff, useUpdateStaff } from '../hooks/useStaffQueries'
import type { StaffMember } from '../api/staff.api'
import { AddStaffDialog } from '../dialogs/AddStaffDialog'

export function StaffPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [selectedDept, setSelectedDept] = useState('all')
  const [showAddDialog, setShowAddDialog] = useState(false)

  const { data, isLoading } = useStaff({ page, limit: 20, search: search || undefined })
  const deleteMutation = useDeleteStaff()
  const restoreMutation = useRestoreStaff()
  const updateMutation = useUpdateStaff()

  const staffList = data?.data || []
  const total = data?.total || 0

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this staff member?')) {
      await deleteMutation.mutateAsync(id)
    }
  }

  const handleRestore = async (id: string) => {
    await restoreMutation.mutateAsync(id)
  }

  const handleToggleActive = async (member: StaffMember) => {
    await updateMutation.mutateAsync({
      id: member.id,
      payload: { isActive: !member.isActive },
    })
  }

  const departments = ['all', ...new Set(staffList.map((s: StaffMember) => s.role?.name || 'Unassigned').filter(Boolean))]

  const filteredStaff = selectedDept === 'all'
    ? staffList
    : staffList.filter((s: StaffMember) => (s.role?.name || 'Unassigned') === selectedDept)

  const activeStaff = staffList.filter((s: StaffMember) => s.isActive && !s.deletedAt).length
  const onLeaveCount = staffList.filter((s: StaffMember) => !s.isActive && !s.deletedAt).length
  const deletedCount = staffList.filter((s: StaffMember) => s.deletedAt).length

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Staff</h1>
          <p className="text-sm text-gray-500 mt-1">Manage employees, roles, and permissions.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search staff..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="h-9 w-48 rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-primary/40 focus:ring-3 focus:ring-primary/10"
            />
          </div>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 transition-all hover:bg-gray-50"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
          <button
            onClick={() => setShowAddDialog(true)}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-sm font-medium text-white transition-all hover:bg-primary/90"
          >
            <Plus size={15} />
            Add Staff
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">Total Staff</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500 text-white">
              <Users size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{total}</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-white p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-emerald-600">Active</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500 text-white">
              <Users size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{activeStaff}</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-white p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-amber-600">Inactive</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500 text-white">
              <Users size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-600">{onLeaveCount}</p>
        </div>
        <div className="rounded-xl border border-red-200 bg-white p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-red-600">Deleted</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500 text-white">
              <Users size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-red-600">{deletedCount}</p>
        </div>
      </div>

      {/* Department Filter */}
      <div className="flex gap-2 flex-wrap">
        {departments.slice(0, 8).map((dept) => (
          <button
            key={dept}
            onClick={() => setSelectedDept(dept)}
            className={`px-3 py-1.5 text-sm rounded-full font-medium transition-colors ${
              selectedDept === dept ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {dept === 'all' ? 'All Departments' : dept}
          </button>
        ))}
      </div>

      {/* Staff Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-xl border border-gray-200 bg-white p-5 animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gray-200" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-1" />
                  <div className="h-3 bg-gray-100 rounded w-32" />
                </div>
              </div>
              <div className="h-3 bg-gray-100 rounded w-20" />
            </div>
          ))}
        </div>
      ) : filteredStaff.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <Users size={48} className="mb-3 opacity-30" />
          <p className="text-lg font-medium text-gray-600">No staff found</p>
          <p className="text-sm">{search ? 'Try a different search term.' : 'Add your first staff member to get started.'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStaff.map((member: StaffMember) => (
            <div
              key={member.id}
              className={`rounded-xl border bg-white p-5 transition-all hover:shadow-sm ${
                member.deletedAt ? 'border-red-200 opacity-70' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold uppercase">
                    {member.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{member.name}</h3>
                    <p className="text-xs text-gray-500">{member.role?.name || 'No Role'}</p>
                  </div>
                </div>
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

              <div className="space-y-1.5 text-sm text-gray-500 mb-4">
                <div className="flex items-center gap-2">
                  <Mail size={13} className="text-gray-400" />
                  <span>{member.email}</span>
                </div>
                {member.phone && (
                  <div className="flex items-center gap-2">
                    <Phone size={13} className="text-gray-400" />
                    <span>{member.phone}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                {member.deletedAt ? (
                  <button
                    onClick={() => handleRestore(member.id)}
                    className="flex-1 flex items-center justify-center gap-1 h-8 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 transition-all hover:bg-gray-50"
                  >
                    <Undo2 size={13} />
                    Restore
                  </button>
                ) : (
                  <>
                    <Link
                      to={`/staff/$id`}
                      params={{ id: member.id }}
                      className="flex-1 flex items-center justify-center gap-1 h-8 rounded-lg border border-violet-200 text-xs font-medium text-violet-600 transition-all hover:bg-violet-50"
                    >
                      <FileText size={13} />
                      View & Docs
                    </Link>
                    <button
                      onClick={() => handleToggleActive(member)}
                      className={`flex items-center justify-center gap-1 h-8 px-2 rounded-lg border text-xs font-medium transition-all ${
                        member.isActive
                          ? 'border-amber-200 text-amber-600 hover:bg-amber-50'
                          : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                      }`}
                    >
                      {member.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleDelete(member.id)}
                      className="flex items-center justify-center gap-1 h-8 px-2 rounded-lg border border-red-200 text-xs font-medium text-red-600 transition-all hover:bg-red-50"
                    >
                      <Trash2 size={13} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > 20 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Showing {Math.min((page - 1) * 20 + 1, total)}-{Math.min(page * 20, total)} of {total}
          </p>
          <div className="flex gap-1">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="px-3 py-1 text-xs rounded border border-gray-200 disabled:opacity-50 hover:bg-gray-100"
            >
              Previous
            </button>
            <button
              disabled={page >= Math.ceil(total / 20)}
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1 text-xs rounded border border-gray-200 disabled:opacity-50 hover:bg-gray-100"
            >
              Next
            </button>
          </div>
        </div>
      )}

      <AddStaffDialog open={showAddDialog} onClose={() => setShowAddDialog(false)} />
    </div>
  )
}
