'use client'

import { supabase } from '@/lib/supabase'

export async function archiveClient(clientId: string): Promise<void> {
  const { error } = await supabase
    .from('clients')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', clientId)

  if (error) {
    throw new Error(`Failed to archive client: ${error.message}`)
  }
}

export async function archiveClients(clientIds: string[]): Promise<void> {
  if (clientIds.length === 0) return

  const { error } = await supabase
    .from('clients')
    .update({ archived_at: new Date().toISOString() })
    .in('id', clientIds)

  if (error) {
    throw new Error(`Failed to archive clients: ${error.message}`)
  }
}
