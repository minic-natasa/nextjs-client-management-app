'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { ClientWithStats } from '../lib/types'
import { formatDate, formatCurrency, truncateNotes, exportToCSV } from '../lib/utils'
import { archiveClients } from '../lib/archive-client'
import { updateClientStatus } from '../lib/update-client-status'

interface ClientsTableProps {
  clients: ClientWithStats[]
}

type SortColumn =
  | 'name'
  | 'status'
  | 'email'
  | 'phone'
  | 'projects_count'
  | 'total_budget'
  | 'created_at'
  | 'earliest_start'
  | 'latest_end'
  | null

type SortDirection = 'asc' | 'desc'

export default function ClientsTable({ clients }: ClientsTableProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  // Default to showing only active clients
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'non_active'>('active')
  const [sortColumn, setSortColumn] = useState<SortColumn>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)
  const [isArchiving, setIsArchiving] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)

  // Filter clients based on search and status
  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      // Status filter
      if (statusFilter !== 'all' && client.status !== statusFilter) {
        return false
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesName = client.name.toLowerCase().includes(query)
        const matchesEmail = client.email.toLowerCase().includes(query)
        const matchesPhone = client.phone.toLowerCase().includes(query)
        if (!matchesName && !matchesEmail && !matchesPhone) {
          return false
        }
      }

      return true
    })
  }, [clients, searchQuery, statusFilter])

  // Sort clients
  const sortedClients = useMemo(() => {
    if (!sortColumn) return filteredClients

    const sorted = [...filteredClients].sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortColumn) {
        case 'name':
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case 'status':
          aValue = a.status
          bValue = b.status
          break
        case 'email':
          aValue = a.email.toLowerCase()
          bValue = b.email.toLowerCase()
          break
        case 'phone':
          aValue = a.phone
          bValue = b.phone
          break
        case 'projects_count':
          aValue = a.projects_count
          bValue = b.projects_count
          break
        case 'total_budget':
          aValue = a.total_budget
          bValue = b.total_budget
          break
        case 'created_at':
          aValue = new Date(a.created_at).getTime()
          bValue = new Date(b.created_at).getTime()
          break
        case 'earliest_start':
          aValue = a.earliest_start ? new Date(a.earliest_start).getTime() : 0
          bValue = b.earliest_start ? new Date(b.earliest_start).getTime() : 0
          break
        case 'latest_end':
          aValue = a.latest_end ? new Date(a.latest_end).getTime() : 0
          bValue = b.latest_end ? new Date(b.latest_end).getTime() : 0
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    return sorted
  }, [filteredClients, sortColumn, sortDirection])

  // Paginate clients
  const paginatedClients = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return sortedClients.slice(startIndex, endIndex)
  }, [sortedClients, currentPage, itemsPerPage])

  const totalPages = Math.ceil(sortedClients.length / itemsPerPage)

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
    setCurrentPage(1) // Reset to first page when sorting
  }

  const handleSelectAll = () => {
    if (selectedIds.size === paginatedClients.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(paginatedClients.map((c) => c.id)))
    }
  }

  const handleSelectClient = (clientId: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(clientId)) {
      newSelected.delete(clientId)
    } else {
      newSelected.add(clientId)
    }
    setSelectedIds(newSelected)
  }

  const handleBulkArchive = async () => {
    if (selectedIds.size === 0) return

    if (!confirm(`Are you sure you want to archive ${selectedIds.size} client(s)?`)) {
      return
    }

    setIsArchiving(true)
    const count = selectedIds.size
    try {
      await archiveClients(Array.from(selectedIds))
      setSelectedIds(new Set())
      alert(`Successfully archived ${count} client(s)`)
      router.refresh()
    } catch (error) {
      alert(`Failed to archive clients: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsArchiving(false)
    }
  }

  const handleExportCSV = () => {
    exportToCSV(sortedClients)
  }

  const handleRowClick = (clientId: string, event: React.MouseEvent) => {
    // Don't navigate if clicking on checkbox or action buttons
    const target = event.target as HTMLElement
    if (target.closest('input[type="checkbox"]') || target.closest('button')) {
      return
    }
    router.push(`/clients/${clientId}`)
  }

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
  }

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1) // Reset to first page
  }

  const handleSetToNonActive = async (clientId: string, clientName: string, event: React.MouseEvent) => {
    event.stopPropagation() // Prevent row click

    if (!confirm(`Are you sure you want to set "${clientName}" to Non-Active?`)) {
      return
    }

    setUpdatingStatus(clientId)
    try {
      const result = await updateClientStatus(clientId, 'non_active')
      if (result.success) {
        router.refresh()
      } else {
        alert(`Failed to update status: ${result.error}`)
      }
    } catch (error) {
      alert(`Failed to update status: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setUpdatingStatus(null)
    }
  }

  const handleSetToActive = async (clientId: string, clientName: string, event: React.MouseEvent) => {
    event.stopPropagation() // Prevent row click

    if (!confirm(`Are you sure you want to set "${clientName}" to Active?`)) {
      return
    }

    setUpdatingStatus(clientId)
    try {
      const result = await updateClientStatus(clientId, 'active')
      if (result.success) {
        router.refresh()
      } else {
        alert(`Failed to update status: ${result.error}`)
      }
    } catch (error) {
      alert(`Failed to update status: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setUpdatingStatus(null)
    }
  }

  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column) {
      return (
        <span className="ml-1 text-gray-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
        </span>
      )
    }
    return (
      <span className="ml-1">
        {sortDirection === 'asc' ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </span>
    )
  }

  const allSelected = paginatedClients.length > 0 && selectedIds.size === paginatedClients.length
  const someSelected = selectedIds.size > 0 && selectedIds.size < paginatedClients.length

  return (
    <div className="w-full">
      {/* Toolbar */}
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search and Filters */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as 'all' | 'active' | 'non_active')
              setCurrentPage(1)
            }}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="non_active">Non-Active</option>
          </select>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <button
              onClick={handleBulkArchive}
              disabled={isArchiving}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {isArchiving ? 'Archiving...' : `Archive ${selectedIds.size}`}
            </button>
          )}
          <button
            onClick={handleExportCSV}
            className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="w-12 px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = someSelected
                  }}
                  onChange={handleSelectAll}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th
                className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center">
                  Name
                  <SortIcon column="name" />
                </div>
              </th>
              <th
                className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center">
                  Status
                  <SortIcon column="status" />
                </div>
              </th>
              <th
                className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                onClick={() => handleSort('email')}
              >
                <div className="flex items-center">
                  Email
                  <SortIcon column="email" />
                </div>
              </th>
              <th
                className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                onClick={() => handleSort('phone')}
              >
                <div className="flex items-center">
                  Phone
                  <SortIcon column="phone" />
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Website
              </th>
              <th
                className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                onClick={() => handleSort('projects_count')}
              >
                <div className="flex items-center">
                  Projects
                  <SortIcon column="projects_count" />
                </div>
              </th>
              <th
                className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                onClick={() => handleSort('total_budget')}
              >
                <div className="flex items-center">
                  Total Budget
                  <SortIcon column="total_budget" />
                </div>
              </th>
              <th
                className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                onClick={() => handleSort('created_at')}
              >
                <div className="flex items-center">
                  Created
                  <SortIcon column="created_at" />
                </div>
              </th>
              <th
                className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                onClick={() => handleSort('earliest_start')}
              >
                <div className="flex items-center">
                  Earliest Project
                  <SortIcon column="earliest_start" />
                </div>
              </th>
              <th
                className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                onClick={() => handleSort('latest_end')}
              >
                <div className="flex items-center">
                  Latest Project
                  <SortIcon column="latest_end" />
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300 w-64">
                Notes
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
            {paginatedClients.length === 0 ? (
              <tr>
                <td colSpan={13} className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                  No clients found
                </td>
              </tr>
            ) : (
              paginatedClients.map((client) => (
                <tr
                  key={client.id}
                  onClick={(e) => handleRowClick(client.id, e)}
                  className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(client.id)}
                      onChange={() => handleSelectClient(client.id)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                    {client.name}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        client.status === 'active'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                      }`}
                    >
                      {client.status === 'active' ? 'Active' : 'Non-Active'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {client.email}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {client.phone}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    {client.website_url ? (
                      <a
                        href={client.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        {client.website_url.length > 30
                          ? client.website_url.substring(0, 30) + '...'
                          : client.website_url}
                      </a>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {client.projects_count}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {formatCurrency(client.total_budget, client.primary_currency)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(client.created_at)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(client.earliest_start)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(client.latest_end)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 w-64 max-w-xs">
                    <span
                      title={client.notes || 'No notes'}
                      className="cursor-help"
                    >
                      {truncateNotes(client.notes)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/clients/${client.id}/edit`}
                        className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/40"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <svg
                          className="mr-1 h-3 w-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                        Edit
                      </Link>
                      {client.status === 'active' ? (
                        <button
                          onClick={(e) => handleSetToNonActive(client.id, client.name, e)}
                          disabled={updatingStatus === client.id}
                          className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/40"
                        >
                          {updatingStatus === client.id ? (
                            'Updating...'
                          ) : (
                            <>
                              <svg
                                className="mr-1 h-3 w-3"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                              Set Non-Active
                            </>
                          )}
                        </button>
                      ) : (
                        <button
                          onClick={(e) => handleSetToActive(client.id, client.name, e)}
                          disabled={updatingStatus === client.id}
                          className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-green-900/20 dark:text-green-300 dark:hover:bg-green-900/40"
                        >
                          {updatingStatus === client.id ? (
                            'Updating...'
                          ) : (
                            <>
                              <svg
                                className="mr-1 h-3 w-3"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                              Set Active
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex flex-col items-center justify-between gap-4 sm:flex-row">
        <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <span>Showing</span>
          <select
            value={itemsPerPage}
            onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
            className="rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span>per page</span>
          <span className="ml-4">
            {sortedClients.length === 0
              ? 'No results'
              : `Showing ${(currentPage - 1) * itemsPerPage + 1}-${Math.min(currentPage * itemsPerPage, sortedClients.length)} of ${sortedClients.length}`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="rounded-md border border-gray-300 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Previous
          </button>
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Page {currentPage} of {totalPages || 1}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="rounded-md border border-gray-300 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
