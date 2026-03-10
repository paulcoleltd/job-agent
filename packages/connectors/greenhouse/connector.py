import httpx
from typing import List, Dict

class GreenhouseConnector:
    BASE_URL = "https://boards-api.greenhouse.io/v1/boards"

    async def list_jobs(self, company: str) -> List[Dict]:
        async with httpx.AsyncClient(timeout=10) as client:
            try:
                resp = await client.get(f"{self.BASE_URL}/{company}/jobs?content=true")
                resp.raise_for_status()
                data = resp.json()
                return data.get("jobs", [])
            except Exception as e:
                print(f"Greenhouse list_jobs error for {company}: {e}")
                return []

    async def get_job(self, company: str, job_id: str) -> Dict:
        async with httpx.AsyncClient(timeout=10) as client:
            try:
                resp = await client.get(f"{self.BASE_URL}/{company}/jobs/{job_id}")
                resp.raise_for_status()
                return resp.json()
            except Exception:
                return {}

    async def search(self, query: str) -> List[Dict]:
        companies = ["airbnb", "stripe", "shopify", "twilio", "datadog"]
        results = []
        for company in companies:
            jobs = await self.list_jobs(company)
            for job in jobs:
                title = job.get("title", "")
                if query.lower() in title.lower():
                    results.append(self._normalize(job, company))
        return results

    def _normalize(self, job: dict, company: str) -> dict:
        return {
            "source": "greenhouse",
            "source_job_id": str(job.get("id", "")),
            "company": company,
            "title": job.get("title", ""),
            "location": job.get("location", {}).get("name", ""),
            "apply_url": job.get("absolute_url", ""),
            "description": job.get("content", ""),
            "ats_type": "greenhouse",
        }
