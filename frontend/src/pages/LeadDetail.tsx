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
  MessageCircle,
  Calendar,
  Sparkles,
  Target,
  CheckCircle,
  XCircle
} from 'lucide-react'
import clsx from 'clsx'
import { leadsApi } from '../services/api'
import ScoreBar, { ScoreRing } from '../components/ScoreBar'
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
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-indigo-100 border-t-indigo-500 animate-spin" />
          <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-indigo-500" />
        </div>
      </div>
    )
  }

  if (!lead) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
          <XCircle className="w-10 h-10 text-slate-400" />
        </div>
        <p className="text-slate-500 mb-4">Lead no encontrado</p>
        <Link to="/leads" className="text-indigo-600 hover:underline font-medium">
          Volver a leads
        </Link>
      </div>
    )
  }

  const whatsappLink = lead.phone
    ? `https://wa.me/${lead.phone.replace(/\D/g, '')}?text=${encodeURIComponent('Hola, me gustaría consultarles sobre sus servicios inmobiliarios.')}`
    : null

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/30">
                {lead.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{lead.name}</h1>
                <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                  {lead.city && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {lead.city}, {lead.province}
                    </span>
                  )}
                  {lead.rating && (
                    <span className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                      {lead.rating.toFixed(1)} ({lead.reviews_count} reseñas)
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {lead.website && !lead.is_analyzed && (
            <button
              onClick={() => analyzeMutation.mutate(lead.id)}
              disabled={analyzeMutation.isPending}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-medium shadow-lg shadow-blue-500/30 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
            >
              <RefreshCw className={clsx('w-4 h-4', analyzeMutation.isPending && 'animate-spin')} />
              Analizar
            </button>
          )}
          {!lead.is_exported_ghl && (
            <button
              onClick={() => exportMutation.mutate(lead.id)}
              disabled={exportMutation.isPending}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-medium shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
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
            className="p-2.5 rounded-xl text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact info */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                  <Phone className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-900">Información de Contacto</h2>
                  <p className="text-xs text-slate-500">Datos extraídos de Google Maps</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {lead.phone && (
                  <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center">
                      <Phone className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500 mb-1">Teléfono</p>
                      <a href={`tel:${lead.phone}`} className="font-semibold text-slate-900 hover:text-indigo-600 transition-colors">
                        {lead.phone}
                      </a>
                    </div>
                  </div>
                )}

                {lead.email && (
                  <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center">
                      <Mail className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500 mb-1">Email</p>
                      <a href={`mailto:${lead.email}`} className="font-semibold text-slate-900 hover:text-indigo-600 transition-colors">
                        {lead.email}
                      </a>
                    </div>
                  </div>
                )}

                {lead.website && (
                  <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center">
                      <Globe className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500 mb-1">Website</p>
                      <a
                        href={lead.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-slate-900 hover:text-indigo-600 transition-colors flex items-center gap-1"
                      >
                        {new URL(lead.website).hostname}
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                )}

                {lead.address && (
                  <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500 mb-1">Dirección</p>
                      <p className="font-semibold text-slate-900">{lead.address}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Contact actions */}
              <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-slate-100">
                {lead.phone && (
                  <a
                    href={`tel:${lead.phone}`}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition-colors"
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
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-100 text-emerald-700 text-sm font-medium hover:bg-emerald-200 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp
                  </a>
                )}
                {lead.email && (
                  <a
                    href={`mailto:${lead.email}`}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-100 text-blue-700 text-sm font-medium hover:bg-blue-200 transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    Email
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Tech Stack Analysis */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-900">Análisis de Stack Tecnológico</h2>
                  <p className="text-xs text-slate-500">Oportunidades detectadas</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              {lead.tech_stack ? (
                <TechStackBadges techStack={lead.tech_stack} />
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
                    <RefreshCw className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="text-slate-500 mb-4">Este lead aún no ha sido analizado</p>
                  {lead.website && (
                    <button
                      onClick={() => analyzeMutation.mutate(lead.id)}
                      disabled={analyzeMutation.isPending}
                      className="btn-gradient px-5 py-2.5 rounded-xl inline-flex items-center gap-2"
                    >
                      <RefreshCw className={clsx('w-4 h-4', analyzeMutation.isPending && 'animate-spin')} />
                      Analizar ahora
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Score */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="font-semibold text-slate-900 mb-6">Score de Oportunidad</h2>
            <div className="flex justify-center mb-6">
              <ScoreRing score={lead.opportunity_score} size={120} />
            </div>
            <ScoreBar score={lead.opportunity_score} size="lg" />
          </div>

          {/* Status */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="font-semibold text-slate-900 mb-4">Estado</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 text-sm">Analizado</span>
                <span className={clsx(
                  'badge',
                  lead.is_analyzed ? 'badge-success' : 'bg-slate-100 text-slate-600'
                )}>
                  {lead.is_analyzed ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  {lead.is_analyzed ? 'Sí' : 'No'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 text-sm">Exportado a GHL</span>
                <span className={clsx(
                  'badge',
                  lead.is_exported_ghl ? 'badge-purple' : 'bg-slate-100 text-slate-600'
                )}>
                  {lead.is_exported_ghl ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  {lead.is_exported_ghl ? 'Sí' : 'No'}
                </span>
              </div>
              {lead.ghl_contact_id && (
                <div className="pt-3 border-t border-slate-100">
                  <p className="text-xs text-slate-500 mb-1">GHL Contact ID</p>
                  <p className="text-xs font-mono text-slate-600 bg-slate-50 px-2 py-1 rounded">{lead.ghl_contact_id}</p>
                </div>
              )}
            </div>
          </div>

          {/* Dates */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="font-semibold text-slate-900 mb-4">Fechas</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-slate-500" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Creado</p>
                  <p className="text-sm font-medium text-slate-700">
                    {format(new Date(lead.created_at), "dd MMM yyyy", { locale: es })}
                  </p>
                </div>
              </div>
              {lead.analyzed_at && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <RefreshCw className="w-4 h-4 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Analizado</p>
                    <p className="text-sm font-medium text-slate-700">
                      {format(new Date(lead.analyzed_at), "dd MMM yyyy", { locale: es })}
                    </p>
                  </div>
                </div>
              )}
              {lead.exported_at && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Upload className="w-4 h-4 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Exportado</p>
                    <p className="text-sm font-medium text-slate-700">
                      {format(new Date(lead.exported_at), "dd MMM yyyy", { locale: es })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* GMB info */}
          {lead.gmb_url && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h2 className="font-semibold text-slate-900 mb-4">Google Maps</h2>
              <a
                href={lead.gmb_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium"
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
