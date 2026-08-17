from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost:3004"
ROUTES = ["/", "/daily-plan", "/tasks", "/notes", "/habits", "/projects", "/goals", "/journal", "/money", "/entertainment", "/religious", "/account", "/board", "/review"]

with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True, executable_path="/usr/bin/chromium", args=["--no-sandbox"])
    context = browser.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=1)
    for route in ROUTES:
        page = context.new_page()
        try:
            page.goto(f"{BASE_URL}{route}", wait_until="domcontentloaded", timeout=15000)
            page.wait_for_timeout(1000)
            rows = page.evaluate("""() => {
                const width = window.innerWidth;
                return [...document.querySelectorAll('body *')].map((element) => {
                    const rect = element.getBoundingClientRect();
                    const overflow = rect.right > width + 1 || rect.left < -1;
                    return overflow ? {
                        tag: element.tagName,
                        className: typeof element.className === 'string' ? element.className.slice(0, 220) : '',
                        left: Math.round(rect.left), right: Math.round(rect.right), width: Math.round(rect.width),
                        text: (element.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 90)
                    } : null;
                }).filter(Boolean).sort((a, b) => (b.right - width) - (a.right - width)).slice(0, 12);
            }""")
            metrics = page.evaluate("() => ({scrollWidth: document.documentElement.scrollWidth, width: window.innerWidth})")
            print(f"ROUTE {route} metrics={metrics}")
            for row in rows:
                print("  ", row)
        except Exception as error:
            print(f"ROUTE {route} ERROR {error}")
        finally:
            page.close()
    context.close()
    browser.close()
