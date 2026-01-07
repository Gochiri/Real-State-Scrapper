import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Phone,
  Mail,
  MapPin,
  Star,
  Upload,
  RefreshCw,
  Check,
  X,
  Sparkles,
  Filter,
  Users
} from 'lucide-react'
import clsx from 'clsx'
import { leadsApi, type Lead } from '../services/api'
import { ScoreBadge } from '../components/ScoreBar'
import TechStackBadges from '../components/TechStackBadges'

export default function Leads() {
  const [searchParams, setSearchParams] = useSearchParams()
  const queryClient = useQueryClient()

  const [selectedLeads, setSelectedLeads] = useState<number[]>([])

  // Parse params
  const page = parseInt(searchParams.get('page') || '1')
  const search = searchParams.get('search') || ''
  const city = searchParams.get('city') || ''
  const minScore = searchParams.get('min_score') || ''
  const isAnalyzed = searchParams.get('is_analyzed') || ''
  const sortBy = searchParams.get('sort_by') || 'opportunity_score'
  const sortOrder = searchParams.get('sort_order') || 'desc'

  const { data, isLoading } = useQuery({
    queryKey: ['leads', page, search, city, minScore, isAnalyzed, sortBy, sortOrder],
    queryFn: () => leadsApi.list({
      page,
      page_size: 20,
      search: search || undefined,
      city: city || undefined,
      min_score: minScore ? parseInt(minScore) : undefined,
      is_analyzed: isAnalyzed ? isAnalyzed === 'true' : undefined,
      sort_by: sortBy,
      sort_order: sortOrder,
    }),
  })

  const analyzeMutation = useMutation({
    mutationFn: leadsApi.analyzeBatch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      setSelectedLeads([])
    },
  })

  const exportMutation = useMutation({
    mutationFn: leadsApi.exportToGHL,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      setSelectedLeads([])
    },
  })

  const updateParam = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams)
    if (value) {
      newParams.set(key, value)
    } else {
      newParams.delete(key)
    }
    if (key !== 'page') {
      newParams.set('page', '1')
    }
    setSearchParams(newParams)
  }

  const toggleSelect = (id: number) => {
    setSelectedLeads(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (data?.items) {
      if (selectedLeads.length === data.items.length) {
        setSelectedLeads([])
      } else {
        setSelectedLeads(data.items.map(l => l.id))
      }
    }
  }

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Leads</h1>
          <p className="text-slate-500 mt-1">{data?.total || 0} inmobiliarias encontradas</p>
        </div>

        {selectedLeads.length > 0 && (
          <div className="flex items-center gap-3 animate-slide-up">
            <span className="text-sm text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg">
              {selectedLeads.length} seleccionados
            </span>
            <button
              onClick={() => analyzeMutation.mutate(selectedLeads)}
              disabled={analyzeMutation.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-medium shadow-lg shadow-blue-500/30 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
            >
              <RefreshCw className={clsx('w-4 h-4', analyzeMutation.isPending && 'animate-spin')} />
              Analizar
            </button>
            <button
              onClick={() => exportMutation.mutate({ lead_ids: selectedLeads })}
              disabled={exportMutation.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-medium shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
            >
              <Upload className={clsx('w-4 h-4', exportMutation.isPending && 'animate-spin')} />
              Exportar a GHL
            </button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Filtros</span>
        </div>
        <div className="flex flex-wrap gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[250px]">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, email..."
                value={search}
                onChange={(e) => updateParam('search', e.target.value)}
                className="input-modern pl-12"
              />
            </div>
          </div>

          {/* City filter */}
          <select
            value={city}
            onChange={(e) => updateParam('city', e.target.value)}
            className="select-modern"
          >
            <option value="">Todas las ciudades</option>
            <option value="Buenos Aires">Buenos Aires</option>
            <option value="CABA">CABA</option>
            <option value="Cordoba">Córdoba</option>
            <option value="Rosario">Rosario</option>
            <option value="Mendoza">Mendoza</option>
          </select>

          {/* Score filter */}
          <select
            value={minScore}
            onChange={(e) => updateParam('min_score', e.target.value)}
            className="select-modern"
          >
            <option value="">Todos los scores</option>
            <option value="80">🔥 80+ (Hot)</option>
            <option value="60">⚡ 60+ (Warm)</option>
            <option value="40">📊 40+ (Medium)</option>
            <option value="20">❄️ 20+ (Cool)</option>
          </select>

          {/* Analyzed filter */}
          <select
            value={isAnalyzed}
            onChange={(e) => updateParam('is_analyzed', e.target.value)}
            className="select-modern"
          >
            <option value="">Todos</option>
            <option value="true">✅ Analizados</option>
            <option value="false">⏳ Sin analizar</option>
          </select>

          {/* Sort */}
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [by, order] = e.target.value.split('-')
              updateParam('sort_by', by)
              updateParam('sort_order', order)
            }}
            className="select-modern"
          >
            <option value="opportunity_score-desc">Score (mayor)</option>
            <option value="opportunity_score-asc">Score (menor)</option>
            <option value="created_at-desc">Más recientes</option>
            <option value="name-asc">Nombre A-Z</option>
            <option value="rating-desc">Mejor rating</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-indigo-100 border-t-indigo-500 animate-spin" />
              <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-indigo-500" />
            </div>
          </div>
        ) : data?.items && data.items.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50/80">
                    <th className="px-5 py-4 text-left">
                      <input
                        type="checkbox"
                        checked={data?.items && selectedLeads.length === data.items.length}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Inmobiliaria</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Ciudad</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Contacto</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Rating</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Score</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Stack</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data?.items.map((lead) => (
                    <LeadRow
                      key={lead.id}
                      lead={lead}
                      selected={selectedLeads.includes(lead.id)}
                      onSelect={() => toggleSelect(lead.id)}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data && data.pages > 1 && (
              <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100 bg-slate-50/50">
                <p className="text-sm text-slate-500">
                  Mostrando <span className="font-medium text-slate-700">{((page - 1) * 20) + 1}</span> - <span className="font-medium text-slate-700">{Math.min(page * 20, data.total)}</span> de <span className="font-medium text-slate-700">{data.total}</span>
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateParam('page', String(page - 1))}
                    disabled={page === 1}
                    className="p-2 rounded-xl hover:bg-white hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft className="w-5 h-5 text-slate-600" />
                  </button>
                  <span className="text-sm text-slate-600 px-3">
                    Página <span className="font-medium">{page}</span> de <span className="font-medium">{data.pages}</span>
                  </span>
                  <button
                    onClick={() => updateParam('page', String(page + 1))}
                    disabled={page === data.pages}
                    className="p-2 rounded-xl hover:bg-white hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronRight className="w-5 h-5 text-slate-600" />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
              <Users className="w-10 h-10 text-slate-400" />
            </div>
            <p className="text-lg font-medium text-slate-700 mb-2">No hay leads</p>
            <p className="text-slate-500 mb-4">Inicia un scraping para encontrar inmobiliarias</p>
            <Link
              to="/scraping"
              className="btn-gradient px-5 py-2.5 rounded-xl inline-flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              Ir a Scraping
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

function LeadRow({
  lead,
  selected,
  onSelect,
}: {
  lead: Lead
  selected: boolean
  onSelect: () => void
}) {
  return (
    <tr className={clsx(
      'group transition-colors',
      selected ? 'bg-indigo-50/50' : 'hover:bg-slate-50/80'
    )}>
      <td className="px-5 py-4">
        <input
          type="checkbox"
          checked={selected}
          onChange={onSelect}
          className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
        />
      </td>
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-500 font-semibold text-sm">
            {lead.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <Link to={`/leads/${lead.id}`} className="font-medium text-slate-900 hover:text-indigo-600 transition-colors">
              {lead.name}
            </Link>
            {lead.website && (
              <a
                href={lead.website}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 text-slate-400 hover:text-indigo-500 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5 inline" />
              </a>
            )}
          </div>
        </div>
      </td>
      <td className="px-5 py-4">
        <span className="flex items-center gap-1.5 text-sm text-slate-600">
          <MapPin className="w-4 h-4 text-slate-400" />
          {lead.city || '-'}
        </span>
      </td>
      <td className="px-5 py-4">
        <div className="flex flex-col gap-1.5">
          {lead.phone && (
            <a href={`tel:${lead.phone}`} className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-indigo-600 transition-colors">
              <Phone className="w-3.5 h-3.5" />
              {lead.phone}
            </a>
          )}
          {lead.email && (
            <a href={`mailto:${lead.email}`} className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-indigo-600 transition-colors">
              <Mail className="w-3.5 h-3.5" />
              <span className="truncate max-w-[150px]">{lead.email}</span>
            </a>
          )}
        </div>
      </td>
      <td className="px-5 py-4">
        {lead.rating ? (
          <span className="flex items-center gap-1.5 text-sm">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span className="font-medium text-slate-700">{lead.rating.toFixed(1)}</span>
            <span className="text-slate-400">({lead.reviews_count})</span>
          </span>
        ) : (
          <span className="text-slate-400 text-sm">-</span>
        )}
      </td>
      <td className="px-5 py-4">
        <ScoreBadge score={lead.opportunity_score} size="sm" />
      </td>
      <td className="px-5 py-4">
        <div className="flex items-center gap-2">
          <span className={clsx(
            'badge',
            lead.is_analyzed ? 'badge-success' : 'bg-slate-100 text-slate-600'
          )}>
            {lead.is_analyzed ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
            {lead.is_analyzed ? 'Analizado' : 'Pendiente'}
          </span>
          {lead.is_exported_ghl && (
            <span className="badge badge-purple">
              GHL
            </span>
          )}
        </div>
      </td>
      <td className="px-5 py-4">
        {lead.tech_stack ? (
          <TechStackBadges techStack={lead.tech_stack} compact showMissing={false} />
        ) : (
          <span className="text-slate-400 text-sm">Sin analizar</span>
        )}
      </td>
    </tr>
  )
}
