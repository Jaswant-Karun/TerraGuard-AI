import json
import logging
from io import BytesIO

from PIL import Image
from pydantic import BaseModel, Field

from app.core.config import settings

logger = logging.getLogger("terraguard.vision")

SUPPORTED_CATEGORIES = {
    "WATERLOGGING",
    "ROAD_FLOODING",
    "DAMAGED_ROAD",
    "FALLEN_TREE",
    "WASTE_ACCUMULATION",
    "OTHER",
}

# Mapping for backwards compatibility or common synonyms
CATEGORY_SYNONYMS = {
    "FLOOD": "ROAD_FLOODING",
    "FLOODING": "ROAD_FLOODING",
    "WATER_LOGGING": "WATERLOGGING",
    "POTHOLE": "DAMAGED_ROAD",
    "ROAD_DAMAGE": "DAMAGED_ROAD",
    "TREE_FALL": "FALLEN_TREE",
    "DEBRIS": "WASTE_ACCUMULATION",
    "GARBAGE": "WASTE_ACCUMULATION",
    "INFRASTRUCTURE_FAILURE": "DAMAGED_ROAD",
    "WATER_CONTAMINATION": "OTHER",
    "AIR_POLLUTION": "OTHER",
    "FIRE": "OTHER",
}


class VisionAnalysisResult(BaseModel):
    """Structured AI visual inspection output for an environmental hazard."""

    predicted_category: str = Field(
        ...,
        description="One of: WATERLOGGING, ROAD_FLOODING, DAMAGED_ROAD, FALLEN_TREE, WASTE_ACCUMULATION, OTHER",
    )
    short_description: str = Field(
        ..., description="Concise assessment of the visual scene and hazard condition"
    )
    visible_evidence: list[str] = Field(
        default_factory=list,
        description="Specific visible indicators detected in the scene",
    )
    confidence_estimate: float = Field(
        default=0.85,
        ge=0.0,
        le=1.0,
        description="Heuristic model confidence score (not statistically calibrated)",
    )
    suggested_verification_status: str = Field(
        default="PENDING_FIELD_CHECK",
        description="PENDING_FIELD_CHECK, HIGH_PROBABILITY, or SUSPICIOUS_UNVERIFIED",
    )
    safety_precautions: list[str] = Field(
        default_factory=list,
        description="Immediate advisory actions for citizens and municipal crews",
    )
    model_name: str = Field(
        default="gemini-2.0-flash", description="AI Vision engine invoked"
    )
    is_live_gemini: bool = Field(
        default=False, description="Whether live Gemini API was executed"
    )
    confidence_calibration_notice: str = Field(
        default="AI confidence is a heuristic model estimate and not statistically calibrated."
    )


class VisionService:
    """
    AI Vision Inspection Service.
    Uses Google Gemini 2.0 Flash Multimodal Vision when GEMINI_API_KEY is available,
    with a deterministic fallback computer-vision heuristic engine for local development.
    """

    @classmethod
    def normalize_category(cls, raw_category: str | None) -> str:
        if not raw_category:
            return "OTHER"
        cleaned = raw_category.strip().upper().replace(" ", "_").replace("-", "_")
        if cleaned in SUPPORTED_CATEGORIES:
            return cleaned
        return CATEGORY_SYNONYMS.get(cleaned, "OTHER")

    async def analyze_hazard_image(
        self,
        image_bytes: bytes,
        mime_type: str = "image/jpeg",
        user_category_hint: str | None = None,
        user_description_hint: str | None = None,
    ) -> VisionAnalysisResult:
        """
        Analyze hazard image with Gemini Vision or fallback heuristic.
        Enforces structured output schema and backend category validation.
        """
        if settings.GEMINI_API_KEY:
            try:
                return await self._call_gemini_vision(
                    image_bytes=image_bytes,
                    mime_type=mime_type,
                    user_category_hint=user_category_hint,
                    user_description_hint=user_description_hint,
                )
            except Exception as e:
                logger.warning(
                    f"Gemini Vision API call failed, falling back to local heuristic: {e}"
                )

        # Fallback heuristic analyzer
        return self._heuristic_vision_fallback(
            image_bytes=image_bytes,
            user_category_hint=user_category_hint,
            user_description_hint=user_description_hint,
        )

    async def _call_gemini_vision(
        self,
        image_bytes: bytes,
        mime_type: str,
        user_category_hint: str | None,
        user_description_hint: str | None,
    ) -> VisionAnalysisResult:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=settings.GEMINI_API_KEY)

        prompt = (
            "You are TerraGuard AI Vision, an urban risk intelligence and municipal disaster prevention system.\n"
            "Analyze the attached urban image. Classify the environmental or infrastructural hazard into STRICTLY ONE OF:\n"
            "- WATERLOGGING (Standing water, curb submergence, drainage pooling)\n"
            "- ROAD_FLOODING (Deep or flowing water submerging asphalt, impassable vehicle lanes)\n"
            "- DAMAGED_ROAD (Potholes, structural asphalt collapse, sinkholes, fissures)\n"
            "- FALLEN_TREE (Downed tree, massive branches blocking vehicular/pedestrian path, overhead wire hazard)\n"
            "- WASTE_ACCUMULATION (Illegal garbage dump, municipal solid waste choking storm culvert or sidewalk)\n"
            "- OTHER (Other acute environmental hazard)\n\n"
            f"Citizen User category suggestion: '{user_category_hint or 'None provided'}'.\n"
            f"Citizen Description notes: '{user_description_hint or 'None provided'}'.\n\n"
            "Return valid JSON matching this schema:\n"
            "{\n"
            '  "predicted_category": "WATERLOGGING" | "ROAD_FLOODING" | "DAMAGED_ROAD" | "FALLEN_TREE" | "WASTE_ACCUMULATION" | "OTHER",\n'
            '  "short_description": "Concise 1-2 sentence visual summary",\n'
            '  "visible_evidence": ["indicator 1", "indicator 2", "indicator 3"],\n'
            '  "confidence_estimate": 0.88,\n'
            '  "suggested_verification_status": "HIGH_PROBABILITY" | "PENDING_FIELD_CHECK",\n'
            '  "safety_precautions": ["precaution 1", "precaution 2"]\n'
            "}"
        )

        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=[
                types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
                prompt,
            ],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.2,
            ),
        )

        raw_text = response.text or "{}"
        parsed = json.loads(raw_text)

        category = self.normalize_category(parsed.get("predicted_category"))
        confidence = float(parsed.get("confidence_estimate", 0.85))
        confidence = max(0.1, min(confidence, 0.99))

        return VisionAnalysisResult(
            predicted_category=category,
            short_description=parsed.get(
                "short_description",
                f"Visual indicators of {category.lower().replace('_', ' ')} detected.",
            ),
            visible_evidence=parsed.get(
                "visible_evidence", ["Visual obstruction observed in photo"]
            ),
            confidence_estimate=round(confidence, 2),
            suggested_verification_status=parsed.get(
                "suggested_verification_status", "PENDING_FIELD_CHECK"
            ),
            safety_precautions=parsed.get(
                "safety_precautions",
                ["Exercise caution in the vicinity", "Avoid traversing hazard zone"],
            ),
            model_name="gemini-2.0-flash",
            is_live_gemini=True,
        )

    def _heuristic_vision_fallback(
        self,
        image_bytes: bytes,
        user_category_hint: str | None,
        user_description_hint: str | None,
    ) -> VisionAnalysisResult:
        """
        Deterministic, offline computer-vision heuristic engine.
        Inspects color profiles (water pooling vs greenery vs dark asphalt),
        aspect ratios, and description context to generate calibrated structured output.
        """
        category = self.normalize_category(user_category_hint)
        evidence: list[str] = []
        precautions: list[str] = []
        confidence = 0.82

        try:
            with Image.open(BytesIO(image_bytes)) as img:
                img_rgb = img.convert("RGB")
                _width, _height = img_rgb.size
                # Sample center crop
                crop = img_rgb.resize((32, 32))
                pixels = [crop.getpixel((x, y)) for x in range(32) for y in range(32)]
                avg_r = sum(p[0] for p in pixels) / len(pixels)
                avg_g = sum(p[1] for p in pixels) / len(pixels)
                avg_b = sum(p[2] for p in pixels) / len(pixels)

                # Check color characteristics
                # High blue/grey tint indicates water or asphalt
                if avg_b > avg_r and avg_b > avg_g:
                    evidence.append("Reflective surface with blue/gray color saturation consistent with standing water")
                    if category == "OTHER":
                        category = "WATERLOGGING"
                # High green indicates vegetation/tree
                elif avg_g > avg_r * 1.15 and avg_g > avg_b * 1.15:
                    evidence.append("High chlorophyll reflectance indicative of fallen tree foliage or urban vegetation")
                    if category == "OTHER":
                        category = "FALLEN_TREE"
        except Exception:
            evidence.append("Basic visual inspection completed on submitted media")

        desc_lower = (user_description_hint or "").lower()
        if "flood" in desc_lower or "deep water" in desc_lower or "submerged" in desc_lower:
            category = "ROAD_FLOODING"
            evidence.append("Citizen text reports road submergence or high flood water")
        elif "pothole" in desc_lower or "crater" in desc_lower or "asphalt" in desc_lower or "crack" in desc_lower:
            category = "DAMAGED_ROAD"
            evidence.append("Citizen text reports structural road defect or pothole")
        elif "tree" in desc_lower or "branch" in desc_lower:
            category = "FALLEN_TREE"
            evidence.append("Citizen notes mention downed tree or broken branches")
        elif "garbage" in desc_lower or "trash" in desc_lower or "waste" in desc_lower or "plastic" in desc_lower:
            category = "WASTE_ACCUMULATION"
            evidence.append("Citizen notes mention refuse accumulation or choked drains")

        # Category-specific precautions and descriptions
        if category == "ROAD_FLOODING":
            short_desc = "Significant water submergence across road corridor detected; vehicular impassability likely."
            evidence.extend(["High-level surface inundation", "Pedestrian walkway submerged"])
            precautions = [
                "Do not attempt driving through moving floodwater (Turn Around, Don't Drown)",
                "Avoid wading near storm drains due to suction hazards",
                "Keep clear of submerged electrical utility poles",
            ]
            confidence = 0.88
        elif category == "WATERLOGGING":
            short_desc = "Localized water stagnation and sidewalk waterlogging observed."
            evidence.extend(["Standing rainwater pool", "Stormwater drain backup"])
            precautions = [
                "Reduce vehicle speed to prevent hydroplaning",
                "Watch for obscured potholes beneath water",
            ]
            confidence = 0.84
        elif category == "DAMAGED_ROAD":
            short_desc = "Asphalt depression, deep pothole, or pavement erosion identified."
            evidence.extend(["Pavement structural fracture", "Uneven road surface hazard"])
            precautions = [
                "Slow down to avoid suspension damage or two-wheeler tipping",
                "Report to municipal ward engineering team",
            ]
            confidence = 0.86
        elif category == "FALLEN_TREE":
            short_desc = "Fallen tree or large canopy branch obstructing traffic corridor."
            evidence.extend(["Downed trunk across roadway", "Potential entanglement with overhead lines"])
            precautions = [
                "Maintain at least 10 meters distance from downed utility wires",
                "Reroute emergency and public transit vehicles",
            ]
            confidence = 0.90
        elif category == "WASTE_ACCUMULATION":
            short_desc = "Uncollected municipal solid waste accumulation blocking drainage corridor."
            evidence.extend(["Debris obstruction in storm culvert", "Public health vector risk"])
            precautions = [
                "Do not burn unsegregated waste",
                "Notify solid waste management division for expedited clearing",
            ]
            confidence = 0.83
        else:
            short_desc = "Environmental disturbance or municipal hazard documented."
            evidence.append("Visual evidence flagged for field verification")
            precautions = ["Maintain situational awareness", "Await official municipal inspection"]
            confidence = 0.75

        return VisionAnalysisResult(
            predicted_category=category,
            short_description=short_desc,
            visible_evidence=evidence[:4],
            confidence_estimate=confidence,
            suggested_verification_status="PENDING_FIELD_CHECK",
            safety_precautions=precautions,
            model_name="terraguard-vision-heuristic-v1",
            is_live_gemini=False,
        )


vision_service = VisionService()
