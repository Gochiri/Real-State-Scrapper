import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Search,
  Building2,
  Sparkles
} from 'lucide-react'
import clsx from 'clsx'

interface LayoutProps {
  children: React.ReactNode
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Leads', href: '/leads', icon: Users },
  { name: 'Scraping', href: '/scraping', icon: Search },
]

export default function Layout({ children }: LayoutProps) {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-72 bg-white/70 backdrop-blur-xl border-r border-slate-200/50 z-50">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-6">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full flex items-center justify-center">
              <Sparkles className="w-2.5 h-2.5 text-white" />
            </div>
          </div>
          <div>
            <h1 className="font-bold text-slate-900 text-lg">LeadsFinder</h1>
            <p className="text-xs text-slate-500 font-medium">Argentina Real Estate</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="px-4 py-4">
          <p className="px-3 mb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Menu</p>
          <ul className="space-y-1.5">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className={clsx(
                      'group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/30'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    )}
                  >
                    <item.icon className={clsx(
                      'w-5 h-5 transition-transform duration-200',
                      !isActive && 'group-hover:scale-110'
                    )} />
                    {item.name}
                    {isActive && (
                      <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse" />
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Bottom card */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-sm">Pro Tips</p>
                <p className="text-xs text-indigo-200">Maximiza tus leads</p>
              </div>
            </div>
            <p className="text-xs text-indigo-100 leading-relaxed">
              Analiza leads con score alto para encontrar las mejores oportunidades de venta.
            </p>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="pl-72">
        <div className="px-8 py-8 max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  )
}
