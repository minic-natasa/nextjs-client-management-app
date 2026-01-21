import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { getSupabaseClient } from '@/lib/supabase'
import type { Client, Project, Task, ClientStatus } from '@/app/lib/types'
import { updateClientStatus } from '@/app/lib/update-client-status'

type SearchParams = Record<string, string | string[] | undefined>

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

interface ProjectWithTasks extends Project {
  tasks: Task[]
}

async function getProjectsWithTasks(clientId: string): Promise<ProjectWithTasks[]> {
  const supabase = getSupabaseClient()

  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('*')
    .eq('client_id', clientId)
    .is('archived_at', null)
    .order('start_date', { ascending: false })

  if (projectsError || !projects) {
    return []
  }

  const projectIds = projects.map((p) => p.id)
  if (projectIds.length === 0) {
    return projects.map((p) => ({ ...(p as Project), tasks: [] }))
  }

  const { data: tasks, error: tasksError } = await supabase
    .from('tasks')
    .select('*')
    .in('project_id', projectIds)
    .is('archived_at', null)

  if (tasksError || !tasks) {
    return projects.map((p) => ({ ...(p as Project), tasks: [] }))
  }

  const tasksByProject: Record<string, Task[]> = {}
  for (const task of tasks as Task[]) {
    if (!tasksByProject[task.project_id]) {
      tasksByProject[task.project_id] = []
    }
    tasksByProject[task.project_id].push(task)
  }

  return projects.map((p) => ({
    ...(p as Project),
    tasks: tasksByProject[p.id] || [],
  }))
}

async function setClientStatus(formData: FormData) {
  'use server'
  const id = formData.get('id') as string
  const status = formData.get('status') as ClientStatus

  await updateClientStatus(id, status)
  redirect(`/clients/${id}?updated=1`)
}

export default async function ClientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<SearchParams>
}) {
  const { id } = await params
  const sp = await searchParams
  const created = sp.created === '1'
  const updated = sp.updated === '1'
  const projectCreated = sp.projectCreated === '1'
  const projectUpdated = sp.projectUpdated === '1'

  const [client, projectsWithTasks] = await Promise.all([
    getClient(id),
    getProjectsWithTasks(id),
  ])

  if (!client) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Success banner */}
        {(created || updated || projectCreated || projectUpdated) && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800 dark:border-green-900 dark:bg-green-900/20 dark:text-green-200">
            {created && 'Client created successfully.'}
            {updated && 'Client updated successfully.'}
            {projectCreated && 'Project created successfully.'}
            {projectUpdated && 'Project updated successfully.'}
          </div>
        )}

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
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
                  client.status === 'active'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                }`}
              >
                {client.status === 'active' ? 'Active' : 'Non-Active'}
              </span>
              <Link
                href={`/clients/${id}/edit`}
                className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Edit Client
              </Link>
              <form action={setClientStatus}>
                <input type="hidden" name="id" value={id} />
                <input
                  type="hidden"
                  name="status"
                  value={client.status === 'active' ? 'non_active' : 'active'}
                />
                <button
                  type="submit"
                  className={`inline-flex items-center rounded-md px-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    client.status === 'active'
                      ? 'bg-red-50 text-red-700 hover:bg-red-100 focus:ring-red-500 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/40'
                      : 'bg-green-50 text-green-700 hover:bg-green-100 focus:ring-green-500 dark:bg-green-900/20 dark:text-green-300 dark:hover:bg-green-900/40'
                  }`}
                >
                  {client.status === 'active' ? 'Set Non-Active' : 'Set Active'}
                </button>
              </form>
            </div>
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

        {/* Projects and Tasks */}
        <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Projects
            </h2>
            <Link
              href={`/clients/${id}/projects/new`}
              className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
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
              Add Project
            </Link>
          </div>

          {projectsWithTasks.length === 0 ? (
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              This client has no projects yet.
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              {projectsWithTasks.map((project) => (
                <div
                  key={project.id}
                  className="rounded-md border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-950"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                        {project.name}
                      </h3>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {project.start_date && project.end_date
                          ? `${new Date(project.start_date).toLocaleDateString()} – ${new Date(project.end_date).toLocaleDateString()}`
                          : project.start_date
                            ? `From ${new Date(project.start_date).toLocaleDateString()}`
                            : 'No dates set'}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 text-right text-xs">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 font-semibold ${
                          project.status === 'completed'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        }`}
                      >
                        {project.status === 'completed' ? 'Completed' : 'In Progress'}
                      </span>
                      {project.budget !== null && (
                        <span className="text-gray-700 dark:text-gray-300">
                          Budget:{' '}
                          <span className="font-medium">
                            {project.currency} {project.budget.toLocaleString()}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>

                  {project.description && (
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                      {project.description}
                    </p>
                  )}

                  {/* Tasks */}
                  <div className="mt-3">
                    <h4 className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                      Tasks
                    </h4>
                    {project.tasks.length === 0 ? (
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        No tasks for this project yet.
                      </p>
                    ) : (
                      <div className="mt-2 overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-xs dark:divide-gray-700">
                          <thead className="bg-gray-50 dark:bg-gray-900">
                            <tr>
                              <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">
                                Name
                              </th>
                              <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">
                                Status
                              </th>
                              <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">
                                Priority
                              </th>
                              <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">
                                Dates
                              </th>
                              <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">
                                Hours (Est / Actual)
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                            {project.tasks.map((task) => (
                              <tr key={task.id}>
                                <td className="px-3 py-2 text-gray-900 dark:text-gray-100">
                                  {task.name}
                                </td>
                                <td className="px-3 py-2">
                                  <span
                                    className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${
                                      task.status === 'completed'
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                        : task.status === 'in_progress'
                                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                          : task.status === 'on_hold'
                                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                                    }`}
                                  >
                                    {task.status
                                      .replace('_', ' ')
                                      .replace(/\b\w/g, (c) => c.toUpperCase())}
                                  </span>
                                </td>
                                <td className="px-3 py-2">
                                  <span
                                    className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${
                                      task.priority === 'high'
                                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                        : task.priority === 'medium'
                                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                          : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                                    }`}
                                  >
                                    {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                                  </span>
                                </td>
                                <td className="px-3 py-2 text-gray-700 dark:text-gray-300">
                                  {task.start_date && task.end_date
                                    ? `${new Date(task.start_date).toLocaleDateString()} – ${new Date(task.end_date).toLocaleDateString()}`
                                    : task.start_date
                                      ? `From ${new Date(task.start_date).toLocaleDateString()}`
                                      : 'No dates'}
                                </td>
                                <td className="px-3 py-2 text-gray-700 dark:text-gray-300">
                                  {task.estimated_hours !== null
                                    ? `${task.estimated_hours}h`
                                    : '—'}{' '}
                                  /{' '}
                                  {task.actual_hours !== null ? `${task.actual_hours}h` : '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
