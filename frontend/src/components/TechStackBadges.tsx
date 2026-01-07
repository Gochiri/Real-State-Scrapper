import {
  Globe,
  Lock,
  MessageCircle,
  Phone,
  FileText,
  Facebook,
  Instagram,
  Linkedin,
  BarChart2,
  Tag,
  Target,
  BookOpen,
  X,
  Check
} from 'lucide-react'
import clsx from 'clsx'
import type { TechStack } from '../services/api'

interface TechStackBadgesProps {
  techStack: TechStack
  showMissing?: boolean
  compact?: boolean
}

const stackItems = [
  { key: 'has_website', label: 'Website', icon: Globe },
  { key: 'has_ssl', label: 'SSL', icon: Lock },
  { key: 'has_chat_widget', label: 'Chat', icon: MessageCircle },
  { key: 'has_whatsapp_button', label: 'WhatsApp', icon: Phone },
  { key: 'has_contact_form', label: 'Formulario', icon: FileText },
  { key: 'has_facebook', label: 'Facebook', icon: Facebook },
  { key: 'has_instagram', label: 'Instagram', icon: Instagram },
  { key: 'has_linkedin', label: 'LinkedIn', icon: Linkedin },
  { key: 'has_google_analytics', label: 'Analytics', icon: BarChart2 },
  { key: 'has_facebook_pixel', label: 'FB Pixel', icon: Tag },
  { key: 'has_crm_forms', label: 'CRM', icon: Target },
  { key: 'has_blog', label: 'Blog', icon: BookOpen },
] as const

export default function TechStackBadges({ techStack, showMissing = true, compact = false }: TechStackBadgesProps) {
  const items = stackItems.map(item => ({
    ...item,
    has: techStack[item.key as keyof TechStack] as boolean,
  }))

  const hasItems = items.filter(i => i.has)
  const missingItems = items.filter(i => !i.has)

  if (compact) {
    return (
      <div className="flex flex-wrap gap-1">
        {hasItems.map(item => (
          <span
            key={item.key}
            className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-green-100 text-green-700"
            title={item.label}
          >
            <item.icon className="w-3 h-3" />
          </span>
        ))}
        {showMissing && missingItems.slice(0, 3).map(item => (
          <span
            key={item.key}
            className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-red-100 text-red-700"
            title={`Sin ${item.label}`}
          >
            <item.icon className="w-3 h-3" />
          </span>
        ))}
        {showMissing && missingItems.length > 3 && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
            +{missingItems.length - 3}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {hasItems.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-gray-500 mb-2">Tiene:</h4>
          <div className="flex flex-wrap gap-2">
            {hasItems.map(item => (
              <span
                key={item.key}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700"
              >
                <Check className="w-3 h-3" />
                {item.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {showMissing && missingItems.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-gray-500 mb-2">No tiene (oportunidad):</h4>
          <div className="flex flex-wrap gap-2">
            {missingItems.map(item => (
              <span
                key={item.key}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700"
              >
                <X className="w-3 h-3" />
                {item.label}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
