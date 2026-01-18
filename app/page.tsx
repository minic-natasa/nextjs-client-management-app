import ClientsTable from './components/ClientsTable'
import { fetchClientsWithStats } from './lib/clients-data'

export default async function Home() {
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Client Management
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Manage your clients, projects, and tasks in one place
          </p>
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
