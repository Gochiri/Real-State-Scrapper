import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  ExternalLink,
  Phone,
  Mail,
  MapPin,
  Star,
  Globe,
  RefreshCw,
  Upload,
  Trash2,
  MessageCircle
} from 'lucide-react'
import clsx from 'clsx'
import { leadsApi } from '../services/api'
import ScoreBar from '../components/ScoreBar'
import TechStackBadges from '../components/TechStackBadges'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function LeadDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: lead, isLoading } = useQuery({
    queryKey: ['lead', id],
    queryFn: () => leadsApi.get(parseInt(id!)),
    enabled: !!id,
  })

  const analyzeMutation = useMutation({
    mutationFn: (leadId: number) => leadsApi.analyze(leadId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead', id] })
    },
  })

  const exportMutation = useMutation({
    mutationFn: (leadId: number) => leadsApi.exportToGHL({ lead_ids: [leadId] }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead', id] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (leadId: number) => leadsApi.delete(leadId),
    onSuccess: () => {
      navigate('/leads')
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    )
  }

  if (!lead) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Lead no encontrado</p>
        <Link to="/leads" className="text-primary-600 hover:underline">
          Volver a leads
        </Link>
      </div>
    )
  }

  const whatsappLink = lead.phone
    ? `https://wa.me/${lead.phone.replace(/\D/g, '')}?text=${encodeURIComponent('Hola, me gustaría consultarles sobre sus servicios inmobiliarios.')}`
    : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{lead.name}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
              {lead.city && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {lead.city}, {lead.province}
                </span>
              )}
              {lead.rating && (
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  {lead.rating.toFixed(1)} ({lead.reviews_count} reseñas)
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {lead.website && !lead.is_analyzed && (
            <button
              onClick={() => analyzeMutation.mutate(lead.id)}
              disabled={analyzeMutation.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className={clsx('w-4 h-4', analyzeMutation.isPending && 'animate-spin')} />
              Analizar
            </button>
          )}
          {!lead.is_exported_ghl && (
            <button
              onClick={() => exportMutation.mutate(lead.id)}
              disabled={exportMutation.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50"
            >
              <Upload className={clsx('w-4 h-4', exportMutation.isPending && 'animate-spin')} />
              Exportar a GHL
            </button>
          )}
          <button
            onClick={() => {
              if (confirm('¿Estás seguro de eliminar este lead?')) {
                deleteMutation.mutate(lead.id)
              }
            }}
            className="p-2 rounded-lg text-red-600 hover:bg-red-50"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact info */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Información de Contacto</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {lead.phone && (
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-gray-100">
                    <Phone className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Teléfono</p>
                    <a href={`tel:${lead.phone}`} className="font-medium text-gray-900 hover:text-primary-600">
                      {lead.phone}
                    </a>
                  </div>
                </div>
              )}

              {lead.email && (
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-gray-100">
                    <Mail className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <a href={`mailto:${lead.email}`} className="font-medium text-gray-900 hover:text-primary-600">
                      {lead.email}
                    </a>
                  </div>
                </div>
              )}

              {lead.website && (
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-gray-100">
                    <Globe className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Website</p>
                    <a
                      href={lead.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-gray-900 hover:text-primary-600 flex items-center gap-1"
                    >
                      {new URL(lead.website).hostname}
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              )}

              {lead.address && (
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-gray-100">
                    <MapPin className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Dirección</p>
                    <p className="font-medium text-gray-900">{lead.address}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Contact actions */}
            <div className="flex gap-2 mt-6 pt-4 border-t border-gray-200">
              {lead.phone && (
                <a
                  href={`tel:${lead.phone}`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200"
                >
                  <Phone className="w-4 h-4" />
                  Llamar
                </a>
              )}
              {whatsappLink && (
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-100 text-green-700 text-sm font-medium hover:bg-green-200"
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp
                </a>
              )}
              {lead.email && (
                <a
                  href={`mailto:${lead.email}`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-100 text-blue-700 text-sm font-medium hover:bg-blue-200"
                >
                  <Mail className="w-4 h-4" />
                  Email
                </a>
              )}
            </div>
          </div>

          {/* Tech Stack Analysis */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Análisis de Stack Tecnológico</h2>

            {lead.tech_stack ? (
              <TechStackBadges techStack={lead.tech_stack} />
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">Este lead aún no ha sido analizado</p>
                {lead.website && (
                  <button
                    onClick={() => analyzeMutation.mutate(lead.id)}
                    disabled={analyzeMutation.isPending}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
                  >
                    <RefreshCw className={clsx('w-4 h-4', analyzeMutation.isPending && 'animate-spin')} />
                    Analizar ahora
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Score */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Score de Oportunidad</h2>
            <div className="text-center mb-4">
              <span className="text-5xl font-bold text-gray-900">{lead.opportunity_score}</span>
              <span className="text-gray-500">/100</span>
            </div>
            <ScoreBar score={lead.opportunity_score} size="lg" />
          </div>

          {/* Status */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Estado</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Analizado</span>
                <span className={clsx(
                  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                  lead.is_analyzed ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                )}>
                  {lead.is_analyzed ? 'Sí' : 'No'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Exportado a GHL</span>
                <span className={clsx(
                  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                  lead.is_exported_ghl ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                )}>
                  {lead.is_exported_ghl ? 'Sí' : 'No'}
                </span>
              </div>
              {lead.ghl_contact_id && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">GHL Contact ID</span>
                  <span className="text-xs font-mono text-gray-500">{lead.ghl_contact_id}</span>
                </div>
              )}
            </div>
          </div>

          {/* Dates */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Fechas</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Creado</span>
                <span className="text-gray-900">
                  {format(new Date(lead.created_at), 'dd MMM yyyy', { locale: es })}
                </span>
              </div>
              {lead.analyzed_at && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Analizado</span>
                  <span className="text-gray-900">
                    {format(new Date(lead.analyzed_at), 'dd MMM yyyy', { locale: es })}
                  </span>
                </div>
              )}
              {lead.exported_at && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Exportado</span>
                  <span className="text-gray-900">
                    {format(new Date(lead.exported_at), 'dd MMM yyyy', { locale: es })}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* GMB info */}
          {lead.gmb_url && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Google Maps</h2>
              <a
                href={lead.gmb_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700"
              >
                Ver en Google Maps
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
