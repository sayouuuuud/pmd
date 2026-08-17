import json
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE_URL = 'http://localhost:3004'
ROUTES = ['/', '/daily-plan', '/tasks', '/notes', '/habits', '/projects', '/goals', '/journal', '/money', '/religious', '/review']


def main():
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox'])
        results = []
        for route in ROUTES:
            context = browser.new_context(viewport={'width': 390, 'height': 844})
            page = context.new_page()
            errors = []
            page.on('pageerror', lambda error: errors.append(error.message))
            try:
                response = page.goto(BASE_URL + route, wait_until='domcontentloaded', timeout=20000)
                page.wait_for_timeout(2500)
                results.append({'route': route, 'status': response.status if response else None, 'errors': errors})
            except Exception as error:
                results.append({'route': route, 'status': None, 'errors': errors, 'loadError': str(error)})
            finally:
                page.close()
                context.close()
        browser.close()
    output = Path('verification/hydration-isolated-audit-20260817T2224Z.json')
    output.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps(results, ensure_ascii=False, indent=2))
    raise SystemExit(1 if any(item.get('errors') or item.get('loadError') for item in results) else 0)


if __name__ == '__main__':
    main()
