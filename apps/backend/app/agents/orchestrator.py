import logging
import uuid
from typing import Any

from app.agents.schemas import (
    ActionPlanItem,
    AgentActivityStep,
    AgentChatRequest,
    AgentChatResponse,
    AgentInfo,
)
from app.agents.specialized_agents import (
    AirQualityAnalysisAgent,
    BaseAgent,
    EmergencyResponsePlanningAgent,
    EnvironmentalMonitoringAgent,
    FloodRiskAnalysisAgent,
    HeatRiskAnalysisAgent,
    ImageVerificationAgent,
    ReportSummarizationAgent,
    RiskExplanationAgent,
    SafeRouteRecommendationAgent,
)
from app.agents.tools import (
    get_factual_environment_data,
    get_factual_nearby_facilities,
    get_factual_nearby_reports,
    get_factual_risk_assessment,
    get_factual_safe_routes,
)
from app.core.config import settings

logger = logging.getLogger("terraguard.orchestrator")


class AgentOrchestrator:
    """
    Central multi-agent orchestrator for TerraGuard AI.
    Routes queries to 9 specialized domain agents, retrieves factual tool telemetry,
    and synthesizes explainable action plans with Gemini 2.0 reasoning.
    """

    def __init__(self) -> None:
        self.agents: dict[str, BaseAgent] = {
            "ENVIRONMENTAL_MONITORING_AGENT": EnvironmentalMonitoringAgent(),
            "FLOOD_RISK_AGENT": FloodRiskAnalysisAgent(),
            "HEAT_RISK_AGENT": HeatRiskAnalysisAgent(),
            "AIR_QUALITY_AGENT": AirQualityAnalysisAgent(),
            "IMAGE_VERIFICATION_AGENT": ImageVerificationAgent(),
            "RISK_EXPLANATION_AGENT": RiskExplanationAgent(),
            "SAFE_ROUTE_AGENT": SafeRouteRecommendationAgent(),
            "EMERGENCY_PLANNING_AGENT": EmergencyResponsePlanningAgent(),
            "REPORT_SUMMARIZATION_AGENT": ReportSummarizationAgent(),
        }

    def list_available_agents(self) -> list[AgentInfo]:
        return [
            AgentInfo(
                id=a.id,
                name=a.name,
                domain=a.domain,
                description=a.description,
                capabilities=a.capabilities,
            )
            for a in self.agents.values()
        ]

    def route_domain(self, query: str, override: str | None = None) -> BaseAgent:
        """Determines the specialized agent best suited for the query."""
        if override and override in self.agents:
            return self.agents[override]

        q = query.lower()

        # 1. Explanation questions
        if "explain" in q or "why" in q or "factor" in q or "attribution" in q:
            return self.agents["RISK_EXPLANATION_AGENT"]

        # 2. Action / Mitigation / Planning questions
        if "action" in q or "prevent" in q or "recommend" in q or "dispatch" in q or "plan" in q or "mitigat" in q:
            return self.agents["EMERGENCY_PLANNING_AGENT"]

        # 3. Safe route / Evacuation
        if "route" in q or "evacuat" in q or "path" in q or "corridor" in q or "navigat" in q:
            return self.agents["SAFE_ROUTE_AGENT"]

        # 4. Summarize reports / incidents
        if "summar" in q or "incident" in q or "verified" in q or "citizen" in q or "report" in q:
            return self.agents["REPORT_SUMMARIZATION_AGENT"]

        # 5. Flood / Inundation
        if "flood" in q or "waterlog" in q or "drain" in q or "inundat" in q or "rain" in q:
            return self.agents["FLOOD_RISK_AGENT"]

        # 6. Heat / Thermal stress
        if "heat" in q or "hot" in q or "thermal" in q or "temperature" in q:
            return self.agents["HEAT_RISK_AGENT"]

        # 7. Air quality / AQI / PM2.5
        if "air" in q or "aqi" in q or "pollution" in q or "pm2" in q or "smog" in q:
            return self.agents["AIR_QUALITY_AGENT"]

        # 8. Image / Photo verification
        if "image" in q or "photo" in q or "camera" in q or "picture" in q or "verify" in q:
            return self.agents["IMAGE_VERIFICATION_AGENT"]

        # Default: Environmental Monitoring
        return self.agents["ENVIRONMENTAL_MONITORING_AGENT"]

    async def execute_chat(self, req: AgentChatRequest) -> AgentChatResponse:
        """
        Executes end-to-end multi-agent workflow:
        1. Identifies domain & agent
        2. Retrieves factual tools data
        3. Invokes specialized agent analysis
        4. Grounded Gemini reasoning (if API key present)
        5. Formats structured result with mandatory advisory notice
        """
        conversation_id = f"conv_{uuid.uuid4().hex[:12]}"
        location_name = req.location_name or f"Coordinates [{req.lat:.4f}, {req.lng:.4f}]"

        # 1. Routing
        selected_agent = self.route_domain(req.message, req.agent_override)

        # 2. Factual Tool Data Gathering (Concurrent/Parallel)
        tools_data: dict[str, Any] = {}
        activities: list[AgentActivityStep] = [
            AgentActivityStep(
                agent="TerraGuard Orchestrator",
                action="ROUTING_DOMAIN",
                description=f"Routed query to {selected_agent.name} (Domain: {selected_agent.domain})",
            )
        ]

        try:
            env_data = await get_factual_environment_data(req.lat, req.lng)
            tools_data["environment"] = env_data

            risk_data = await get_factual_risk_assessment(req.lat, req.lng)
            tools_data["risk"] = risk_data

            reports_data = await get_factual_nearby_reports(req.lat, req.lng, radius_meters=3000.0)
            tools_data["reports"] = reports_data

            facilities_data = await get_factual_nearby_facilities(req.lat, req.lng, radius_meters=5000.0)
            tools_data["facilities"] = facilities_data

            safe_routes_data = await get_factual_safe_routes(location_name, req.lat, req.lng)
            tools_data["safe_routes"] = safe_routes_data
        except Exception as e:
            logger.warning(f"Error gathering factual tools data: {e}")

        # 3. Agent Execution
        analysis_result = await selected_agent.analyze(
            user_message=req.message,
            location_name=location_name,
            lat=req.lat,
            lng=req.lng,
            tools_data=tools_data,
        )

        reply_text = analysis_result["reply"]
        activities.extend(analysis_result["activities"])
        sources = analysis_result["sources"]
        action_plan: list[ActionPlanItem] | None = analysis_result["action_plan"]

        # 4. Optional Gemini LLM Refinement if GEMINI_API_KEY is present
        if settings.GEMINI_API_KEY:
            try:
                from google import genai

                client = genai.Client(api_key=settings.GEMINI_API_KEY)
                prompt = (
                    f"You are the {selected_agent.name} of TerraGuard AI.\n"
                    f"Location: {location_name} (Lat: {req.lat}, Lng: {req.lng})\n"
                    f"Citizen/User query: '{req.message}'\n"
                    f"Factual Telemetry Ground Truth (Do not invent numbers):\n"
                    f"{tools_data}\n\n"
                    f"Baseline Analysis:\n{reply_text}\n\n"
                    "Refine this into an articulate, professional executive response for an urban command center.\n"
                    "Ensure numbers match ground truth exactly. Maintain markdown formatting."
                )
                gemini_res = client.models.generate_content(
                    model="gemini-2.0-flash",
                    contents=prompt,
                )
                if gemini_res.text:
                    reply_text = gemini_res.text
                    activities.append(
                        AgentActivityStep(
                            agent="Gemini 2.0 Flash Reasoning Engine",
                            action="SYNTHESIS_COMPLETE",
                            description="Grounded executive synthesis generated with Google Gemini 2.0 Flash",
                        )
                    )
            except Exception as e:
                logger.warning(f"Gemini LLM refinement skipped, using agent baseline: {e}")

        # 5. Extract risk summary
        risk_summary = {
            "composite_risk_score": tools_data.get("risk", {}).get("composite_risk_score", 45.0),
            "risk_level": tools_data.get("risk", {}).get("risk_level", "MODERATE"),
            "primary_hazard": tools_data.get("risk", {}).get("primary_hazard", "WATERLOGGING"),
            "temperature_c": tools_data.get("environment", {}).get("temperature_c", 28.5),
            "rainfall_mm": tools_data.get("environment", {}).get("rainfall_mm", 0.0),
            "aqi": tools_data.get("environment", {}).get("air_quality", {}).get("aqi", 75),
        }

        return AgentChatResponse(
            conversation_id=conversation_id,
            reply=reply_text,
            identified_domain=selected_agent.domain,
            agent_name=selected_agent.name,
            agent_activity=activities,
            factual_data_sources=sources,
            structured_action_plan=action_plan,
            risk_summary=risk_summary,
        )


agent_orchestrator = AgentOrchestrator()
