import { useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { UserCircle, KeyRound, Loader2 } from 'lucide-react'

import { ProfileForm } from '../components/ProfileForm'
import { profileFormSchema, passwordChangeSchema } from '../data/schema'
import { updateProfile, changePassword } from '../data/api'
import { useAuth } from '@/lib/auth-context'
import type { ProfileFormData, PasswordChangeData } from '../data/schema'

export function ProfilePage() {
  const { user, fetchProfile } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      role: (user?.role as ProfileFormData['role']) || 'admin',
      department: 'Management',
      shift: 'morning',
      bio: '',
    },
    mode: 'onBlur',
  })

  const passwordForm = useForm<PasswordChangeData>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    mode: 'onBlur',
  })

  const handleProfileSubmit = async (data: ProfileFormData) => {
    if (!user) return
    setIsSubmitting(true)
    setSuccessMessage(null)
    try {
      await updateProfile(user.id, {
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role,
        department: data.department,
        shift: data.shift,
        bio: data.bio,
      })
      // Refresh profile from backend to get updated data
      await fetchProfile()
      setSuccessMessage('Profile updated successfully.')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch {
      setSuccessMessage('Failed to update profile. Please try again.')
      setTimeout(() => setSuccessMessage(null), 3000)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePasswordSubmit = async (data: PasswordChangeData) => {
    try {
      await changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      })
      passwordForm.reset()
      setSuccessMessage('Password changed successfully.')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch {
      // Will handle errors when connected to backend
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
        <span className="ml-3 text-sm text-muted-foreground">Loading profile...</span>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Profile Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your personal information, account security, and preferences.
        </p>
      </div>

      {/* Success message */}
      {successMessage && (
        <div className="rounded-lg border border-success/20 bg-success/5 px-4 py-3 text-sm text-success">
          {successMessage}
        </div>
      )}

      {/* Quick Info Card */}
      <div className="rounded-xl border border-border bg-card p-6 flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-lg font-bold">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">{user.name}</h2>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          <div className="flex items-center gap-3 mt-1">
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary capitalize">
              {user.role}
            </span>
            {user.phone && (
              <span className="text-xs text-muted-foreground">{user.phone}</span>
            )}
          </div>
        </div>
      </div>

      {/* Profile section */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <UserCircle size={22} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Personal Information</h2>
            <p className="text-xs text-muted-foreground">
              Update your profile details and contact information.
            </p>
          </div>
        </div>

        <FormProvider {...form}>
          <ProfileForm onSubmit={handleProfileSubmit} isSubmitting={isSubmitting} />
        </FormProvider>
      </div>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Password section */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <KeyRound size={22} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Change Password</h2>
            <p className="text-xs text-muted-foreground">
              Update your password to keep your account secure.
            </p>
          </div>
        </div>

        <form
          onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)}
          className="rounded-lg border border-border bg-card p-6 space-y-4"
        >
          <div className="space-y-1.5">
            <label htmlFor="currentPassword" className="text-sm font-medium text-foreground">
              Current Password
            </label>
            <input
              id="currentPassword"
              type="password"
              {...passwordForm.register('currentPassword')}
              className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
            {passwordForm.formState.errors.currentPassword && (
              <p className="text-xs text-destructive">
                {passwordForm.formState.errors.currentPassword.message}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <label htmlFor="newPassword" className="text-sm font-medium text-foreground">
              New Password
            </label>
            <input
              id="newPassword"
              type="password"
              {...passwordForm.register('newPassword')}
              className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
            {passwordForm.formState.errors.newPassword && (
              <p className="text-xs text-destructive">
                {passwordForm.formState.errors.newPassword.message}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
              Confirm New Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              {...passwordForm.register('confirmPassword')}
              className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
            {passwordForm.formState.errors.confirmPassword && (
              <p className="text-xs text-destructive">
                {passwordForm.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
            >
              <KeyRound size={16} />
              Update Password
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
