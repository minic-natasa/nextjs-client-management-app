import ClientsTable from './components/ClientsTable'
import { fetchClientsWithStats } from './lib/clients-data'

type SearchParams = Record<string, string | string[] | undefined>

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await searchParams
  const clientUpdated = sp.clientUpdated === '1'
  const clientCreated = sp.clientCreated === '1'

  let clients = []
  let error: string | null = null

  try {
    clients = await fetchClientsWithStats()
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to load clients'
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans dark:bg-black">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Success banner */}
        {(clientUpdated || clientCreated) && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800 dark:border-green-900 dark:bg-green-900/20 dark:text-green-200">
            {clientUpdated && 'Client updated successfully.'}
            {clientCreated && 'Client created successfully.'}
          </div>
        )}

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Client Management
            </h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Manage your clients, projects, and tasks in one place
            </p>
          </div>
          <a
            href="/clients/new"
            className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <svg
              className="mr-2 h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Client
          </a>
        </div>

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
            <p className="text-sm text-red-800 dark:text-red-200">
              Error: {error}
            </p>
            <p className="mt-2 text-sm text-red-600 dark:text-red-300">
              Please check your Supabase connection and try again.
            </p>
          </div>
        ) : (
          <ClientsTable clients={clients} />
        )}
      </main>
    </div>
  )
}
