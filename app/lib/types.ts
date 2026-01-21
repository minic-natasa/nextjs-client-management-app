export type ClientStatus = 'active' | 'non_active'

export interface Client {
  id: string
  name: string
  email: string
  phone: string
  website_url: string | null
  status: ClientStatus
  notes: string | null
  created_at: string
  updated_at: string
  archived_at: string | null
}

export interface Project {
  id: string
  client_id: string
  name: string
  description: string | null
  budget: number | null
  currency: string
  status: 'completed' | 'non_completed'
  start_date: string | null
  end_date: string | null
  created_at: string
  updated_at: string
  archived_at: string | null
}

export type TaskStatus = 'open' | 'in_progress' | 'on_hold' | 'completed'
export type TaskPriority = 'low' | 'medium' | 'high'

export interface Task {
  id: string
  project_id: string
  name: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  start_date: string | null
  end_date: string | null
  estimated_hours: number | null
  actual_hours: number | null
  assigned_to: string | null
  created_at: string
  updated_at: string
  archived_at: string | null
}

export interface ClientWithStats extends Client {
  projects_count: number
  total_budget: number
  primary_currency: string
  earliest_start: string | null
  latest_end: string | null
}
