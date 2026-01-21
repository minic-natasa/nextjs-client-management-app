'use server'

import { getSupabaseClient } from '@/lib/supabase'
import type { ClientStatus } from './types'

export interface UpdateStatusResult {
  success: boolean
  error?: string
}

export async function updateClientStatus(
  clientId: string,
  status: ClientStatus
): Promise<UpdateStatusResult> {
  try {
    const supabase = getSupabaseClient()

    const { error } = await supabase
      .from('clients')
      .update({ status })
      .eq('id', clientId)

    if (error) {
      return {
        success: false,
        error: error.message || 'Failed to update client status',
      }
    }

    return {
      success: true,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}
