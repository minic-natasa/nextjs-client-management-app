import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getSupabaseClient } from '@/lib/supabase'
import type { Client } from '@/app/lib/types'

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

export default async function ClientDetailPage({
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
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/"
            className="mb-4 inline-flex items-center text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            ← Back to Clients
          </Link>
          <div className="mt-4 flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {client.name}
            </h1>
            <span
              className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
                client.status === 'active'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
              }`}
            >
              {client.status === 'active' ? 'Active' : 'Non-Active'}
            </span>
          </div>
        </div>

        {/* Client Details Card */}
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <div className="px-6 py-5">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Client Information
            </h2>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Email
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {client.email}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Phone
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {client.phone}
                </dd>
              </div>
              {client.website_url && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Website
                  </dt>
                  <dd className="mt-1 text-sm">
                    <a
                      href={client.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      {client.website_url}
                    </a>
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Created
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {new Date(client.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </dd>
              </div>
            </dl>
            {client.notes && (
              <div className="mt-4">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Notes
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  <p className="whitespace-pre-wrap">{client.notes}</p>
                </dd>
              </div>
            )}
          </div>
        </div>

        {/* Projects will be added here in future CRUD implementation */}
        <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Projects
          </h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Project management for this client will be available in the next phase.
          </p>
        </div>
      </div>
    </div>
  )
}
