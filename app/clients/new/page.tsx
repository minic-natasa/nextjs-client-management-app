import Link from 'next/link'
import ClientForm from '@/app/components/ClientForm'

export default function NewClientPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/"
            className="mb-4 inline-flex items-center text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            ← Back to Clients
          </Link>
          <div className="mt-4">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Add New Client
            </h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Create a new client in your system
            </p>
          </div>
        </div>

        {/* Form Card */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <ClientForm mode="create" />
        </div>
      </div>
    </div>
  )
}
