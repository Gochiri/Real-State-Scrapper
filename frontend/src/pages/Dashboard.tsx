import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  Users,
  Search,
  Upload,
  TrendingUp,
  ArrowRight,
  MapPin,
  Sparkles,
  Target,
  Zap
} from 'lucide-react'
import { statsApi } from '../services/api'
import { ScoreBadge } from '../components/ScoreBar'

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: statsApi.get,
  })

  const { data: topLeads } = useQuery({
    queryKey: ['top-opportunities'],
    queryFn: () => statsApi.getTopOpportunities(5),
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

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">Resumen de leads inmobiliarios en Argentina</p>
        </div>
        <Link
          to="/scraping"
          className="btn-gradient px-5 py-2.5 rounded-xl inline-flex items-center gap-2"
        >
          <Zap className="w-4 h-4" />
          Nuevo Scraping
        </Link>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Leads"
          value={stats?.total_leads || 0}
          icon={Users}
          gradient="from-blue-500 to-cyan-500"
          shadowColor="shadow-blue-500/20"
        />
        <StatCard
          title="Analizados"
          value={stats?.analyzed_leads || 0}
          icon={Search}
          gradient="from-emerald-500 to-teal-500"
          shadowColor="shadow-emerald-500/20"
        />
        <StatCard
          title="Exportados"
          value={stats?.exported_leads || 0}
          icon={Upload}
          gradient="from-purple-500 to-pink-500"
          shadowColor="shadow-purple-500/20"
        />
        <StatCard
          title="Score Promedio"
          value={`${Math.round(stats?.avg_opportunity_score || 0)}`}
          suffix="pts"
          icon={TrendingUp}
          gradient="from-orange-500 to-rose-500"
          shadowColor="shadow-orange-500/20"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top opportunities */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center shadow-lg shadow-rose-500/30">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-900">Top Oportunidades</h2>
                  <p className="text-xs text-slate-500">Leads con mayor potencial</p>
                </div>
              </div>
              <Link
                to="/leads?sort_by=opportunity_score&sort_order=desc"
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 group"
              >
                Ver todos
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>

          <div className="divide-y divide-slate-50">
            {topLeads?.leads.map((lead, index) => (
              <Link
                key={lead.id}
                to={`/leads/${lead.id}`}
                className="flex items-center gap-4 p-4 hover:bg-slate-50/80 transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                    {lead.name}
                  </p>
                  <p className="text-sm text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {lead.city || 'Sin ciudad'}
                  </p>
                </div>
                <ScoreBadge score={lead.opportunity_score || 0} size="sm" />
              </Link>
            ))}

            {(!topLeads?.leads || topLeads.leads.length === 0) && (
              <div className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
                  <Users className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-500 mb-2">No hay leads aún</p>
                <Link to="/scraping" className="text-indigo-600 hover:underline font-medium">
                  Iniciar scraping
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Leads by city */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-900">Leads por Ciudad</h2>
                <p className="text-xs text-slate-500">Distribución geográfica</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {stats?.leads_by_city && Object.entries(stats.leads_by_city)
              .slice(0, 6)
              .map(([city, count], index) => {
                const percentage = ((count / (stats?.total_leads || 1)) * 100).toFixed(0)
                const colors = [
                  'from-indigo-500 to-purple-500',
                  'from-cyan-500 to-blue-500',
                  'from-emerald-500 to-teal-500',
                  'from-orange-500 to-rose-500',
                  'from-pink-500 to-purple-500',
                  'from-yellow-500 to-orange-500',
                ]
                return (
                  <div key={city} className="group">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-700">{city}</span>
                      <span className="text-sm text-slate-500">
                        {count} <span className="text-slate-400">({percentage}%)</span>
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${colors[index % colors.length]} transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}

            {(!stats?.leads_by_city || Object.keys(stats.leads_by_city).length === 0) && (
              <p className="text-center text-slate-500 py-8">Sin datos disponibles</p>
            )}
          </div>
        </div>
      </div>

      {/* Score distribution */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">Distribución por Score</h2>
            <p className="text-xs text-slate-500">Clasificación de oportunidades</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { range: '80-100', label: 'Hot', gradient: 'from-rose-500 to-orange-500', shadow: 'shadow-rose-500/30', emoji: '🔥', key: '80-100 (Hot)' },
            { range: '60-79', label: 'Warm', gradient: 'from-orange-400 to-amber-400', shadow: 'shadow-orange-400/30', emoji: '⚡', key: '60-79 (Warm)' },
            { range: '40-59', label: 'Medium', gradient: 'from-yellow-400 to-lime-400', shadow: 'shadow-yellow-400/30', emoji: '📊', key: '40-59 (Medium)' },
            { range: '20-39', label: 'Cool', gradient: 'from-cyan-400 to-blue-400', shadow: 'shadow-cyan-400/30', emoji: '❄️', key: '20-39 (Cool)' },
            { range: '0-19', label: 'Cold', gradient: 'from-slate-400 to-slate-500', shadow: 'shadow-slate-400/30', emoji: '✅', key: '0-19 (Cold)' },
          ].map((item) => {
            const count = stats?.leads_by_score_range?.[item.key] || 0
            return (
              <div
                key={item.range}
                className="relative group p-5 rounded-2xl bg-slate-50 hover:bg-white hover:shadow-lg transition-all duration-300 cursor-default"
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.gradient} ${item.shadow} shadow-lg flex items-center justify-center text-white font-bold text-xl mb-3 group-hover:scale-110 transition-transform`}>
                  {count}
                </div>
                <p className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                  <span>{item.emoji}</span>
                  {item.label}
                </p>
                <p className="text-xs text-slate-400">{item.range} pts</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  suffix,
  icon: Icon,
  gradient,
  shadowColor,
}: {
  title: string
  value: number | string
  suffix?: string
  icon: React.ElementType
  gradient: string
  shadowColor: string
}) {
  return (
    <div className="stat-card group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          <p className="text-3xl font-bold text-slate-900">
            {value}
            {suffix && <span className="text-lg text-slate-400 ml-1">{suffix}</span>}
          </p>
        </div>
        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} ${shadowColor} shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  )
}
