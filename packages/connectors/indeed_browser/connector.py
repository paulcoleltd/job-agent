"""
Indeed Browser Connector using Playwright.
Stops before any form submission. Never bypasses CAPTCHA.
"""
from typing import List, Dict

class IndeedBrowserConnector:
    async def search(self, query: str, location: str = "Remote") -> List[Dict]:
        try:
            from playwright.async_api import async_playwright
            results = []
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                page = await browser.new_page()
                url = f"https://www.indeed.com/jobs?q={query}&l={location}"
                await page.goto(url, timeout=15000)

                # Check for CAPTCHA — pause if detected
                if await page.locator("[id*='captcha']").count() > 0:
                    print("CAPTCHA detected — pausing automation. User action required.")
                    await browser.close()
                    return []

                job_cards = await page.locator(".jobsearch-ResultsList li").all()
                for card in job_cards[:10]:
                    try:
                        title = await card.locator("h2").text_content()
                        company = await card.locator("[data-testid='company-name']").text_content()
                        location_text = await card.locator("[data-testid='text-location']").text_content()
                        results.append({
                            "source": "indeed",
                            "source_job_id": f"indeed_{hash(title)}",
                            "company": (company or "").strip(),
                            "title": (title or "").strip(),
                            "location": (location_text or "").strip(),
                            "ats_type": "indeed",
                            "apply_url": "",
                            "description": "",
                        })
                    except Exception:
                        continue

                await browser.close()
            return results
        except Exception as e:
            print(f"Indeed browser connector error: {e}")
            return []
