"""
resume_parser — extracts structured data from raw CV text using Claude.
Returns JSON with: name, email, skills, experience, education.
"""
import json
from typing import Dict


SYSTEM_PROMPT = """You are a CV parser. Extract structured data from the CV text provided.
Return ONLY valid JSON matching this schema exactly:
{
  "name": "string",
  "email": "string",
  "phone": "string",
  "skills": ["string"],
  "years_experience": number,
  "seniority": "junior|mid|senior|lead|principal",
  "education": [{"degree": "string", "institution": "string", "year": number}],
  "experience": [{"title": "string", "company": "string", "years": number, "description": "string"}],
  "summary": "string"
}"""


async def parse_resume(cv_text: str, api_key: str) -> Dict:
    try:
        import anthropic
        client = anthropic.Anthropic(api_key=api_key)
        message = client.messages.create(
            model="claude-opus-4-6",
            max_tokens=1024,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": f"Parse this CV:\n\n{cv_text[:4000]}"}],
        )
        raw = message.content[0].text.strip()
        # Strip markdown code fences if present
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        return json.loads(raw)
    except Exception as e:
        print(f"resume_parser error: {e}")
        return {"skills": [], "years_experience": 0, "seniority": "mid", "experience": []}
