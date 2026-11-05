import pytest
from httpx import ASGITransport, AsyncClient

from app.agents.orchestrator import agent_orchestrator
from main import app


def test_agent_inventory_completeness():
    """Verify all 9 specialized agents are registered in the orchestrator."""
    agents = agent_orchestrator.list_available_agents()
    assert len(agents) == 9
    agent_ids = {a.id for a in agents}
    expected_ids = {
        "ENVIRONMENTAL_MONITORING_AGENT",
        "FLOOD_RISK_AGENT",
        "HEAT_RISK_AGENT",
        "AIR_QUALITY_AGENT",
        "IMAGE_VERIFICATION_AGENT",
        "RISK_EXPLANATION_AGENT",
        "SAFE_ROUTE_AGENT",
        "EMERGENCY_PLANNING_AGENT",
        "REPORT_SUMMARIZATION_AGENT",
    }
    assert expected_ids == agent_ids


def test_domain_routing():
    """Test domain classifier routing for all core example questions."""
    # 1. Environmental Risk
    a1 = agent_orchestrator.route_domain("What is the current environmental risk in this area?")
    assert a1.id in ["ENVIRONMENTAL_MONITORING_AGENT", "FLOOD_RISK_AGENT"]

    # 2. Elevated Flood
    a2 = agent_orchestrator.route_domain("Which nearby areas have elevated flood-related risk?")
    assert a2.id == "FLOOD_RISK_AGENT"

    # 3. Risk Explanation (XAI)
    a3 = agent_orchestrator.route_domain("Explain why this location has a high risk score.")
    assert a3.id == "RISK_EXPLANATION_AGENT"

    # 4. Report Summarization
    a4 = agent_orchestrator.route_domain("Summarize the latest verified incidents.")
    assert a4.id == "REPORT_SUMMARIZATION_AGENT"

    # 5. Emergency Prevention & Mitigation
    a5 = agent_orchestrator.route_domain("Recommend preventive actions for this neighbourhood.")
    assert a5.id == "EMERGENCY_PLANNING_AGENT"

    # 6. Safe Evacuation Routes
    a6 = agent_orchestrator.route_domain("Show safe evacuation corridors avoiding flooded roads.")
    assert a6.id == "SAFE_ROUTE_AGENT"

    # 7. Heat & Thermal
    a7 = agent_orchestrator.route_domain("What is the apparent NOAA heat index here?")
    assert a7.id == "HEAT_RISK_AGENT"

    # 8. Air Quality
    a8 = agent_orchestrator.route_domain("Analyze PM2.5 air quality and pollution levels.")
    assert a8.id == "AIR_QUALITY_AGENT"

    # 9. Image Verification
    a9 = agent_orchestrator.route_domain("Verify this hazard photo from citizen report.")
    assert a9.id == "IMAGE_VERIFICATION_AGENT"


@pytest.mark.asyncio
async def test_api_list_agents():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/api/v1/agent/agents")
        assert res.status_code == 200
        items = res.json()
        assert len(items) == 9
        for item in items:
            assert "id" in item
            assert "name" in item
            assert "domain" in item
            assert "capabilities" in item


@pytest.mark.asyncio
async def test_api_suggested_questions():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/api/v1/agent/suggested-questions")
        assert res.status_code == 200
        questions = res.json()
        assert len(questions) >= 5
        for q in questions:
            assert "category" in q
            assert "question" in q
            assert "agent" in q


@pytest.mark.asyncio
async def test_api_agent_chat_flood_risk():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        payload = {
            "message": "Which nearby areas have elevated flood-related risk?",
            "lat": 12.9352,
            "lng": 77.6245,
            "location_name": "Koramangala 80ft Rd",
        }
        res = await ac.post("/api/v1/agent/chat", json=payload)
        assert res.status_code == 200
        body = res.json()

        assert body["identified_domain"] == "FLOOD_RISK"
        assert body["agent_name"] == "Flood Risk Analysis Agent"
        assert len(body["agent_activity"]) >= 2
        assert len(body["factual_data_sources"]) >= 1
        assert "advisory" in body["advisory_notice"].lower()
        assert body["risk_summary"] is not None
        assert "Koramangala" in body["reply"] or "Flood" in body["reply"]


@pytest.mark.asyncio
async def test_api_agent_chat_mitigation_action_plan():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        payload = {
            "message": "Recommend preventive actions for this neighbourhood.",
            "lat": 12.9716,
            "lng": 77.5946,
            "location_name": "Bengaluru Central",
        }
        res = await ac.post("/api/v1/agent/chat", json=payload)
        assert res.status_code == 200
        body = res.json()

        assert body["identified_domain"] == "EMERGENCY_RESPONSE"
        assert body["structured_action_plan"] is not None
        assert len(body["structured_action_plan"]) >= 2

        first_action = body["structured_action_plan"][0]
        assert "department" in first_action
        assert "action" in first_action
        assert "priority" in first_action


@pytest.mark.asyncio
async def test_api_agent_chat_xai_explanation():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        payload = {
            "message": "Explain why this location has a high risk score.",
            "lat": 12.9352,
            "lng": 77.6669,
            "location_name": "Bellandur Lake Catchment",
        }
        res = await ac.post("/api/v1/agent/chat", json=payload)
        assert res.status_code == 200
        body = res.json()

        assert body["identified_domain"] == "RISK_EXPLANATION"
        assert "Threat Score" in body["reply"] or "Factor" in body["reply"]
        assert len(body["factual_data_sources"]) > 0

