from fastapi import FastAPI

from app.api.health import router as health_router
from app.api.intelligence import router as intelligence_router
from app.core.settings import settings

app = FastAPI(
    title=settings.service_name,
    version=settings.service_version,
    description="AI service boundary for Zylora listing intelligence, matching, vision, recommendations, and analytics.",
)

app.include_router(health_router)
app.include_router(intelligence_router, prefix="/v1/intelligence", tags=["intelligence"])

