"""AI Orchestrator — coordinates all 6 agents in the MedAI pipeline.

Python port of the original Node `orchestrator.js`.

  Agent 1: Symptom Extractor
  Agent 2: Follow-up Question Generator
  Agent 3: Medical Knowledge Retriever (RAG)
  Agent 4: Disease Probability Ranker
  Agent 5: Safety Validator
  Agent 6: Final Response Generator
"""

from __future__ import annotations

import json
import re
from typing import Any, Dict, List

from .config import logger
from .llm_client import chat
from .prompts import (
    DISEASE_RANKER,
    FOLLOW_UP_GENERATOR,
    RESPONSE_GENERATOR,
    SAFETY_VALIDATOR,
    SYMPTOM_EXTRACTOR,
)
from .rag_service import retrieve_medical_context


# ── Helpers ───────────────────────────────────────────────────
def _safe_parse_json(raw: str, fallback: Any, agent_name: str = "unknown") -> Any:
    """Strip markdown fences and parse JSON, returning `fallback` on failure."""
    if not raw or not raw.strip():
        logger.warning("%s: received empty response — using fallback", agent_name)
        return fallback
    try:
        cleaned = re.sub(r"```json|```", "", raw).strip()
        return json.loads(cleaned)
    except (json.JSONDecodeError, ValueError) as err:
        logger.warning(
            '%s: JSON parse failed — "%s" — using fallback (%s)',
            agent_name,
            raw[:120],
            err,
        )
        return fallback


def _strip_signature(text: str) -> str:
    """Remove a leading "MedAI:" (or similar) signature the model sometimes adds
    despite being told not to. Handles a few common variants and repeats."""
    if not text:
        return text
    cleaned = text.strip()
    # Repeatedly strip a leading signature like "MedAI:", "MedAI -", "AI:"
    pattern = re.compile(r"^\s*(med\s*ai|medai|ai)\s*[:\-–]\s*", re.IGNORECASE)
    while True:
        new_cleaned = pattern.sub("", cleaned, count=1)
        if new_cleaned == cleaned:
            break
        cleaned = new_cleaned.strip()
    return cleaned


def _call_agent(messages: List[dict], system_prompt: str, max_tokens: int, agent_name: str) -> str:
    """Call an agent, retrying once on an empty response."""
    response = chat(messages, system_prompt, max_tokens)

    if not response or not response.strip():
        logger.warning("%s: empty response on first attempt — retrying once", agent_name)
        response = chat(messages, system_prompt, max_tokens)

    if not response or not response.strip():
        logger.error("%s: empty response after retry", agent_name)

    return response or ""


# ── Agent 1: Extract structured symptoms ─────────────────────
def extract_symptoms(conversation_history: List[dict]) -> Dict[str, Any]:
    user_messages = "\n".join(
        m["content"] for m in conversation_history if m.get("role") == "user"
    )

    raw = _call_agent(
        [{"role": "user", "content": f"Extract symptoms from:\n{user_messages}"}],
        SYMPTOM_EXTRACTOR,
        512,
        "Agent1:SymptomExtractor",
    )

    return _safe_parse_json(
        raw,
        {
            "symptoms": [],
            "duration": None,
            "severity": None,
            "age": None,
            "additionalContext": None,
        },
        "Agent1:SymptomExtractor",
    )


# ── Agent 2: Decide next follow-up or signal ready ───────────
def get_next_action(conversation_history: List[dict], extracted_symptoms: Dict[str, Any]) -> Dict[str, Any]:
    # The model alone decides whether to ask another question, whether the
    # user's answer was negative, and when enough info has been gathered.
    conversation = "\n".join(
        f"{m.get('role', '').upper()}: {m.get('content', '')}" for m in conversation_history
    )
    context = (
        f"Extracted so far: {json.dumps(extracted_symptoms)}\n\n"
        f"Conversation:\n{conversation}"
    ).strip()

    response = _call_agent(
        [{"role": "user", "content": context}],
        FOLLOW_UP_GENERATOR,
        256,
        "Agent2:FollowUpGenerator",
    )

    if not response or not response.strip():
        return {
            "action": "followup",
            "question": (
                "Could you tell me more about your symptoms? How long have you been "
                "experiencing them and how severe would you rate them on a scale of 1 to 10?"
            ),
        }

    text = response.strip()
    if "__EMERGENCY__" in text:
        return {"action": "emergency"}
    if "__ANALYSIS_READY__" in text:
        return {"action": "analyze"}
    return {"action": "followup", "question": _strip_signature(text)}


# ── Agent 3: Retrieve medical context (RAG) ──────────────────
def retrieve_context(symptoms: List[str]) -> str:
    query = ", ".join(symptoms)
    return retrieve_medical_context(query)


# ── Agent 4: Rank diseases by probability ────────────────────
def rank_diseases(extracted_symptoms: Dict[str, Any], medical_context: str) -> Dict[str, Any]:
    prompt = (
        f"Patient data:\n{json.dumps(extracted_symptoms, indent=2)}\n\n"
        f"Medical knowledge:\n{medical_context}"
    ).strip()

    raw = _call_agent(
        [{"role": "user", "content": prompt}],
        DISEASE_RANKER,
        1024,
        "Agent4:DiseaseRanker",
    )

    return _safe_parse_json(
        raw,
        {
            "conditions": [],
            "recommendation": "Please consult a healthcare professional for a proper evaluation.",
            "seekEmergencyCare": False,
        },
        "Agent4:DiseaseRanker",
    )


# ── Agent 5: Safety validation ───────────────────────────────
def validate_safety(response: str) -> Dict[str, Any]:
    if not response or not response.strip():
        logger.warning("Agent5:SafetyValidator — skipped (empty input response)")
        return {"safe": True, "issues": [], "correctedResponse": None}

    raw = _call_agent(
        [{"role": "user", "content": f"Validate this medical AI response:\n\n{response}"}],
        SAFETY_VALIDATOR,
        512,
        "Agent5:SafetyValidator",
    )

    return _safe_parse_json(
        raw,
        {"safe": True, "issues": [], "correctedResponse": None},
        "Agent5:SafetyValidator",
    )


# ── Agent 6: Generate final user-facing response ─────────────
def generate_final_response(
    extracted_symptoms: Dict[str, Any], rank_result: Dict[str, Any], medical_context: str
) -> str:
    prompt = (
        f"Patient symptoms: {json.dumps(extracted_symptoms)}\n\n"
        f"Possible conditions:\n{json.dumps(rank_result.get('conditions', []), indent=2)}\n\n"
        f"Medical context:\n{medical_context}\n\n"
        "Generate a compassionate, clear response for the patient."
    ).strip()

    response = _call_agent(
        [{"role": "user", "content": prompt}],
        RESPONSE_GENERATOR,
        1024,
        "Agent6:ResponseGenerator",
    )

    if not response or not response.strip():
        logger.error("Agent6:ResponseGenerator — empty response even after retry, using fallback")
        conditions = rank_result.get("conditions") or []
        top_condition = conditions[0].get("disease") if conditions else None
        return "\n\n".join(
            [
                (
                    f"Based on your symptoms, one possible consideration is {top_condition}, "
                    "among other conditions."
                )
                if top_condition
                else "Based on your symptoms, there are several possible conditions to consider.",
                (
                    "I strongly recommend consulting a qualified healthcare professional for an "
                    "accurate diagnosis and appropriate treatment."
                ),
                "This is not a medical diagnosis. Please consult a healthcare professional.",
            ]
        )

    return _strip_signature(response)


# ── Main orchestration entry point ───────────────────────────
def process_message(conversation_history: List[dict], latest_message: str) -> Dict[str, Any]:
    """Process one user message through the full multi-agent pipeline."""
    logger.info("Orchestrator: processing message")

    history = [*conversation_history, {"role": "user", "content": latest_message}]

    # Agent 1 — extract symptoms
    extracted_symptoms = extract_symptoms(history)
    logger.debug("Extracted symptoms: %s", extracted_symptoms)

    # Agent 2 — decide action
    next_action = get_next_action(history, extracted_symptoms)
    logger.debug("Next action: %s", next_action.get("action"))

    if next_action["action"] == "emergency":
        return {
            "type": "emergency",
            "message": (
                "⚠️ Based on your symptoms, you may need **immediate emergency care**. "
                "Please call emergency services (911) or go to your nearest emergency room now. "
                "Do not wait.\n\n*This is not a medical diagnosis. Please consult a healthcare professional.*"
            ),
            "extractedSymptoms": extracted_symptoms,
            "diagnoses": [],
            "isComplete": False,
        }

    if next_action["action"] == "followup":
        return {
            "type": "followup",
            "message": next_action["question"],
            "extractedSymptoms": extracted_symptoms,
            "diagnoses": [],
            "isComplete": False,
        }

    # Agent 3 — retrieve RAG context
    symptoms = extracted_symptoms.get("symptoms") or [latest_message]
    medical_context = retrieve_context(symptoms)

    # Agent 4 — rank diseases
    rank_result = rank_diseases(extracted_symptoms, medical_context)

    # Agent 6 — generate response
    final_response = generate_final_response(extracted_symptoms, rank_result, medical_context)

    # Agent 5 — safety check
    safety = validate_safety(final_response)
    if not safety.get("safe") and safety.get("correctedResponse"):
        logger.warning("Safety issues found: %s", safety.get("issues"))
        final_response = safety["correctedResponse"]

    return {
        "type": "analysis",
        "message": final_response,
        "extractedSymptoms": extracted_symptoms,
        "diagnoses": rank_result.get("conditions", []),
        "recommendation": rank_result.get("recommendation"),
        "seekEmergencyCare": rank_result.get("seekEmergencyCare", False),
        "isComplete": True,
        "safetyIssues": [] if safety.get("safe") else safety.get("issues", []),
    }
