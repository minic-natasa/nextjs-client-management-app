import type { ClientWithStats } from './types'

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatCurrency(
  amount: number,
  currency: string = 'USD'
): string {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return formatter.format(amount)
}

export function truncateNotes(notes: string | null, maxLength: number = 50): string {
  if (!notes) return 'No notes'
  if (notes.length <= maxLength) return notes
  return notes.substring(0, maxLength) + '...'
}

export function exportToCSV(clients: ClientWithStats[]): void {
  const headers = [
    'Name',
    'Status',
    'Email',
    'Phone',
    'Website',
    'Projects',
    'Total Budget',
    'Currency',
    'Created',
    'Earliest Project',
    'Latest Project',
    'Notes',
  ]

  const rows = clients.map((client) => [
    client.name,
    client.status,
    client.email,
    client.phone,
    client.website_url || '',
    client.projects_count.toString(),
    client.total_budget.toString(),
    client.primary_currency,
    formatDateForCSV(client.created_at),
    formatDateForCSV(client.earliest_start),
    formatDateForCSV(client.latest_end),
    client.notes || '',
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ),
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', `clients_${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

function formatDateForCSV(dateString: string | null | undefined): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toISOString().split('T')[0] // YYYY-MM-DD format
}
