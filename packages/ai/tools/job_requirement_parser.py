"""
job_requirement_parser — extracts structured requirements from a job description.
Returns JSON: required_skills, preferred_skills, seniority, remote_type, responsibilities.
"""
import json
from typing import Dict

SYSTEM_PROMPT = """You are a job description parser. Extract structured requirements from the job posting.
Return ONLY valid JSON matching this schema:
{
  "required_skills": ["string"],
  "preferred_skills": ["string"],
  "seniority": "junior|mid|senior|lead|principal",
  "remote_type": "remote|hybrid|onsite|unknown",
  "responsibilities": ["string"],
  "min_years_experience": number,
  "domain": "string"
}"""


async def parse_job_requirements(description: str, api_key: str) -> Dict:
    try:
        import anthropic
        client = anthropic.Anthropic(api_key=api_key)
        message = client.messages.create(
            model="claude-opus-4-6",
            max_tokens=512,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": f"Parse this job description:\n\n{description[:3000]}"}],
        )
        raw = message.content[0].text.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        return json.loads(raw)
    except Exception as e:
        print(f"job_requirement_parser error: {e}")
        return {"required_skills": [], "preferred_skills": [], "seniority": "mid", "remote_type": "unknown"}
