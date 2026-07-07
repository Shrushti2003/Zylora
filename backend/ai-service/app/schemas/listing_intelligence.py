from pydantic import BaseModel, Field


class ListingIntentRequest(BaseModel):
    text: str = Field(min_length=3, max_length=2000)
    locale: str = "en-IN"


class ListingIntentResponse(BaseModel):
    category: str
    quantity: int | None
    location_hint: str | None
    intent: str
    confidence: float
    suggested_tags: list[str]

