'use server'

import { getSupabaseClient } from '@/lib/supabase'

export interface CreateProjectData {
  client_id: string
  name: string
  description?: string | null
  budget?: number | null
  currency: string
  status: 'completed' | 'non_completed'
  start_date?: string | null
  end_date?: string | null
}

export interface CreateProjectResult {
  success: boolean
  error?: string
  projectId?: string
}

export async function createProject(data: CreateProjectData): Promise<CreateProjectResult> {
  try {
    const supabase = getSupabaseClient()

    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        client_id: data.client_id,
        name: data.name.trim(),
        description: data.description?.trim() || null,
        budget: data.budget || null,
        currency: data.currency,
        status: data.status,
        start_date: data.start_date || null,
        end_date: data.end_date || null,
      })
      .select()
      .single()

    if (error) {
      return {
        success: false,
        error: error.message || 'Failed to create project',
      }
    }

    return {
      success: true,
      projectId: project.id,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}

export async function updateProject(
  projectId: string,
  data: CreateProjectData
): Promise<CreateProjectResult> {
  try {
    const supabase = getSupabaseClient()

    const { data: project, error } = await supabase
      .from('projects')
      .update({
        name: data.name.trim(),
        description: data.description?.trim() || null,
        budget: data.budget || null,
        currency: data.currency,
        status: data.status,
        start_date: data.start_date || null,
        end_date: data.end_date || null,
      })
      .eq('id', projectId)
      .select()
      .single()

    if (error) {
      return {
        success: false,
        error: error.message || 'Failed to update project',
      }
    }

    return {
      success: true,
      projectId: project.id,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}
