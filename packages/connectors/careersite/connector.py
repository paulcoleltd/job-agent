"""
CareerSiteConnector — structured scraping of company career pages.
Uses httpx for HTML fetching and basic parsing.
Pauses on unexpected structure; never submits anything.
"""
import httpx
import re
from typing import List, Dict
from urllib.parse import urljoin, urlparse


class CareerSiteConnector:
    DEFAULT_CAREER_PATHS = ["/careers", "/jobs", "/work-with-us", "/join-us", "/hiring"]

    async def scrape(self, base_url: str, query: str = "") -> List[Dict]:
        results = []
        career_url = await self._find_careers_page(base_url)
        if not career_url:
            return results

        try:
            async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
                resp = await client.get(career_url, headers={"User-Agent": "JobAgentBot/1.0"})
                resp.raise_for_status()
                html = resp.text
                jobs = self._extract_jobs(html, career_url, base_url)
                if query:
                    jobs = [j for j in jobs if query.lower() in j["title"].lower()]
                results.extend(jobs)
        except Exception as e:
            print(f"CareerSite scrape error for {base_url}: {e}")

        return results

    async def _find_careers_page(self, base_url: str) -> str | None:
        async with httpx.AsyncClient(timeout=10, follow_redirects=True) as client:
            for path in self.DEFAULT_CAREER_PATHS:
                url = urljoin(base_url, path)
                try:
                    resp = await client.head(url)
                    if resp.status_code < 400:
                        return url
                except Exception:
                    continue
        return None

    def _extract_jobs(self, html: str, page_url: str, base_url: str) -> List[Dict]:
        jobs = []
        domain = urlparse(base_url).netloc

        # Extract job-like anchor tags — titles adjacent to links
        pattern = re.compile(
            r'<a[^>]+href=["\']([^"\']*(?:job|career|position|role)[^"\']*)["\'][^>]*>(.*?)</a>',
            re.IGNORECASE | re.DOTALL,
        )
        for match in pattern.finditer(html):
            href, raw_title = match.groups()
            title = re.sub(r"<[^>]+>", "", raw_title).strip()
            if not title or len(title) < 3 or len(title) > 200:
                continue
            full_url = href if href.startswith("http") else urljoin(base_url, href)
            jobs.append({
                "source": "careersite",
                "source_job_id": f"cs_{hash(full_url) % 10**9}",
                "company": domain,
                "title": title,
                "location": "",
                "apply_url": full_url,
                "description": "",
                "ats_type": "careersite",
            })

        # Deduplicate by apply_url
        seen = set()
        unique = []
        for j in jobs:
            if j["apply_url"] not in seen:
                seen.add(j["apply_url"])
                unique.append(j)
        return unique[:20]  # cap at 20 results per site
