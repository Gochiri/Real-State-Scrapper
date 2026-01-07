import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  Users,
  Search,
  Upload,
  TrendingUp,
  ArrowRight,
  MapPin
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Resumen de leads inmobiliarios</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Leads"
          value={stats?.total_leads || 0}
          icon={Users}
          color="bg-blue-500"
        />
        <StatCard
          title="Analizados"
          value={stats?.analyzed_leads || 0}
          icon={Search}
          color="bg-green-500"
        />
        <StatCard
          title="Exportados a GHL"
          value={stats?.exported_leads || 0}
          icon={Upload}
          color="bg-purple-500"
        />
        <StatCard
          title="Score Promedio"
          value={`${Math.round(stats?.avg_opportunity_score || 0)} pts`}
          icon={TrendingUp}
          color="bg-orange-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top opportunities */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Top Oportunidades</h2>
            <Link
              to="/leads?sort_by=opportunity_score&sort_order=desc"
              className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              Ver todos <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-3">
            {topLeads?.leads.map((lead) => (
              <Link
                key={lead.id}
                to={`/leads/${lead.id}`}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{lead.name}</p>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {lead.city || 'Sin ciudad'}
                  </p>
                </div>
                <ScoreBadge score={lead.opportunity_score || 0} />
              </Link>
            ))}

            {(!topLeads?.leads || topLeads.leads.length === 0) && (
              <p className="text-center text-gray-500 py-4">
                No hay leads aún. <Link to="/scraping" className="text-primary-600 hover:underline">Iniciar scraping</Link>
              </p>
            )}
          </div>
        </div>

        {/* Leads by city */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Leads por Ciudad</h2>

          <div className="space-y-3">
            {stats?.leads_by_city && Object.entries(stats.leads_by_city)
              .slice(0, 8)
              .map(([city, count]) => (
                <div key={city} className="flex items-center justify-between">
                  <span className="text-gray-600">{city}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-500 rounded-full"
                        style={{
                          width: `${(count / (stats?.total_leads || 1)) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-8 text-right">
                      {count}
                    </span>
                  </div>
                </div>
              ))}

            {(!stats?.leads_by_city || Object.keys(stats.leads_by_city).length === 0) && (
              <p className="text-center text-gray-500 py-4">Sin datos</p>
            )}
          </div>
        </div>

        {/* Score distribution */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Distribución por Score</h2>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { range: '80-100 (Hot)', color: 'bg-red-500', key: '80-100 (Hot)' },
              { range: '60-79 (Warm)', color: 'bg-orange-500', key: '60-79 (Warm)' },
              { range: '40-59 (Medium)', color: 'bg-yellow-500', key: '40-59 (Medium)' },
              { range: '20-39 (Cool)', color: 'bg-blue-500', key: '20-39 (Cool)' },
              { range: '0-19 (Cold)', color: 'bg-gray-400', key: '0-19 (Cold)' },
            ].map((item) => {
              const count = stats?.leads_by_score_range?.[item.key] || 0
              return (
                <div key={item.range} className="text-center p-4 rounded-lg bg-gray-50">
                  <div className={`w-12 h-12 rounded-full ${item.color} mx-auto mb-2 flex items-center justify-center text-white font-bold`}>
                    {count}
                  </div>
                  <p className="text-xs text-gray-600">{item.range}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string
  value: number | string
  icon: React.ElementType
  color: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  )
}
