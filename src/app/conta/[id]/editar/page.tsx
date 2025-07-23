import { notFound } from 'next/navigation'
import { getUserById } from '@/lib/user'
import ProfileEditForm from '@/components/auth/profile'

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getUserById(id)

  if (!user) notFound()

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Edit User</h1>
        <p className="mt-2 text-gray-600">Update user information</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <ProfileEditForm user={user} />
      </div>
    </div>
  )
}