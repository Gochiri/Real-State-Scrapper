import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Search,
  Building2
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
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-200">
          <Building2 className="w-8 h-8 text-primary-600" />
          <div>
            <h1 className="font-bold text-gray-900">Leads Inmobiliarios</h1>
            <p className="text-xs text-gray-500">Argentina</p>
          </div>
        </div>

        <nav className="px-3 py-4">
          <ul className="space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className={clsx(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      </aside>

      {/* Main content */}
      <main className="pl-64">
        <div className="px-8 py-6">
          {children}
        </div>
      </main>
    </div>
  )
}
