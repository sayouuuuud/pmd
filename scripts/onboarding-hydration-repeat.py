import json
from playwright.sync_api import sync_playwright

with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True, executable_path="/usr/bin/chromium", args=["--no-sandbox"])
    rows = []
    for viewport_name, width, height in [("mobile", 390, 844), ("tablet", 768, 1024)]:
        for run in range(5):
            context = browser.new_context(viewport={"width": width, "height": height}, device_scale_factor=1)
            page = context.new_page()
            errors = []
            page.on("pageerror", lambda error: errors.append({"message": error.message, "stack": error.stack}))
            response = page.goto("http://localhost:3004/onboarding", wait_until="domcontentloaded", timeout=20000)
            page.wait_for_timeout(1500)
            rows.append({"viewport": viewport_name, "run": run + 1, "status": response.status if response else None, "errors": errors, "text": page.locator("body").inner_text()[:180]})
            context.close()
    browser.close()

print(json.dumps(rows, ensure_ascii=False, indent=2))
if any(row["errors"] for row in rows):
    raise SystemExit(1)
