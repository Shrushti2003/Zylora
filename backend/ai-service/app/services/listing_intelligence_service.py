import re

from app.schemas.listing_intelligence import ListingIntentRequest, ListingIntentResponse


class ListingIntelligenceService:
    category_keywords = {
        "books": ["book", "books", "textbook", "library"],
        "furniture": ["desk", "table", "chair", "sofa", "furniture"],
        "food": ["food", "meal", "ration", "grocery", "vegetable"],
        "electronics": ["laptop", "phone", "monitor", "printer", "electronics"],
        "clothes": ["clothes", "shirt", "saree", "jacket", "uniform"],
        "medical_supplies": ["medicine", "wheelchair", "medical", "first aid"],
    }

    def extract_listing_intent(self, payload: ListingIntentRequest) -> ListingIntentResponse:
        text = payload.text.lower()
        category = self._detect_category(text)
        quantity = self._detect_quantity(text)
        location_hint = self._detect_location(payload.text)
        intent = "donate" if "donate" in text or "give" in text else "request" if "need" in text else "list"

        return ListingIntentResponse(
            category=category,
            quantity=quantity,
            location_hint=location_hint,
            intent=intent,
            confidence=0.72 if category != "miscellaneous" else 0.48,
            suggested_tags=[category, intent, "hyperlocal"],
        )

    def _detect_category(self, text: str) -> str:
        for category, keywords in self.category_keywords.items():
            if any(keyword in text for keyword in keywords):
                return category
        return "miscellaneous"

    def _detect_quantity(self, text: str) -> int | None:
        match = re.search(r"\b(\d{1,5})\b", text)
        return int(match.group(1)) if match else None

    def _detect_location(self, text: str) -> str | None:
        match = re.search(r"\bnear\s+([A-Za-z\s]{2,40})", text)
        return match.group(1).strip() if match else None

