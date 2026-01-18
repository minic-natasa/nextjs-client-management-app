import { supabase } from '@/lib/supabase'
import type { ClientWithStats, Project } from './types'

export async function fetchClientsWithStats(): Promise<ClientWithStats[]> {
  // First, fetch all active clients
  const { data: clients, error: clientsError } = await supabase
    .from('clients')
    .select('*')
    .is('archived_at', null)
    .order('created_at', { ascending: false })

  if (clientsError) {
    throw new Error(`Failed to fetch clients: ${clientsError.message}`)
  }

  if (!clients || clients.length === 0) {
    return []
  }

  // Fetch all active projects for these clients
  const clientIds = clients.map((c) => c.id)
  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('*')
    .in('client_id', clientIds)
    .is('archived_at', null)

  if (projectsError) {
    throw new Error(`Failed to fetch projects: ${projectsError.message}`)
  }

  // Aggregate project data per client
  const clientsWithStats: ClientWithStats[] = clients.map((client) => {
    const clientProjects = (projects || []).filter(
      (p) => p.client_id === client.id
    )

    // Calculate stats
    const projectsCount = clientProjects.length

    // Find primary currency (most common currency)
    const currencyCounts: Record<string, number> = {}
    clientProjects.forEach((p) => {
      if (p.currency && p.budget) {
        currencyCounts[p.currency] = (currencyCounts[p.currency] || 0) + 1
      }
    })

    const primaryCurrency =
      Object.keys(currencyCounts).length > 0
        ? Object.entries(currencyCounts).sort((a, b) => b[1] - a[1])[0][0]
        : 'USD'

    // Sum budgets in primary currency
    const totalBudget =
      clientProjects
        .filter((p) => p.currency === primaryCurrency && p.budget)
        .reduce((sum, p) => sum + (p.budget || 0), 0) || 0

    // Get earliest and latest dates
    const dates = clientProjects
      .map((p) => ({
        start: p.start_date,
        end: p.end_date,
      }))
      .filter((d) => d.start || d.end)

    const earliestStart =
      dates.length > 0
        ? dates
            .map((d) => d.start)
            .filter((d): d is string => d !== null)
            .sort()[0] || null
        : null

    const latestEnd =
      dates.length > 0
        ? dates
            .map((d) => d.end)
            .filter((d): d is string => d !== null)
            .sort()
            .reverse()[0] || null
        : null

    return {
      ...client,
      projects_count: projectsCount,
      total_budget: totalBudget,
      primary_currency: primaryCurrency,
      earliest_start: earliestStart,
      latest_end: latestEnd,
    }
  })

  return clientsWithStats
}
