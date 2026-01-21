'use server'

import { getSupabaseClient } from '@/lib/supabase'
import type { ClientStatus } from './types'

export interface CreateClientData {
  name: string
  email: string
  phone: string
  website_url?: string | null
  status: ClientStatus
  notes?: string | null
}

export interface CreateClientResult {
  success: boolean
  error?: string
  clientId?: string
}

export async function createClient(data: CreateClientData): Promise<CreateClientResult> {
  try {
    const supabase = getSupabaseClient()

    const { data: client, error } = await supabase
      .from('clients')
      .insert({
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        phone: data.phone.trim(),
        website_url: data.website_url?.trim() || null,
        status: data.status,
        notes: data.notes?.trim() || null,
      })
      .select()
      .single()

    if (error) {
      // Handle unique constraint violations
      if (error.code === '23505') {
        if (error.message.includes('email')) {
          return {
            success: false,
            error: 'A client with this email already exists. Please use a different email.',
          }
        }
        if (error.message.includes('phone')) {
          return {
            success: false,
            error: 'A client with this phone number already exists. Please use a different phone number.',
          }
        }
      }

      return {
        success: false,
        error: error.message || 'Failed to create client',
      }
    }

    return {
      success: true,
      clientId: client.id,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}

export async function updateClient(
  clientId: string,
  data: CreateClientData
): Promise<CreateClientResult> {
  try {
    const supabase = getSupabaseClient()

    const { data: client, error } = await supabase
      .from('clients')
      .update({
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        phone: data.phone.trim(),
        website_url: data.website_url?.trim() || null,
        status: data.status,
        notes: data.notes?.trim() || null,
      })
      .eq('id', clientId)
      .select()
      .single()

    if (error) {
      // Handle unique constraint violations
      if (error.code === '23505') {
        if (error.message.includes('email')) {
          return {
            success: false,
            error: 'A client with this email already exists. Please use a different email.',
          }
        }
        if (error.message.includes('phone')) {
          return {
            success: false,
            error: 'A client with this phone number already exists. Please use a different phone number.',
          }
        }
      }

      return {
        success: false,
        error: error.message || 'Failed to update client',
      }
    }

    return {
      success: true,
      clientId: client.id,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}
