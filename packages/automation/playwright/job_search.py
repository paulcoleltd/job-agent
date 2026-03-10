"""
Playwright job search automation.
Searches Indeed and LinkedIn Jobs for listings.
Stops before any submission. Never bypasses CAPTCHA.
"""
import asyncio
from typing import List, Dict


async def search_indeed(query: str, location: str = "Remote", max_results: int = 20) -> List[Dict]:
    from playwright.async_api import async_playwright
    results = []
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        )
        page = await context.new_page()
        try:
            await page.goto(
                f"https://www.indeed.com/jobs?q={query}&l={location}",
                timeout=20000,
                wait_until="domcontentloaded",
            )

            # Pause on CAPTCHA
            if await page.locator("[id*='captcha'], .g-recaptcha").count() > 0:
                print("CAPTCHA detected on Indeed — pausing. User action required.")
                await browser.close()
                return []

            await page.wait_for_selector(".jobsearch-ResultsList, #mosaic-jobResults", timeout=8000)
            cards = await page.locator("li.css-5lfssm, .job_seen_beacon").all()

            for card in cards[:max_results]:
                try:
                    title_el = card.locator("h2 a span, .jobTitle span")
                    company_el = card.locator("[data-testid='company-name'], .companyName")
                    loc_el = card.locator("[data-testid='text-location'], .companyLocation")
                    link_el = card.locator("h2 a")

                    title = (await title_el.first.text_content() or "").strip()
                    company = (await company_el.first.text_content() or "").strip()
                    location_text = (await loc_el.first.text_content() or "").strip()
                    href = await link_el.first.get_attribute("href") or ""
                    full_url = f"https://www.indeed.com{href}" if href.startswith("/") else href

                    if title:
                        results.append({
                            "source": "indeed",
                            "source_job_id": f"indeed_{abs(hash(full_url)) % 10**9}",
                            "company": company,
                            "title": title,
                            "location": location_text,
                            "apply_url": full_url,
                            "description": "",
                            "ats_type": "indeed",
                        })
                except Exception:
                    continue

        except Exception as e:
            print(f"Indeed search error: {e}")
        finally:
            await browser.close()

    return results


async def extract_job_details(url: str) -> Dict:
    """Extract description from a job detail page."""
    from playwright.async_api import async_playwright
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        try:
            await page.goto(url, timeout=15000, wait_until="domcontentloaded")
            if await page.locator("[id*='captcha']").count() > 0:
                await browser.close()
                return {"description": "", "paused": True, "reason": "captcha"}

            desc_el = page.locator(
                "#jobDescriptionText, .jobsearch-jobDescriptionText, [data-testid='job-description']"
            )
            description = ""
            if await desc_el.count() > 0:
                description = (await desc_el.first.text_content() or "").strip()

            await browser.close()
            return {"description": description[:3000], "paused": False}
        except Exception as e:
            await browser.close()
            return {"description": "", "paused": False, "error": str(e)}


if __name__ == "__main__":
    async def main():
        jobs = await search_indeed("software engineer", "Remote")
        print(f"Found {len(jobs)} jobs")
        for j in jobs[:3]:
            print(f"  {j['title']} @ {j['company']}")

    asyncio.run(main())
