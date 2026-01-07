import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Play,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  MapPin,
  Search,
  Sparkles,
  Zap,
  Target,
  TrendingUp,
  History
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
    refetchInterval: 5000,
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
  const completedJobs = jobs?.filter(j => j.status === 'completed') || []
  const totalLeadsFound = completedJobs.reduce((acc, j) => acc + (j.leads_found || 0), 0)

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Scraping</h1>
          <p className="text-slate-500 mt-1">Buscar inmobiliarias en Google Maps</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-sm font-medium">
            <span className="text-slate-400">Total leads:</span>{' '}
            <span className="text-slate-900 font-bold">{totalLeadsFound}</span>
          </div>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Search className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Búsquedas totales</p>
              <p className="text-2xl font-bold text-slate-900">{jobs?.length || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Completadas</p>
              <p className="text-2xl font-bold text-slate-900">{completedJobs.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Leads encontrados</p>
              <p className="text-2xl font-bold text-slate-900">{totalLeadsFound}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Start new scraping */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">Iniciar Nueva Búsqueda</h2>
              <p className="text-xs text-slate-500">Selecciona una ciudad argentina</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[250px]">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Ciudad
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                >
                  <option value="">Seleccionar ciudad...</option>
                  {cities?.cities.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={() => startMutation.mutate({ city: selectedCity })}
              disabled={!selectedCity || startMutation.isPending || hasRunningJobs}
              className="btn-gradient px-6 py-3 rounded-xl inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
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
            <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200">
              <p className="text-sm text-amber-700 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="font-medium">Scraping en progreso</span> - Espera a que termine para iniciar otro.
              </p>
            </div>
          )}

          <div className="mt-6 p-5 bg-gradient-to-br from-slate-50 to-indigo-50/30 rounded-xl border border-slate-100">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              <h3 className="text-sm font-semibold text-slate-700">Keywords que se buscarán</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {['inmobiliaria', 'bienes raices', 'real estate', 'propiedades', 'agencia inmobiliaria'].map(kw => (
                <span
                  key={kw}
                  className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-slate-200 text-slate-600 shadow-sm"
                >
                  {kw}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Jobs history */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center shadow-lg shadow-slate-500/30">
              <History className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">Historial de Búsquedas</h2>
              <p className="text-xs text-slate-500">Todas las búsquedas realizadas</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {jobsLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-indigo-100 border-t-indigo-500 animate-spin" />
                <Search className="absolute inset-0 m-auto w-6 h-6 text-indigo-500" />
              </div>
              <p className="mt-4 text-slate-500">Cargando historial...</p>
            </div>
          ) : jobs && jobs.length > 0 ? (
            <div className="space-y-3">
              {jobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-slate-100 to-indigo-50 flex items-center justify-center">
                <Search className="w-10 h-10 text-slate-300" />
              </div>
              <p className="text-slate-500 mb-2">No hay búsquedas aún</p>
              <p className="text-sm text-slate-400">Selecciona una ciudad e inicia el scraping</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function JobCard({ job }: { job: ScrapingJob }) {
  const statusConfig = {
    pending: {
      icon: Clock,
      gradient: 'from-slate-400 to-slate-500',
      shadow: 'shadow-slate-400/30',
      bg: 'bg-slate-50',
      textColor: 'text-slate-600',
      label: 'Pendiente'
    },
    running: {
      icon: Loader2,
      gradient: 'from-blue-500 to-cyan-500',
      shadow: 'shadow-blue-500/30',
      bg: 'bg-blue-50',
      textColor: 'text-blue-600',
      label: 'En progreso',
      spin: true
    },
    completed: {
      icon: CheckCircle,
      gradient: 'from-emerald-500 to-teal-500',
      shadow: 'shadow-emerald-500/30',
      bg: 'bg-emerald-50',
      textColor: 'text-emerald-600',
      label: 'Completado'
    },
    failed: {
      icon: XCircle,
      gradient: 'from-rose-500 to-red-500',
      shadow: 'shadow-rose-500/30',
      bg: 'bg-rose-50',
      textColor: 'text-rose-600',
      label: 'Fallido'
    },
  }

  const status = statusConfig[job.status as keyof typeof statusConfig] || statusConfig.pending
  const StatusIcon = status.icon

  return (
    <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all group">
      <div className="flex items-center gap-4">
        <div className={clsx(
          'w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg',
          status.gradient,
          status.shadow
        )}>
          <StatusIcon className={clsx(
            'w-6 h-6 text-white',
            'spin' in status && status.spin && 'animate-spin'
          )} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-slate-400" />
            <span className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
              {job.city}
            </span>
          </div>
          <p className="text-sm text-slate-500">
            {format(new Date(job.created_at), "dd MMM yyyy 'a las' HH:mm", { locale: es })}
          </p>
        </div>
      </div>

      <div className="text-right flex items-center gap-4">
        {job.status === 'completed' && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-semibold">{job.leads_found} leads</span>
          </div>
        )}

        <span className={clsx(
          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold',
          status.bg,
          status.textColor
        )}>
          {status.label}
        </span>

        {job.error_message && (
          <span
            className="text-xs text-rose-600 bg-rose-50 px-2 py-1 rounded-lg cursor-help"
            title={job.error_message}
          >
            Ver error
          </span>
        )}
      </div>
    </div>
  )
}
