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
  X
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
          <p className="text-gray-500">{data?.total || 0} leads en total</p>
        </div>

        {selectedLeads.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">{selectedLeads.length} seleccionados</span>
            <button
              onClick={() => analyzeMutation.mutate(selectedLeads)}
              disabled={analyzeMutation.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className={clsx('w-4 h-4', analyzeMutation.isPending && 'animate-spin')} />
              Analizar
            </button>
            <button
              onClick={() => exportMutation.mutate({ lead_ids: selectedLeads })}
              disabled={exportMutation.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50"
            >
              <Upload className={clsx('w-4 h-4', exportMutation.isPending && 'animate-spin')} />
              Exportar a GHL
            </button>
          </div>
        )}
      </div>

      {/* Search and filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, email..."
                value={search}
                onChange={(e) => updateParam('search', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          {/* City filter */}
          <select
            value={city}
            onChange={(e) => updateParam('city', e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">Todos los scores</option>
            <option value="80">80+ (Hot)</option>
            <option value="60">60+ (Warm)</option>
            <option value="40">40+ (Medium)</option>
            <option value="20">20+ (Cool)</option>
          </select>

          {/* Analyzed filter */}
          <select
            value={isAnalyzed}
            onChange={(e) => updateParam('is_analyzed', e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">Todos</option>
            <option value="true">Analizados</option>
            <option value="false">Sin analizar</option>
          </select>

          {/* Sort */}
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [by, order] = e.target.value.split('-')
              updateParam('sort_by', by)
              updateParam('sort_order', order)
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="opportunity_score-desc">Score (mayor primero)</option>
            <option value="opportunity_score-asc">Score (menor primero)</option>
            <option value="created_at-desc">Más recientes</option>
            <option value="name-asc">Nombre A-Z</option>
            <option value="rating-desc">Mejor rating</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={data?.items && selectedLeads.length === data.items.length}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Inmobiliaria</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ciudad</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contacto</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rating</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stack</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
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
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Mostrando {((page - 1) * 20) + 1} - {Math.min(page * 20, data.total)} de {data.total}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateParam('page', String(page - 1))}
                    disabled={page === 1}
                    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-sm text-gray-600">
                    Página {page} de {data.pages}
                  </span>
                  <button
                    onClick={() => updateParam('page', String(page + 1))}
                    disabled={page === data.pages}
                    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </>
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
    <tr className={clsx('hover:bg-gray-50', selected && 'bg-primary-50')}>
      <td className="px-4 py-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={onSelect}
          className="rounded border-gray-300"
        />
      </td>
      <td className="px-4 py-3">
        <Link to={`/leads/${lead.id}`} className="font-medium text-gray-900 hover:text-primary-600">
          {lead.name}
        </Link>
        {lead.website && (
          <a
            href={lead.website}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 text-gray-400 hover:text-gray-600"
          >
            <ExternalLink className="w-4 h-4 inline" />
          </a>
        )}
      </td>
      <td className="px-4 py-3">
        <span className="flex items-center gap-1 text-sm text-gray-600">
          <MapPin className="w-4 h-4" />
          {lead.city || '-'}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-col gap-1 text-sm">
          {lead.phone && (
            <a href={`tel:${lead.phone}`} className="flex items-center gap-1 text-gray-600 hover:text-gray-900">
              <Phone className="w-3 h-3" />
              {lead.phone}
            </a>
          )}
          {lead.email && (
            <a href={`mailto:${lead.email}`} className="flex items-center gap-1 text-gray-600 hover:text-gray-900">
              <Mail className="w-3 h-3" />
              {lead.email}
            </a>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        {lead.rating ? (
          <span className="flex items-center gap-1 text-sm">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            {lead.rating.toFixed(1)}
            <span className="text-gray-400">({lead.reviews_count})</span>
          </span>
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </td>
      <td className="px-4 py-3">
        <ScoreBadge score={lead.opportunity_score} />
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className={clsx(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
            lead.is_analyzed ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
          )}>
            {lead.is_analyzed ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
            {lead.is_analyzed ? 'Analizado' : 'Pendiente'}
          </span>
          {lead.is_exported_ghl && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
              GHL
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        {lead.tech_stack ? (
          <TechStackBadges techStack={lead.tech_stack} compact showMissing={false} />
        ) : (
          <span className="text-gray-400 text-sm">Sin analizar</span>
        )}
      </td>
    </tr>
  )
}
