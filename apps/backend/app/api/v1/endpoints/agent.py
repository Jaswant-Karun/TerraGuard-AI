from fastapi import APIRouter

from app.agents.orchestrator import agent_orchestrator
from app.agents.schemas import AgentChatRequest, AgentChatResponse, AgentInfo

router = APIRouter(prefix="/agent", tags=["AI Multi-Agent Command Center"])


@router.post(
    "/chat",
    response_model=AgentChatResponse,
    summary="Interact with TerraGuard Multi-Agent Intelligence Architecture",
)
async def chat_with_agent(req: AgentChatRequest) -> AgentChatResponse:
    """
    Submits a query to the AI Agent Command Center.
    - Routes query to one of 9 domain-specialized agents.
    - Gathers factual ground truth from Open-Meteo, OpenAQ, and Scikit-Learn models.
    - Never fabricates readings.
    - Formats structured action plans and attaches mandatory emergency advisory notices.
    """
    return await agent_orchestrator.execute_chat(req)


@router.get(
    "/agents",
    response_model=list[AgentInfo],
    summary="List all 9 specialized AI agents in the orchestration network",
)
async def list_agents() -> list[AgentInfo]:
    """Retrieves metadata, domain specialties, and capabilities of all 9 agents."""
    return agent_orchestrator.list_available_agents()


@router.get(
    "/suggested-questions",
    response_model=list[dict[str, str]],
    summary="Curated multi-agent query starters for urban command operators",
)
async def get_suggested_questions() -> list[dict[str, str]]:
    """Returns curated suggested questions covering all 9 intelligence domains."""
    return [
        {
            "category": "Risk Overview",
            "question": "What is the current environmental risk in this area?",
            "agent": "ENVIRONMENTAL_MONITORING_AGENT",
        },
        {
            "category": "Flood Intelligence",
            "question": "Which nearby areas have elevated flood-related risk?",
            "agent": "FLOOD_RISK_AGENT",
        },
        {
            "category": "Explainable AI",
            "question": "Explain why this location has a high risk score.",
            "agent": "RISK_EXPLANATION_AGENT",
        },
        {
            "category": "Field Reports",
            "question": "Summarize the latest verified incidents.",
            "agent": "REPORT_SUMMARIZATION_AGENT",
        },
        {
            "category": "Emergency Mitigation",
            "question": "Recommend preventive actions for this neighbourhood.",
            "agent": "EMERGENCY_PLANNING_AGENT",
        },
        {
            "category": "Safe Navigation",
            "question": "Show safe evacuation corridors avoiding flooded underpasses.",
            "agent": "SAFE_ROUTE_AGENT",
        },
        {
            "category": "Thermal & Heat",
            "question": "What is the apparent NOAA heat index and wet-bulb exposure here?",
            "agent": "HEAT_RISK_AGENT",
        },
        {
            "category": "Air Quality",
            "question": "Analyze EPA AQI levels and governing particulate pollutants.",
            "agent": "AIR_QUALITY_AGENT",
        },
    ]
