from datetime import datetime
from typing import Optional
from sqlalchemy import String, Text, Integer, Float, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.database import Base


class Lead(Base):
    __tablename__ = "leads"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    # Basic Info from Google Maps
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    address: Mapped[Optional[str]] = mapped_column(String(500))
    city: Mapped[Optional[str]] = mapped_column(String(100))
    province: Mapped[Optional[str]] = mapped_column(String(100))
    phone: Mapped[Optional[str]] = mapped_column(String(50))
    website: Mapped[Optional[str]] = mapped_column(String(500))
    gmb_url: Mapped[Optional[str]] = mapped_column(String(500))
    place_id: Mapped[Optional[str]] = mapped_column(String(100), unique=True)

    # GMB Metrics
    rating: Mapped[Optional[float]] = mapped_column(Float)
    reviews_count: Mapped[Optional[int]] = mapped_column(Integer)
    photos_count: Mapped[Optional[int]] = mapped_column(Integer)

    # Extracted Contact Info
    email: Mapped[Optional[str]] = mapped_column(String(255))
    whatsapp: Mapped[Optional[str]] = mapped_column(String(50))

    # Status
    opportunity_score: Mapped[int] = mapped_column(Integer, default=100)
    is_analyzed: Mapped[bool] = mapped_column(Boolean, default=False)
    is_exported_ghl: Mapped[bool] = mapped_column(Boolean, default=False)
    ghl_contact_id: Mapped[Optional[str]] = mapped_column(String(100))

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    analyzed_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    exported_at: Mapped[Optional[datetime]] = mapped_column(DateTime)

    # Relationships
    tech_stack: Mapped["TechStack"] = relationship(back_populates="lead", uselist=False, cascade="all, delete-orphan")


class TechStack(Base):
    __tablename__ = "tech_stacks"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    lead_id: Mapped[int] = mapped_column(ForeignKey("leads.id", ondelete="CASCADE"), unique=True)

    # Website Analysis
    has_website: Mapped[bool] = mapped_column(Boolean, default=False)
    has_ssl: Mapped[bool] = mapped_column(Boolean, default=False)
    has_chat_widget: Mapped[bool] = mapped_column(Boolean, default=False)
    chat_provider: Mapped[Optional[str]] = mapped_column(String(50))  # Tidio, Drift, etc.
    has_contact_form: Mapped[bool] = mapped_column(Boolean, default=False)
    has_whatsapp_button: Mapped[bool] = mapped_column(Boolean, default=False)

    # Social Media
    has_facebook: Mapped[bool] = mapped_column(Boolean, default=False)
    facebook_url: Mapped[Optional[str]] = mapped_column(String(500))
    has_instagram: Mapped[bool] = mapped_column(Boolean, default=False)
    instagram_url: Mapped[Optional[str]] = mapped_column(String(500))
    has_linkedin: Mapped[bool] = mapped_column(Boolean, default=False)
    linkedin_url: Mapped[Optional[str]] = mapped_column(String(500))

    # Analytics & Tracking
    has_google_analytics: Mapped[bool] = mapped_column(Boolean, default=False)
    has_google_tag_manager: Mapped[bool] = mapped_column(Boolean, default=False)
    has_facebook_pixel: Mapped[bool] = mapped_column(Boolean, default=False)

    # CRM & Portals
    has_crm_forms: Mapped[bool] = mapped_column(Boolean, default=False)
    crm_provider: Mapped[Optional[str]] = mapped_column(String(50))
    has_blog: Mapped[bool] = mapped_column(Boolean, default=False)

    # Raw detection data
    detection_details: Mapped[Optional[dict]] = mapped_column(JSON)

    # Timestamps
    analyzed_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    lead: Mapped["Lead"] = relationship(back_populates="tech_stack")


class ScrapingJob(Base):
    __tablename__ = "scraping_jobs"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    # Search params
    keyword: Mapped[str] = mapped_column(String(100))
    city: Mapped[str] = mapped_column(String(100))
    province: Mapped[Optional[str]] = mapped_column(String(100))

    # Status
    status: Mapped[str] = mapped_column(String(20), default="pending")  # pending, running, completed, failed
    leads_found: Mapped[int] = mapped_column(Integer, default=0)
    error_message: Mapped[Optional[str]] = mapped_column(Text)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
