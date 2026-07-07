from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
def health_check() -> dict[str, str]:
    return {"service": "zylora-ai-service", "status": "healthy"}

