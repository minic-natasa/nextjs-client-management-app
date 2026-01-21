import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { resolve } from 'path'

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables!')
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface SeedData {
  clients: any[]
  teamMembers: any[]
  projects: any[]
  tasks: any[]
  categories: any[]
}

// Sample team members
const teamMembers = [
  { name: 'John Doe', email: 'john.doe@example.com', role: 'Developer', is_active: true },
  { name: 'Jane Smith', email: 'jane.smith@example.com', role: 'Designer', is_active: true },
  { name: 'Bob Johnson', email: 'bob.johnson@example.com', role: 'Project Manager', is_active: true },
  { name: 'Alice Williams', email: 'alice.williams@example.com', role: 'Developer', is_active: true },
  { name: 'Charlie Brown', email: 'charlie.brown@example.com', role: 'QA Engineer', is_active: true },
]

// Sample project categories
const categories = [
  { name: 'Web Development', color: '#3B82F6', description: 'Web-based applications and websites' },
  { name: 'Mobile App', color: '#10B981', description: 'Mobile application development' },
  { name: 'Design', color: '#F59E0B', description: 'UI/UX design projects' },
  { name: 'Marketing', color: '#EF4444', description: 'Marketing and branding projects' },
  { name: 'E-commerce', color: '#8B5CF6', description: 'E-commerce platform development' },
]

async function seed() {
  console.log('🌱 Starting database seed...\n')

  try {
    // 1. Seed Team Members
    console.log('📝 Seeding team members...')
    const { data: teamMembersData, error: teamError } = await supabase
      .from('team_members')
      .upsert(teamMembers, { onConflict: 'email', ignoreDuplicates: true })
      .select()

    if (teamError) {
      console.error('❌ Error seeding team members:', teamError.message)
      return
    }
    console.log(`✅ Seeded ${teamMembersData?.length || 0} team members\n`)

    // 2. Seed Project Categories
    console.log('📝 Seeding project categories...')
    const { data: categoriesData, error: categoriesError } = await supabase
      .from('project_categories')
      .upsert(categories, { onConflict: 'name', ignoreDuplicates: true })
      .select()

    if (categoriesError) {
      console.error('❌ Error seeding categories:', categoriesError.message)
      return
    }
    console.log(`✅ Seeded ${categoriesData?.length || 0} categories\n`)

    // 3. Seed Clients
    console.log('📝 Seeding clients...')
    const clients = [
      {
        name: 'Acme Corporation',
        email: 'contact@acme.com',
        phone: '+1-555-0101',
        website_url: 'https://acme.com',
        status: 'active',
        notes: 'Large enterprise client. Prefers monthly check-ins.',
      },
      {
        name: 'TechStart Inc.',
        email: 'hello@techstart.io',
        phone: '+1-555-0102',
        website_url: 'https://techstart.io',
        status: 'active',
        notes: 'Startup company. Fast-moving projects.',
      },
      {
        name: 'Global Solutions Ltd.',
        email: 'info@globalsolutions.com',
        phone: '+1-555-0103',
        website_url: 'https://globalsolutions.com',
        status: 'active',
        notes: 'International company with multiple offices.',
      },
      {
        name: 'Digital Innovations',
        email: 'contact@digitalinnov.com',
        phone: '+1-555-0104',
        website_url: null,
        status: 'active',
        notes: 'New client. Initial consultation completed.',
      },
      {
        name: 'Creative Agency',
        email: 'hello@creativeagency.com',
        phone: '+1-555-0105',
        website_url: 'https://creativeagency.com',
        status: 'non_active',
        notes: 'Client on hold due to budget constraints.',
      },
      {
        name: 'Retail Plus',
        email: 'info@retailplus.com',
        phone: '+1-555-0106',
        website_url: 'https://retailplus.com',
        status: 'active',
        notes: 'Retail chain looking to expand online presence.',
      },
      {
        name: 'FinanceHub',
        email: 'contact@financehub.com',
        phone: '+1-555-0107',
        website_url: 'https://financehub.com',
        status: 'active',
        notes: 'Financial services company. Security is top priority.',
      },
      {
        name: 'HealthCare Systems',
        email: 'hello@healthcare.com',
        phone: '+1-555-0108',
        website_url: 'https://healthcare.com',
        status: 'active',
        notes: 'Healthcare provider. HIPAA compliance required.',
      },
    ]

    const { data: clientsData, error: clientsError } = await supabase
      .from('clients')
      .upsert(clients, { onConflict: 'email', ignoreDuplicates: true })
      .select()

    if (clientsError) {
      console.error('❌ Error seeding clients:', clientsError.message)
      return
    }
    console.log(`✅ Seeded ${clientsData?.length || 0} clients\n`)

    if (!clientsData || clientsData.length === 0) {
      console.log('⚠️  No clients were inserted. They may already exist.\n')
    }

    // Get the inserted clients for project seeding
    const { data: allClients } = await supabase
      .from('clients')
      .select('id, name')
      .is('archived_at', null)

    if (!allClients || allClients.length === 0) {
      console.log('⚠️  No clients found. Cannot seed projects.\n')
      return
    }

    // 4. Seed Projects
    console.log('📝 Seeding projects...')
    const projects: any[] = []

    // Helper to get a date N days ago or in the future
    const daysAgo = (days: number) => {
      const date = new Date()
      date.setDate(date.getDate() - days)
      return date.toISOString().split('T')[0]
    }

    const daysFromNow = (days: number) => {
      const date = new Date()
      date.setDate(date.getDate() + days)
      return date.toISOString().split('T')[0]
    }

    // Generate projects for each client
    allClients.forEach((client, index) => {
      const clientProjects = []

      // First client gets 3 projects
      if (index === 0) {
        clientProjects.push(
          {
            client_id: client.id,
            name: 'Website Redesign',
            description: 'Complete redesign of company website with modern UI/UX',
            budget: 50000,
            currency: 'USD',
            status: 'completed',
            start_date: daysAgo(120),
            end_date: daysAgo(30),
          },
          {
            client_id: client.id,
            name: 'Mobile App Development',
            description: 'Native iOS and Android app for customer engagement',
            budget: 75000,
            currency: 'USD',
            status: 'non_completed',
            start_date: daysAgo(60),
            end_date: daysFromNow(60),
          },
          {
            client_id: client.id,
            name: 'E-commerce Platform',
            description: 'Build online store with payment integration',
            budget: 45000,
            currency: 'USD',
            status: 'non_completed',
            start_date: daysAgo(30),
            end_date: daysFromNow(90),
          }
        )
      }
      // Second client gets 2 projects
      else if (index === 1) {
        clientProjects.push(
          {
            client_id: client.id,
            name: 'Brand Identity Design',
            description: 'Create new brand identity and marketing materials',
            budget: 25000,
            currency: 'USD',
            status: 'completed',
            start_date: daysAgo(90),
            end_date: daysAgo(20),
          },
          {
            client_id: client.id,
            name: 'Marketing Campaign',
            description: 'Digital marketing campaign for product launch',
            budget: 35000,
            currency: 'USD',
            status: 'non_completed',
            start_date: daysAgo(15),
            end_date: daysFromNow(45),
          }
        )
      }
      // Third client gets mixed projects
      else if (index === 2) {
        clientProjects.push(
          {
            client_id: client.id,
            name: 'Enterprise Portal',
            description: 'Internal portal for employee management',
            budget: 100000,
            currency: 'USD',
            status: 'non_completed',
            start_date: daysAgo(45),
            end_date: daysFromNow(120),
          },
          {
            client_id: client.id,
            name: 'API Integration',
            description: 'Integrate third-party APIs for data synchronization',
            budget: 30000,
            currency: 'USD',
            status: 'completed',
            start_date: daysAgo(75),
            end_date: daysAgo(10),
          }
        )
      }
      // Fourth client gets 1 project
      else if (index === 3) {
        clientProjects.push({
          client_id: client.id,
          name: 'Website Development',
          description: 'Build new company website from scratch',
          budget: 40000,
          currency: 'USD',
          status: 'non_completed',
          start_date: daysAgo(20),
          end_date: daysFromNow(60),
        })
      }
      // Remaining clients get 1 project each
      else {
        clientProjects.push({
          client_id: client.id,
          name: `Project for ${client.name}`,
          description: `Main project for ${client.name}`,
          budget: Math.floor(Math.random() * 50000) + 20000,
          currency: 'USD',
          status: Math.random() > 0.5 ? 'completed' : 'non_completed',
          start_date: daysAgo(30),
          end_date: daysFromNow(30),
        })
      }

      projects.push(...clientProjects)
    })

    const { data: projectsData, error: projectsError } = await supabase
      .from('projects')
      .upsert(projects, { onConflict: 'id', ignoreDuplicates: true })
      .select()

    if (projectsError) {
      console.error('❌ Error seeding projects:', projectsError.message)
      return
    }
    console.log(`✅ Seeded ${projectsData?.length || 0} projects\n`)

    // 5. Seed Tasks
    console.log('📝 Seeding tasks...')
    if (!projectsData || projectsData.length === 0) {
      console.log('⚠️  No projects found. Cannot seed tasks.\n')
      return
    }

    const { data: allTeamMembers } = await supabase
      .from('team_members')
      .select('id')
      .eq('is_active', true)

    const taskStatuses = ['open', 'in_progress', 'on_hold', 'completed']
    const priorities = ['low', 'medium', 'high']
    const tasks: any[] = []

    // Create tasks for the first few projects
    projectsData.slice(0, 5).forEach((project) => {
      const numTasks = Math.floor(Math.random() * 5) + 3 // 3-7 tasks per project
      
      for (let i = 0; i < numTasks; i++) {
        const assignedTo = allTeamMembers && allTeamMembers.length > 0
          ? allTeamMembers[Math.floor(Math.random() * allTeamMembers.length)].id
          : null

        tasks.push({
          project_id: project.id,
          name: `Task ${i + 1} for ${project.name}`,
          description: `Description for task ${i + 1} of ${project.name}`,
          status: taskStatuses[Math.floor(Math.random() * taskStatuses.length)],
          priority: priorities[Math.floor(Math.random() * priorities.length)],
          assigned_to: assignedTo,
          estimated_hours: Math.floor(Math.random() * 40) + 8,
          actual_hours: Math.random() > 0.5 ? Math.floor(Math.random() * 50) + 5 : null,
          start_date: project.start_date,
          end_date: project.end_date
            ? daysFromNow(
                Math.floor(
                  (new Date(project.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                ) / 2
              )
            : null,
        })
      }
    })

    const { data: tasksData, error: tasksError } = await supabase
      .from('tasks')
      .upsert(tasks, { onConflict: 'id', ignoreDuplicates: true })
      .select()

    if (tasksError) {
      console.error('❌ Error seeding tasks:', tasksError.message)
      return
    }
    console.log(`✅ Seeded ${tasksData?.length || 0} tasks\n`)

    console.log('🎉 Database seeding completed successfully!')
    console.log('\n📊 Summary:')
    console.log(`   - Clients: ${clientsData?.length || 0}`)
    console.log(`   - Projects: ${projectsData?.length || 0}`)
    console.log(`   - Tasks: ${tasksData?.length || 0}`)
    console.log(`   - Team Members: ${teamMembersData?.length || 0}`)
    console.log(`   - Categories: ${categoriesData?.length || 0}`)
  } catch (error) {
    console.error('❌ Unexpected error during seeding:', error)
    process.exit(1)
  }
}

seed()
