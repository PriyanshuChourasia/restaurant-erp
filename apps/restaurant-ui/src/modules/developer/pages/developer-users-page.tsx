import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { ArrowLeft, RefreshCw, Loader2, Users, Mail, Phone, Shield, CheckCircle, XCircle } from 'lucide-react'
import { apiClient } from '@/lib/axios-client'

interface UserRow {
  id: string
  name: string
  email: string
  phone: string | null
  passwordHash: string
  isActive: boolean
  roleId: string
  role?: { id: string; name: string }
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export function DeveloperUsersPage() {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['dev-users'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: UserRow[]; total: number }>('/developer/tables/users', { params: { limit: 100 } })
      return data
    },
  })

  const users = data?.data || []

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link
            to="/developer"
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
              <Users size={16} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Users</h1>
              <p className="text-xs text-gray-400">{users.length} users · All attributes</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={12} className={isFetching ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* User Cards */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={20} className="animate-spin text-violet-400" />
        </div>
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Users size={48} className="mb-4 opacity-20" />
          <p className="text-lg font-medium text-gray-500">No users found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {users.map((user) => (
            <div key={user.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
              {/* User Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-white text-sm font-bold">
                    {user.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                    <p className="text-[10px] text-gray-400 font-mono">{user.id}</p>
                  </div>
                </div>
                <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                  user.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
                }`}>
                  {user.isActive ? <CheckCircle size={10} /> : <XCircle size={10} />}
                  {user.isActive ? 'Active' : 'Inactive'}
                </div>
              </div>

              {/* Attributes Grid */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                <div>
                  <span className="text-gray-400">Email</span>
                  <p className="font-medium text-gray-700 flex items-center gap-1 mt-0.5">
                    <Mail size={10} className="text-gray-400 shrink-0" />
                    <span className="truncate">{user.email}</span>
                  </p>
                </div>
                <div>
                  <span className="text-gray-400">Phone</span>
                  <p className="font-medium text-gray-700 flex items-center gap-1 mt-0.5">
                    <Phone size={10} className="text-gray-400 shrink-0" />
                    {user.phone || '—'}
                  </p>
                </div>
                <div>
                  <span className="text-gray-400">Role</span>
                  <p className="font-medium text-gray-700 flex items-center gap-1 mt-0.5">
                    <Shield size={10} className="text-gray-400 shrink-0" />
                    {user.role?.name || user.roleId}
                  </p>
                </div>
                <div>
                  <span className="text-gray-400">Role ID</span>
                  <p className="font-medium text-gray-700 font-mono text-[10px] mt-0.5 truncate">{user.roleId}</p>
                </div>
                <div>
                  <span className="text-gray-400">Created</span>
                  <p className="font-medium text-gray-700 mt-0.5">{new Date(user.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="text-gray-400">Updated</span>
                  <p className="font-medium text-gray-700 mt-0.5">{new Date(user.updatedAt).toLocaleDateString()}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-400">Password Hash</span>
                  <p className="font-medium text-gray-500 font-mono text-[9px] mt-0.5 break-all leading-relaxed bg-gray-50 rounded px-2 py-1">
                    {user.passwordHash}
                  </p>
                </div>
                {user.deletedAt && (
                  <div className="col-span-2">
                    <span className="text-gray-400">Deleted At</span>
                    <p className="font-medium text-red-500 mt-0.5">{new Date(user.deletedAt).toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
