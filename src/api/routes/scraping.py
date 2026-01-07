from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.deps import get_db
from src.api.schemas import ScrapingRequest, ScrapingJobResponse
from src.models import Lead, ScrapingJob
from src.scrapers import SerpApiMapsScraper, get_available_cities, REAL_ESTATE_KEYWORDS

router = APIRouter(prefix="/scraping", tags=["scraping"])


async def run_scraping_job(
    job_id: int,
    city: str,
    keywords: List[str],
    limit_per_keyword: int,
    db_url: str,
):
    """Background task to run scraping"""
    from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

    engine = create_async_engine(db_url)
    AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with AsyncSessionLocal() as db:
        try:
            # Update job status to running
            job = await db.get(ScrapingJob, job_id)
            if not job:
                return

            job.status = "running"
            job.started_at = datetime.utcnow()
            await db.commit()

            # Run scraper
            scraper = SerpApiMapsScraper()
            leads_count = 0

            for keyword in keywords:
                try:
                    results = await scraper.search(keyword, city, limit=limit_per_keyword)

                    for result in results:
                        # Check if lead already exists
                        place_id = result.get("place_id")
                        if place_id:
                            existing = await db.execute(
                                select(Lead).where(Lead.place_id == place_id)
                            )
                            if existing.scalar_one_or_none():
                                continue

                        # Create new lead
                        lead = Lead(
                            name=result.get("name", ""),
                            address=result.get("address"),
                            city=result.get("city", city),
                            province=result.get("province"),
                            phone=result.get("phone"),
                            website=result.get("website"),
                            gmb_url=result.get("gmb_url"),
                            place_id=result.get("place_id"),
                            rating=result.get("rating"),
                            reviews_count=result.get("reviews_count"),
                            photos_count=result.get("photos_count"),
                        )
                        db.add(lead)
                        leads_count += 1

                    job.keyword = keyword  # Track last keyword processed
                    await db.commit()

                except Exception as e:
                    print(f"Error scraping keyword '{keyword}': {e}")
                    continue

            # Update job as completed
            job.status = "completed"
            job.leads_found = leads_count
            job.completed_at = datetime.utcnow()
            await db.commit()

        except Exception as e:
            job = await db.get(ScrapingJob, job_id)
            if job:
                job.status = "failed"
                job.error_message = str(e)
                job.completed_at = datetime.utcnow()
                await db.commit()


@router.post("/start", response_model=ScrapingJobResponse)
async def start_scraping(
    request: ScrapingRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """Start a new scraping job for a city"""
    from src.config import get_settings

    settings = get_settings()

    # Validate city
    available_cities = get_available_cities()
    if request.city not in available_cities:
        raise HTTPException(
            status_code=400,
            detail=f"City '{request.city}' not available. Available cities: {available_cities}"
        )

    keywords = request.keywords or REAL_ESTATE_KEYWORDS

    # Create scraping job record
    job = ScrapingJob(
        keyword=keywords[0],  # Will be updated as we process
        city=request.city,
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)

    # Start background task
    background_tasks.add_task(
        run_scraping_job,
        job.id,
        request.city,
        keywords,
        request.limit_per_keyword,
        settings.database_url,
    )

    return ScrapingJobResponse.model_validate(job)


@router.get("/jobs", response_model=List[ScrapingJobResponse])
async def list_scraping_jobs(
    db: AsyncSession = Depends(get_db),
):
    """List all scraping jobs"""
    query = select(ScrapingJob).order_by(ScrapingJob.created_at.desc())
    result = await db.execute(query)
    jobs = result.scalars().all()
    return [ScrapingJobResponse.model_validate(job) for job in jobs]


@router.get("/jobs/{job_id}", response_model=ScrapingJobResponse)
async def get_scraping_job(
    job_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Get scraping job status"""
    job = await db.get(ScrapingJob, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Scraping job not found")
    return ScrapingJobResponse.model_validate(job)


@router.get("/cities")
async def list_available_cities():
    """List available Argentine cities for scraping"""
    return {"cities": get_available_cities()}


@router.get("/keywords")
async def list_keywords():
    """List default real estate keywords"""
    return {"keywords": REAL_ESTATE_KEYWORDS}
