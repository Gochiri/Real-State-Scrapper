from typing import Optional, List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.api.deps import get_db
from src.api.schemas import (
    LeadResponse,
    LeadListResponse,
    LeadCreate,
    GHLExportRequest,
    GHLExportResponse,
)
from src.models import Lead, TechStack

router = APIRouter(prefix="/leads", tags=["leads"])


@router.get("", response_model=LeadListResponse)
async def list_leads(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    city: Optional[str] = None,
    province: Optional[str] = None,
    min_score: Optional[int] = Query(None, ge=0, le=100),
    max_score: Optional[int] = Query(None, ge=0, le=100),
    is_analyzed: Optional[bool] = None,
    is_exported: Optional[bool] = None,
    has_website: Optional[bool] = None,
    has_email: Optional[bool] = None,
    search: Optional[str] = None,
    sort_by: str = Query("opportunity_score", regex="^(opportunity_score|name|created_at|rating)$"),
    sort_order: str = Query("desc", regex="^(asc|desc)$"),
    db: AsyncSession = Depends(get_db),
):
    """List leads with filtering, sorting and pagination"""

    query = select(Lead).options(selectinload(Lead.tech_stack))

    # Filters
    if city:
        query = query.where(Lead.city == city)
    if province:
        query = query.where(Lead.province == province)
    if min_score is not None:
        query = query.where(Lead.opportunity_score >= min_score)
    if max_score is not None:
        query = query.where(Lead.opportunity_score <= max_score)
    if is_analyzed is not None:
        query = query.where(Lead.is_analyzed == is_analyzed)
    if is_exported is not None:
        query = query.where(Lead.is_exported_ghl == is_exported)
    if has_website is not None:
        if has_website:
            query = query.where(Lead.website.isnot(None))
        else:
            query = query.where(Lead.website.is_(None))
    if has_email is not None:
        if has_email:
            query = query.where(Lead.email.isnot(None))
        else:
            query = query.where(Lead.email.is_(None))
    if search:
        search_filter = f"%{search}%"
        query = query.where(
            or_(
                Lead.name.ilike(search_filter),
                Lead.address.ilike(search_filter),
                Lead.email.ilike(search_filter),
            )
        )

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query)

    # Sorting
    sort_column = getattr(Lead, sort_by)
    if sort_order == "desc":
        query = query.order_by(sort_column.desc())
    else:
        query = query.order_by(sort_column.asc())

    # Pagination
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)

    result = await db.execute(query)
    leads = result.scalars().all()

    return LeadListResponse(
        items=[LeadResponse.model_validate(lead) for lead in leads],
        total=total,
        page=page,
        page_size=page_size,
        pages=(total + page_size - 1) // page_size,
    )


@router.get("/{lead_id}", response_model=LeadResponse)
async def get_lead(
    lead_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Get a specific lead by ID"""
    query = select(Lead).where(Lead.id == lead_id).options(selectinload(Lead.tech_stack))
    result = await db.execute(query)
    lead = result.scalar_one_or_none()

    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    return LeadResponse.model_validate(lead)


@router.post("", response_model=LeadResponse)
async def create_lead(
    lead_data: LeadCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a new lead manually"""
    # Check for duplicate place_id
    if lead_data.place_id:
        existing = await db.execute(
            select(Lead).where(Lead.place_id == lead_data.place_id)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Lead with this place_id already exists")

    lead = Lead(**lead_data.model_dump())
    db.add(lead)
    await db.commit()
    await db.refresh(lead)

    return LeadResponse.model_validate(lead)


@router.delete("/{lead_id}")
async def delete_lead(
    lead_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Delete a lead"""
    query = select(Lead).where(Lead.id == lead_id)
    result = await db.execute(query)
    lead = result.scalar_one_or_none()

    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    await db.delete(lead)
    await db.commit()

    return {"message": "Lead deleted successfully"}


@router.post("/{lead_id}/analyze", response_model=LeadResponse)
async def analyze_lead(
    lead_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Trigger tech stack analysis for a lead"""
    from src.analyzers.tech_stack import TechStackAnalyzer

    query = select(Lead).where(Lead.id == lead_id).options(selectinload(Lead.tech_stack))
    result = await db.execute(query)
    lead = result.scalar_one_or_none()

    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    if not lead.website:
        raise HTTPException(status_code=400, detail="Lead has no website to analyze")

    analyzer = TechStackAnalyzer()
    analysis = await analyzer.analyze(lead.website)

    # Update or create tech_stack
    if lead.tech_stack:
        for key, value in analysis.items():
            if hasattr(lead.tech_stack, key):
                setattr(lead.tech_stack, key, value)
        lead.tech_stack.analyzed_at = datetime.utcnow()
    else:
        tech_stack = TechStack(lead_id=lead.id, **analysis)
        db.add(tech_stack)

    # Calculate and update score
    from src.analyzers.scoring import calculate_opportunity_score
    lead.opportunity_score = calculate_opportunity_score(analysis)
    lead.is_analyzed = True
    lead.analyzed_at = datetime.utcnow()

    await db.commit()
    await db.refresh(lead)

    return LeadResponse.model_validate(lead)


@router.post("/analyze/batch")
async def analyze_leads_batch(
    lead_ids: List[int],
    db: AsyncSession = Depends(get_db),
):
    """Analyze multiple leads"""
    from src.analyzers.tech_stack import TechStackAnalyzer
    from src.analyzers.scoring import calculate_opportunity_score

    analyzer = TechStackAnalyzer()
    results = {"success": 0, "failed": 0, "errors": []}

    for lead_id in lead_ids:
        try:
            query = select(Lead).where(Lead.id == lead_id).options(selectinload(Lead.tech_stack))
            result = await db.execute(query)
            lead = result.scalar_one_or_none()

            if not lead:
                results["failed"] += 1
                results["errors"].append(f"Lead {lead_id} not found")
                continue

            if not lead.website:
                results["failed"] += 1
                results["errors"].append(f"Lead {lead_id} has no website")
                continue

            analysis = await analyzer.analyze(lead.website)

            if lead.tech_stack:
                for key, value in analysis.items():
                    if hasattr(lead.tech_stack, key):
                        setattr(lead.tech_stack, key, value)
                lead.tech_stack.analyzed_at = datetime.utcnow()
            else:
                tech_stack = TechStack(lead_id=lead.id, **analysis)
                db.add(tech_stack)

            lead.opportunity_score = calculate_opportunity_score(analysis)
            lead.is_analyzed = True
            lead.analyzed_at = datetime.utcnow()

            results["success"] += 1

        except Exception as e:
            results["failed"] += 1
            results["errors"].append(f"Lead {lead_id}: {str(e)}")

    await db.commit()
    return results


@router.post("/export/ghl", response_model=GHLExportResponse)
async def export_to_ghl(
    request: GHLExportRequest,
    db: AsyncSession = Depends(get_db),
):
    """Export selected leads to Go High Level"""
    from src.integrations.gohighlevel import GoHighLevelClient

    ghl_client = GoHighLevelClient()
    results = GHLExportResponse(success=True, exported_count=0, failed_count=0, errors=[])

    for lead_id in request.lead_ids:
        try:
            query = select(Lead).where(Lead.id == lead_id).options(selectinload(Lead.tech_stack))
            result = await db.execute(query)
            lead = result.scalar_one_or_none()

            if not lead:
                results.failed_count += 1
                results.errors.append(f"Lead {lead_id} not found")
                continue

            # Generate tags based on gaps
            tags = request.tags or []
            if lead.tech_stack:
                gap_tags = ghl_client.generate_gap_tags(lead.tech_stack)
                tags.extend(gap_tags)

            # Create contact in GHL
            contact_id = await ghl_client.create_contact(
                lead=lead,
                tags=tags,
                workflow_id=request.workflow_id,
            )

            if contact_id:
                lead.is_exported_ghl = True
                lead.ghl_contact_id = contact_id
                lead.exported_at = datetime.utcnow()
                results.exported_count += 1
            else:
                results.failed_count += 1
                results.errors.append(f"Failed to export lead {lead_id}")

        except Exception as e:
            results.failed_count += 1
            results.errors.append(f"Lead {lead_id}: {str(e)}")

    await db.commit()
    results.success = results.failed_count == 0
    return results
