"""
job_match_scorer — scores job fit using Claude for semantic matching.
Returns a structured score dict with component breakdown.
"""
import json
from typing import Dict

SYSTEM_PROMPT = """You are a job-fit evaluator. Score how well a candidate matches a job.
Return ONLY valid JSON with this exact schema:
{
  "skills_match": 0.0,
  "seniority_match": 0.0,
  "location_match": 0.0,
  "salary_match": 0.0,
  "domain_match": 0.0,
  "resume_strength": 0.0,
  "overall_score": 0.0,
  "reasoning": "string"
}
All score values must be floats between 0.0 and 1.0.
overall_score = 0.35*skills_match + 0.20*seniority_match + 0.15*location_match + 0.10*salary_match + 0.10*domain_match + 0.10*resume_strength"""


async def score_job_match(
    cv_text: str,
    job_title: str,
    job_description: str,
    job_requirements: str,
    api_key: str,
) -> Dict:
    try:
        import anthropic
        client = anthropic.Anthropic(api_key=api_key)
        message = client.messages.create(
            model="claude-opus-4-6",
            max_tokens=400,
            system=SYSTEM_PROMPT,
            messages=[{
                "role": "user",
                "content": (
                    f"Job: {job_title}\n"
                    f"Description: {job_description[:1500]}\n"
                    f"Requirements: {job_requirements[:500]}\n\n"
                    f"Candidate CV: {cv_text[:2000]}"
                ),
            }],
        )
        raw = message.content[0].text.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        return json.loads(raw)
    except Exception as e:
        print(f"job_match_scorer error: {e}")
        return {"overall_score": 0.5, "reasoning": "Scoring unavailable"}
