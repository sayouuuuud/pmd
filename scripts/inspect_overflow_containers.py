from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost:3004"
ROUTES = ["/daily-plan", "/tasks"]

with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True, executable_path="/usr/bin/chromium", args=["--no-sandbox"])
    context = browser.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=1)
    for route in ROUTES:
        page = context.new_page()
        page.goto(f"{BASE_URL}{route}", wait_until="domcontentloaded", timeout=15000)
        page.wait_for_timeout(1000)
        data = page.evaluate("""() => {
            const rows = [];
            for (const element of document.querySelectorAll('body *')) {
                const style = getComputedStyle(element);
                const rect = element.getBoundingClientRect();
                const overflow = element.scrollWidth > element.clientWidth + 1 || rect.left < -1 || rect.right > innerWidth + 1;
                if (overflow && element.clientWidth > 0) {
                    rows.push({tag: element.tagName, id: element.id, className: typeof element.className === 'string' ? element.className.slice(0, 260) : '', left: Math.round(rect.left), right: Math.round(rect.right), clientWidth: element.clientWidth, scrollWidth: element.scrollWidth, overflowX: style.overflowX, text: (element.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 100)});
                }
            }
            return rows.sort((a,b) => (b.scrollWidth - b.clientWidth) - (a.scrollWidth - a.clientWidth)).slice(0, 30);
        }""")
        print(f"ROUTE {route}")
        for row in data:
            print(row)
        page.close()
    context.close()
    browser.close()
