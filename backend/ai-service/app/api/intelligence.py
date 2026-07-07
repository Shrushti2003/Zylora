from fastapi import APIRouter

from app.schemas.listing_intelligence import ListingIntentRequest, ListingIntentResponse
from app.services.listing_intelligence_service import ListingIntelligenceService

router = APIRouter()
service = ListingIntelligenceService()


@router.post("/listing-intent", response_model=ListingIntentResponse)
def extract_listing_intent(payload: ListingIntentRequest) -> ListingIntentResponse:
    return service.extract_listing_intent(payload)

