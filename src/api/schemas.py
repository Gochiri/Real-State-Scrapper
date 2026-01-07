from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


# Lead Schemas
class TechStackResponse(BaseModel):
    has_website: bool = False
    has_ssl: bool = False
    has_chat_widget: bool = False
    chat_provider: Optional[str] = None
    has_contact_form: bool = False
    has_whatsapp_button: bool = False
    has_facebook: bool = False
    facebook_url: Optional[str] = None
    has_instagram: bool = False
    instagram_url: Optional[str] = None
    has_linkedin: bool = False
    linkedin_url: Optional[str] = None
    has_google_analytics: bool = False
    has_google_tag_manager: bool = False
    has_facebook_pixel: bool = False
    has_crm_forms: bool = False
    crm_provider: Optional[str] = None
    has_blog: bool = False

    class Config:
        from_attributes = True


class LeadBase(BaseModel):
    name: str
    address: Optional[str] = None
    city: Optional[str] = None
    province: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    email: Optional[str] = None
    whatsapp: Optional[str] = None


class LeadCreate(LeadBase):
    place_id: Optional[str] = None
    gmb_url: Optional[str] = None
    rating: Optional[float] = None
    reviews_count: Optional[int] = None
    photos_count: Optional[int] = None


class LeadResponse(LeadBase):
    id: int
    place_id: Optional[str] = None
    gmb_url: Optional[str] = None
    rating: Optional[float] = None
    reviews_count: Optional[int] = None
    photos_count: Optional[int] = None
    opportunity_score: int = 100
    is_analyzed: bool = False
    is_exported_ghl: bool = False
    ghl_contact_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    analyzed_at: Optional[datetime] = None
    exported_at: Optional[datetime] = None
    tech_stack: Optional[TechStackResponse] = None

    class Config:
        from_attributes = True


class LeadListResponse(BaseModel):
    items: List[LeadResponse]
    total: int
    page: int
    page_size: int
    pages: int


# Scraping Schemas
class ScrapingRequest(BaseModel):
    city: str
    keywords: Optional[List[str]] = None
    limit_per_keyword: int = Field(default=20, ge=1, le=100)


class ScrapingJobResponse(BaseModel):
    id: int
    keyword: str
    city: str
    province: Optional[str] = None
    status: str
    leads_found: int
    error_message: Optional[str] = None
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Stats Schemas
class StatsResponse(BaseModel):
    total_leads: int
    analyzed_leads: int
    exported_leads: int
    avg_opportunity_score: float
    leads_by_city: dict
    leads_by_score_range: dict


# GHL Export Schemas
class GHLExportRequest(BaseModel):
    lead_ids: List[int]
    workflow_id: Optional[str] = None
    tags: Optional[List[str]] = None


class GHLExportResponse(BaseModel):
    success: bool
    exported_count: int
    failed_count: int
    errors: List[str] = []
