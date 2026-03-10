import asyncio
import httpx
import os

API_URL = os.getenv("API_URL", "http://localhost:8000")

async def poll_and_process():
    async with httpx.AsyncClient() as client:
        while True:
            try:
                resp = await client.get(f"{API_URL}/applications?status=approved")
                if resp.status_code == 200:
                    applications = resp.json()
                    for app in applications:
                        print(f"Processing approved application: {app['id']}")
            except Exception as e:
                print(f"Worker error: {e}")
            await asyncio.sleep(30)

if __name__ == "__main__":
    asyncio.run(poll_and_process())
