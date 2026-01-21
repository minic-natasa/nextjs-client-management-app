'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Project } from '../lib/types'
import { createProject, updateProject } from '../lib/create-project'

// Zod schema for validation
const projectSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(255, 'Name must be less than 255 characters'),
  description: z.string().optional().nullable(),
  budget: z
    .number()
    .positive('Budget must be a positive number')
    .optional()
    .nullable()
    .or(z.literal('').transform(() => null)),
  currency: z.string().min(1, 'Currency is required').max(3, 'Currency code must be 3 characters'),
  status: z.enum(['completed', 'non_completed']),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
}).refine(
  (data) => {
    // If both dates are provided, end_date should be after start_date
    if (data.start_date && data.end_date) {
      return new Date(data.end_date) >= new Date(data.start_date)
    }
    return true
  },
  {
    message: 'End date must be after or equal to start date',
    path: ['end_date'],
  }
)

type ProjectFormData = z.infer<typeof projectSchema>

interface ProjectFormProps {
  project?: Project | null
  clientId: string
  mode?: 'create' | 'edit'
}

export default function ProjectForm({ project, clientId, mode = 'create' }: ProjectFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: project
      ? {
          name: project.name,
          description: project.description || '',
          budget: project.budget || '',
          currency: project.currency,
          status: project.status,
          start_date: project.start_date ? project.start_date.split('T')[0] : '',
          end_date: project.end_date ? project.end_date.split('T')[0] : '',
        }
      : {
          currency: 'USD',
          status: 'non_completed' as const,
        },
  })

  const onSubmit = async (data: ProjectFormData) => {
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const result = mode === 'edit' && project
        ? await updateProject(project.id, {
            ...data,
            client_id: clientId,
            budget: data.budget === '' || data.budget === null ? null : Number(data.budget),
          })
        : await createProject({
            ...data,
            client_id: clientId,
            budget: data.budget === '' || data.budget === null ? null : Number(data.budget),
          })

      if (!result.success) {
        setSubmitError(result.error || 'An error occurred')
        setIsSubmitting(false)
        return
      }

      // Redirect to client detail page with success message
      router.push(`/clients/${clientId}?projectCreated=${mode === 'create' ? '1' : '0'}&projectUpdated=${mode === 'edit' ? '1' : '0'}`)
      router.refresh()
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'An unexpected error occurred')
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {submitError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
          {submitError}
        </div>
      )}

      {/* Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          type="text"
          {...register('name')}
          className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white ${
            errors.name
              ? 'border-red-300 dark:border-red-700'
              : 'border-gray-300 dark:border-gray-600'
          }`}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name.message}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Description
        </label>
        <textarea
          id="description"
          rows={4}
          {...register('description')}
          className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white ${
            errors.description
              ? 'border-red-300 dark:border-red-700'
              : 'border-gray-300 dark:border-gray-600'
          }`}
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.description.message}</p>
        )}
      </div>

      {/* Budget and Currency */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="budget" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Budget
          </label>
          <input
            id="budget"
            type="number"
            step="0.01"
            min="0"
            {...register('budget', { valueAsNumber: true })}
            className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white ${
              errors.budget
                ? 'border-red-300 dark:border-red-700'
                : 'border-gray-300 dark:border-gray-600'
            }`}
          />
          {errors.budget && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.budget.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="currency" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Currency <span className="text-red-500">*</span>
          </label>
          <select
            id="currency"
            {...register('currency')}
            className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white ${
              errors.currency
                ? 'border-red-300 dark:border-red-700'
                : 'border-gray-300 dark:border-gray-600'
            }`}
          >
            <option value="USD">USD - US Dollar</option>
            <option value="EUR">EUR - Euro</option>
            <option value="GBP">GBP - British Pound</option>
            <option value="JPY">JPY - Japanese Yen</option>
            <option value="CAD">CAD - Canadian Dollar</option>
            <option value="AUD">AUD - Australian Dollar</option>
            <option value="CHF">CHF - Swiss Franc</option>
            <option value="CNY">CNY - Chinese Yuan</option>
          </select>
          {errors.currency && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.currency.message}</p>
          )}
        </div>
      </div>

      {/* Status */}
      <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Status <span className="text-red-500">*</span>
        </label>
        <select
          id="status"
          {...register('status')}
          className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white ${
            errors.status
              ? 'border-red-300 dark:border-red-700'
              : 'border-gray-300 dark:border-gray-600'
          }`}
        >
          <option value="non_completed">Non-Completed</option>
          <option value="completed">Completed</option>
        </select>
        {errors.status && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.status.message}</p>
        )}
      </div>

      {/* Dates */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Start Date
          </label>
          <input
            id="start_date"
            type="date"
            {...register('start_date')}
            className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white ${
              errors.start_date
                ? 'border-red-300 dark:border-red-700'
                : 'border-gray-300 dark:border-gray-600'
            }`}
          />
          {errors.start_date && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.start_date.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            End Date
          </label>
          <input
            id="end_date"
            type="date"
            {...register('end_date')}
            className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white ${
              errors.end_date
                ? 'border-red-300 dark:border-red-700'
                : 'border-gray-300 dark:border-gray-600'
            }`}
          />
          {errors.end_date && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.end_date.message}</p>
          )}
        </div>
      </div>

      {/* Submit Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Saving...' : mode === 'edit' ? 'Update Project' : 'Create Project'}
        </button>
      </div>
    </form>
  )
}
