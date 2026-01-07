from fastapi import APIRouter, Depends
from sqlalchemy import select, func, case
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.deps import get_db
from src.api.schemas import StatsResponse
from src.models import Lead

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("", response_model=StatsResponse)
async def get_stats(
    db: AsyncSession = Depends(get_db),
):
    """Get dashboard statistics"""

    # Total leads
    total_query = select(func.count(Lead.id))
    total_leads = await db.scalar(total_query) or 0

    # Analyzed leads
    analyzed_query = select(func.count(Lead.id)).where(Lead.is_analyzed == True)
    analyzed_leads = await db.scalar(analyzed_query) or 0

    # Exported leads
    exported_query = select(func.count(Lead.id)).where(Lead.is_exported_ghl == True)
    exported_leads = await db.scalar(exported_query) or 0

    # Average opportunity score
    avg_score_query = select(func.avg(Lead.opportunity_score))
    avg_score = await db.scalar(avg_score_query) or 0.0

    # Leads by city
    city_query = select(
        Lead.city,
        func.count(Lead.id).label("count")
    ).group_by(Lead.city).order_by(func.count(Lead.id).desc())
    city_result = await db.execute(city_query)
    leads_by_city = {row[0] or "Unknown": row[1] for row in city_result.fetchall()}

    # Leads by score range
    score_ranges_query = select(
        case(
            (Lead.opportunity_score >= 80, "80-100 (Hot)"),
            (Lead.opportunity_score >= 60, "60-79 (Warm)"),
            (Lead.opportunity_score >= 40, "40-59 (Medium)"),
            (Lead.opportunity_score >= 20, "20-39 (Cool)"),
            else_="0-19 (Cold)"
        ).label("score_range"),
        func.count(Lead.id).label("count")
    ).group_by("score_range")
    score_result = await db.execute(score_ranges_query)
    leads_by_score_range = {row[0]: row[1] for row in score_result.fetchall()}

    return StatsResponse(
        total_leads=total_leads,
        analyzed_leads=analyzed_leads,
        exported_leads=exported_leads,
        avg_opportunity_score=round(float(avg_score), 1),
        leads_by_city=leads_by_city,
        leads_by_score_range=leads_by_score_range,
    )


@router.get("/top-opportunities")
async def get_top_opportunities(
    limit: int = 10,
    db: AsyncSession = Depends(get_db),
):
    """Get top leads by opportunity score"""
    query = (
        select(Lead)
        .where(Lead.is_exported_ghl == False)
        .order_by(Lead.opportunity_score.desc())
        .limit(limit)
    )
    result = await db.execute(query)
    leads = result.scalars().all()

    return {
        "leads": [
            {
                "id": lead.id,
                "name": lead.name,
                "city": lead.city,
                "opportunity_score": lead.opportunity_score,
                "website": lead.website,
                "phone": lead.phone,
                "is_analyzed": lead.is_analyzed,
            }
            for lead in leads
        ]
    }
