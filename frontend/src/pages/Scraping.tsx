import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Play,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  MapPin
} from 'lucide-react'
import clsx from 'clsx'
import { scrapingApi, type ScrapingJob } from '../services/api'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function Scraping() {
  const queryClient = useQueryClient()
  const [selectedCity, setSelectedCity] = useState('')

  const { data: cities } = useQuery({
    queryKey: ['cities'],
    queryFn: scrapingApi.getCities,
  })

  const { data: jobs, isLoading: jobsLoading } = useQuery({
    queryKey: ['scraping-jobs'],
    queryFn: scrapingApi.getJobs,
    refetchInterval: 5000, // Refresh every 5 seconds
  })

  const startMutation = useMutation({
    mutationFn: scrapingApi.start,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scraping-jobs'] })
      setSelectedCity('')
    },
  })

  const runningJobs = jobs?.filter(j => j.status === 'running') || []
  const hasRunningJobs = runningJobs.length > 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Scraping</h1>
        <p className="text-gray-500">Buscar inmobiliarias en Google Maps</p>
      </div>

      {/* Start new scraping */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Iniciar Nueva Búsqueda</h2>

        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ciudad
            </label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Seleccionar ciudad...</option>
              {cities?.cities.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => startMutation.mutate({ city: selectedCity })}
            disabled={!selectedCity || startMutation.isPending || hasRunningJobs}
            className="inline-flex items-center gap-2 px-6 py-2 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {startMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Play className="w-5 h-5" />
            )}
            Iniciar Scraping
          </button>
        </div>

        {hasRunningJobs && (
          <p className="mt-4 text-sm text-amber-600 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Hay un scraping en progreso. Espera a que termine.
          </p>
        )}

        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Keywords que se buscarán:</h3>
          <div className="flex flex-wrap gap-2">
            {['inmobiliaria', 'bienes raices', 'real estate', 'propiedades', 'agencia inmobiliaria'].map(kw => (
              <span key={kw} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-700">
                {kw}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Jobs history */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Historial de Búsquedas</h2>

        {jobsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : jobs && jobs.length > 0 ? (
          <div className="space-y-3">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        ) : (
          <p className="text-center py-8 text-gray-500">
            No hay búsquedas aún. Selecciona una ciudad e inicia el scraping.
          </p>
        )}
      </div>
    </div>
  )
}

function JobCard({ job }: { job: ScrapingJob }) {
  const statusConfig = {
    pending: { icon: Clock, color: 'text-gray-500', bg: 'bg-gray-100', label: 'Pendiente' },
    running: { icon: Loader2, color: 'text-blue-500', bg: 'bg-blue-100', label: 'En progreso', spin: true },
    completed: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-100', label: 'Completado' },
    failed: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-100', label: 'Fallido' },
  }

  const status = statusConfig[job.status as keyof typeof statusConfig] || statusConfig.pending
  const StatusIcon = status.icon

  return (
    <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200">
      <div className="flex items-center gap-4">
        <div className={clsx('p-2 rounded-lg', status.bg)}>
          <StatusIcon className={clsx('w-5 h-5', status.color, 'spin' in status && status.spin && 'animate-spin')} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span className="font-medium text-gray-900">{job.city}</span>
          </div>
          <p className="text-sm text-gray-500">
            {format(new Date(job.created_at), "dd MMM yyyy 'a las' HH:mm", { locale: es })}
          </p>
        </div>
      </div>

      <div className="text-right">
        <span className={clsx(
          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
          status.bg,
          status.color
        )}>
          {status.label}
        </span>
        {job.status === 'completed' && (
          <p className="text-sm text-gray-600 mt-1">
            {job.leads_found} leads encontrados
          </p>
        )}
        {job.error_message && (
          <p className="text-sm text-red-600 mt-1" title={job.error_message}>
            Error
          </p>
        )}
      </div>
    </div>
  )
}
