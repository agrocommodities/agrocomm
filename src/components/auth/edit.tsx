'use client'

import { useActionState } from 'react'
// import { User } from '@/types'
import { updateUser } from '@/actions'
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'
// import { Select } from '@/components/ui/select'

interface UserFormProps {
  user: {
    id: number
    name: string | null
    email: string
    role: "admin" | "user"
    username: string | null
    createdAt: string | null
    updatedAt: string | null
  }
}


export function UserForm({ user }: UserFormProps) {
  const [state, formAction, isPending] = useActionState(updateUser, null)

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="userId" value={user.id} />

      {state?.error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{state.error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          name="name"
          label="Name"
          defaultValue={user.name || ''}
          error={state?.error}
          required
        />
        <Input
          name="email"
          label="Email"
          type="email"
          defaultValue={user.email}
          error={state?.error}
          required
        />
      </div>

      {/* <Select
        name="role"
        label="Role"
        defaultValue={user.role}
        error={state?.errors?.role?.[0]}
        options={[
          { value: 'user', label: 'User' },
          { value: 'admin', label: 'Admin' }
        ]}
        required
      /> */}

      <Input
        name="password"
        label="New Password (leave blank to keep current)"
        type="password"
        error={state?.error}
      />

      {state?.error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{state.error}</p>
        </div>
      )}

      <div className="flex justify-end space-x-4">
        <Button type="button" onClick={() => window.history.back()}>
          Cancel
        </Button>
        <Button type="submit" loading={isPending}>
          {isPending ? 'Updating...' : 'Update User'}
        </Button>
      </div>
    </form>
  )
}