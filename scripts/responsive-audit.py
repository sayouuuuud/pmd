import json
import re
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost:3004"
ROUTES = [
    "/", "/daily-plan", "/tasks", "/notes", "/habits", "/projects", "/goals",
    "/journal", "/money", "/entertainment", "/religious", "/account", "/board",
    "/reminders", "/review", "/login", "/onboarding",
]
VIEWPORTS = [("mobile", 390, 844), ("tablet", 768, 1024)]
EXPECTED_RESOURCE_ERROR = re.compile(r"status of (?:401|503)\b")


def main():
    root = Path.cwd()
    out_dir = root / "docs" / "responsive-screenshots"
    out_dir.mkdir(parents=True, exist_ok=True)
    results = []
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True, executable_path="/usr/bin/chromium", args=["--no-sandbox"])
        for viewport_name, width, height in VIEWPORTS:
            for route in ROUTES:
                context = browser.new_context(viewport={"width": width, "height": height}, device_scale_factor=1)
                page = context.new_page()
                console_errors = []
                expected_resource_errors = []

                def on_console(message):
                    if message.type != "error":
                        return
                    if EXPECTED_RESOURCE_ERROR.search(message.text):
                        expected_resource_errors.append(message.text)
                    else:
                        console_errors.append(message.text)

                page.on("console", on_console)
                page.on("pageerror", lambda error: console_errors.append(f"pageerror: {error.message}"))
                safe_route = "home" if route == "/" else route[1:].replace("/", "_")
                screenshot = out_dir / f"{viewport_name}-{safe_route}.png"
                record = {
                    "viewport": viewport_name,
                    "route": route,
                    "screenshot": str(screenshot),
                    "consoleErrors": console_errors,
                    "expectedResourceErrors": expected_resource_errors,
                }
                try:
                    response = page.goto(f"{BASE_URL}{route}", wait_until="domcontentloaded", timeout=20000)
                    page.wait_for_timeout(1800)
                    metrics = page.evaluate("""() => ({
                        innerWidth: window.innerWidth,
                        bodyScrollWidth: document.body.scrollWidth,
                        documentScrollWidth: document.documentElement.scrollWidth,
                        innerHeight: window.innerHeight,
                        bodyScrollHeight: document.body.scrollHeight,
                        title: document.title,
                    })""")
                    page.screenshot(path=str(screenshot), full_page=True)
                    record.update({
                        "status": response.status if response else None,
                        "metrics": metrics,
                        "horizontalOverflow": max(metrics["bodyScrollWidth"], metrics["documentScrollWidth"]) > metrics["innerWidth"] + 1,
                    })
                except Exception as error:
                    record["loadError"] = str(error)
                finally:
                    results.append(record)
                    page.close()
                    context.close()
        browser.close()
    report_path = root / "docs" / "responsive-audit-results.json"
    report_path.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
    failures = [
        r for r in results
        if r.get("loadError") or (r.get("status") or 0) >= 400 or r.get("horizontalOverflow") or r.get("consoleErrors")
    ]
    print(json.dumps({"total": len(results), "failures": failures, "reportPath": str(report_path)}, ensure_ascii=False, indent=2))
    raise SystemExit(1 if failures else 0)


if __name__ == "__main__":
    main()
