import httpx
from typing import List, Dict

class LeverConnector:
    BASE_URL = "https://api.lever.co/v0/postings"

    async def list_postings(self, company: str) -> List[Dict]:
        async with httpx.AsyncClient(timeout=10) as client:
            try:
                resp = await client.get(f"{self.BASE_URL}/{company}?mode=json")
                resp.raise_for_status()
                return resp.json()
            except Exception as e:
                print(f"Lever list_postings error for {company}: {e}")
                return []

    async def get_posting(self, company: str, posting_id: str) -> Dict:
        async with httpx.AsyncClient(timeout=10) as client:
            try:
                resp = await client.get(f"{self.BASE_URL}/{company}/{posting_id}")
                resp.raise_for_status()
                return resp.json()
            except Exception:
                return {}

    async def search(self, query: str) -> List[Dict]:
        companies = ["netflix", "figma", "notion", "linear", "vercel"]
        results = []
        for company in companies:
            postings = await self.list_postings(company)
            for posting in postings:
                title = posting.get("text", "")
                if query.lower() in title.lower():
                    results.append(self._normalize(posting, company))
        return results

    def _normalize(self, posting: dict, company: str) -> dict:
        return {
            "source": "lever",
            "source_job_id": posting.get("id", ""),
            "company": company,
            "title": posting.get("text", ""),
            "location": posting.get("categories", {}).get("location", ""),
            "apply_url": posting.get("hostedUrl", ""),
            "description": posting.get("descriptionPlain", ""),
            "ats_type": "lever",
        }
