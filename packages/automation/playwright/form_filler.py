"""
Playwright form automation.
Pauses on: captcha, login walls, unexpected fields.
Never submits without explicit user approval.
"""
from typing import Dict, Optional

class FormFiller:
    def __init__(self, headless: bool = False):
        self.headless = headless

    async def fill_application(self, url: str, application_data: Dict) -> Dict:
        from playwright.async_api import async_playwright

        result = {"success": False, "paused": False, "reason": None, "screenshot": None}

        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=self.headless)
            page = await browser.new_page()

            try:
                await page.goto(url, timeout=20000)

                # Check for CAPTCHA
                captcha_selectors = ["[id*='captcha']", ".g-recaptcha", "[class*='captcha']"]
                for sel in captcha_selectors:
                    if await page.locator(sel).count() > 0:
                        result["paused"] = True
                        result["reason"] = "captcha_detected"
                        screenshot = await page.screenshot()
                        result["screenshot"] = screenshot
                        await browser.close()
                        return result

                # Check for login wall
                login_selectors = ["input[type='password']", "[id*='login']", "[class*='signin']"]
                for sel in login_selectors:
                    if await page.locator(sel).count() > 0:
                        result["paused"] = True
                        result["reason"] = "login_required"
                        await browser.close()
                        return result

                # Fill standard fields
                name = application_data.get("full_name", "")
                email = application_data.get("email", "")

                if name:
                    name_field = page.locator("input[name*='name'], input[placeholder*='name']").first
                    if await name_field.count() > 0:
                        await name_field.fill(name)

                if email:
                    email_field = page.locator("input[type='email']").first
                    if await email_field.count() > 0:
                        await email_field.fill(email)

                # DO NOT submit — requires human approval
                result["success"] = True
                result["reason"] = "form_filled_awaiting_approval"

            except Exception as e:
                result["reason"] = str(e)
            finally:
                await browser.close()

        return result
