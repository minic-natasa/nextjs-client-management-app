import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getSupabaseClient } from '@/lib/supabase'
import type { Client } from '@/app/lib/types'
import ClientForm from '@/app/components/ClientForm'

async function getClient(id: string): Promise<Client | null> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .is('archived_at', null)
    .single()

  if (error || !data) {
    return null
  }

  return data as Client
}

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const client = await getClient(id)

  if (!client) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href={`/clients/${id}`}
            className="mb-4 inline-flex items-center text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            ← Back to Client Details
          </Link>
          <div className="mt-4">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Edit Client
            </h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Update client information
            </p>
          </div>
        </div>

        {/* Form Card */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <ClientForm client={client} mode="edit" />
        </div>
      </div>
    </div>
  )
}
