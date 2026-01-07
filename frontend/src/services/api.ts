import axios from 'axios'

// En producción, usar la URL del backend desplegado
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Types
export interface TechStack {
  has_website: boolean
  has_ssl: boolean
  has_chat_widget: boolean
  chat_provider: string | null
  has_contact_form: boolean
  has_whatsapp_button: boolean
  has_facebook: boolean
  facebook_url: string | null
  has_instagram: boolean
  instagram_url: string | null
  has_linkedin: boolean
  linkedin_url: string | null
  has_google_analytics: boolean
  has_google_tag_manager: boolean
  has_facebook_pixel: boolean
  has_crm_forms: boolean
  crm_provider: string | null
  has_blog: boolean
}

export interface Lead {
  id: number
  name: string
  address: string | null
  city: string | null
  province: string | null
  phone: string | null
  website: string | null
  email: string | null
  whatsapp: string | null
  place_id: string | null
  gmb_url: string | null
  rating: number | null
  reviews_count: number | null
  photos_count: number | null
  opportunity_score: number
  is_analyzed: boolean
  is_exported_ghl: boolean
  ghl_contact_id: string | null
  created_at: string
  updated_at: string
  analyzed_at: string | null
  exported_at: string | null
  tech_stack: TechStack | null
}

export interface LeadListResponse {
  items: Lead[]
  total: number
  page: number
  page_size: number
  pages: number
}

export interface Stats {
  total_leads: number
  analyzed_leads: number
  exported_leads: number
  avg_opportunity_score: number
  leads_by_city: Record<string, number>
  leads_by_score_range: Record<string, number>
}

export interface ScrapingJob {
  id: number
  keyword: string
  city: string
  province: string | null
  status: string
  leads_found: number
  error_message: string | null
  created_at: string
  started_at: string | null
  completed_at: string | null
}

// API functions
export const leadsApi = {
  list: async (params: {
    page?: number
    page_size?: number
    city?: string
    min_score?: number
    max_score?: number
    is_analyzed?: boolean
    is_exported?: boolean
    search?: string
    sort_by?: string
    sort_order?: string
  }): Promise<LeadListResponse> => {
    const { data } = await api.get('/leads', { params })
    return data
  },

  get: async (id: number): Promise<Lead> => {
    const { data } = await api.get(`/leads/${id}`)
    return data
  },

  analyze: async (id: number): Promise<Lead> => {
    const { data } = await api.post(`/leads/${id}/analyze`)
    return data
  },

  analyzeBatch: async (ids: number[]): Promise<{ success: number; failed: number; errors: string[] }> => {
    const { data } = await api.post('/leads/analyze/batch', ids)
    return data
  },

  exportToGHL: async (params: {
    lead_ids: number[]
    workflow_id?: string
    tags?: string[]
  }): Promise<{ success: boolean; exported_count: number; failed_count: number; errors: string[] }> => {
    const { data } = await api.post('/leads/export/ghl', params)
    return data
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/leads/${id}`)
  },
}

export const scrapingApi = {
  start: async (params: {
    city: string
    keywords?: string[]
    limit_per_keyword?: number
  }): Promise<ScrapingJob> => {
    const { data } = await api.post('/scraping/start', params)
    return data
  },

  getJobs: async (): Promise<ScrapingJob[]> => {
    const { data } = await api.get('/scraping/jobs')
    return data
  },

  getJob: async (id: number): Promise<ScrapingJob> => {
    const { data } = await api.get(`/scraping/jobs/${id}`)
    return data
  },

  getCities: async (): Promise<{ cities: string[] }> => {
    const { data } = await api.get('/scraping/cities')
    return data
  },

  getKeywords: async (): Promise<{ keywords: string[] }> => {
    const { data } = await api.get('/scraping/keywords')
    return data
  },
}

export const statsApi = {
  get: async (): Promise<Stats> => {
    const { data } = await api.get('/stats')
    return data
  },

  getTopOpportunities: async (limit?: number): Promise<{ leads: Partial<Lead>[] }> => {
    const { data } = await api.get('/stats/top-opportunities', { params: { limit } })
    return data
  },
}

export default api
