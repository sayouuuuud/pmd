import json
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost:3004"
ROUTES = [
    "/", "/daily-plan", "/tasks", "/notes", "/habits", "/projects", "/goals",
    "/journal", "/money", "/entertainment", "/religious", "/account", "/board",
    "/reminders", "/review", "/login", "/onboarding",
]
VIEWPORTS = [("mobile", 390, 844), ("tablet", 768, 1024)]


def main():
    root = Path.cwd()
    results = []
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True, executable_path="/usr/bin/chromium", args=["--no-sandbox"])
        for viewport_name, width, height in VIEWPORTS:
            context = browser.new_context(viewport={"width": width, "height": height})
            for route in ROUTES:
                page = context.new_page()
                console_errors = []
                page.on("pageerror", lambda error: console_errors.append(error.message))
                try:
                    response = page.goto(f"{BASE_URL}{route}", wait_until="domcontentloaded", timeout=20000)
                    page.wait_for_timeout(700)
                    audit = page.evaluate("""() => {
                      const nameOf = (element) => {
                        const aria = element.getAttribute('aria-label');
                        const labelledBy = element.getAttribute('aria-labelledby');
                        const title = element.getAttribute('title');
                        const text = element.textContent?.replace(/\\s+/g, ' ').trim();
                        const placeholder = element.getAttribute('placeholder');
                        const id = element.getAttribute('id');
                        const associatedLabel = id ? document.querySelector(`label[for="${CSS.escape(id)}"]`)?.textContent?.replace(/\\s+/g, ' ').trim() : element.closest('label')?.textContent?.replace(/\\s+/g, ' ').trim();
                        if (aria?.trim()) return aria.trim();
                        if (labelledBy) {
                          const labels = labelledBy.split(/\\s+/).map((id) => document.getElementById(id)?.textContent?.trim()).filter(Boolean);
                          if (labels.length) return labels.join(' ');
                        }
                        if (title?.trim()) return title.trim();
                        if (associatedLabel) return associatedLabel;
                        if (text) return text;
                        if (placeholder?.trim()) return placeholder.trim();
                        return '';
                      };
                      const interactive = [...document.querySelectorAll('button, a[href], input, select, textarea')];
                      const unnamed = interactive.filter((element) => {
                        if (element instanceof HTMLInputElement && ['hidden', 'submit', 'button', 'reset'].includes(element.type)) return !nameOf(element);
                        return !nameOf(element);
                      }).map((element) => ({ tag: element.tagName.toLowerCase(), type: element.getAttribute('type'), html: element.outerHTML.slice(0, 180) }));
                      const unlabeledFields = [...document.querySelectorAll('input:not([type="hidden"]), select, textarea')].filter((element) => {
                        const id = element.getAttribute('id');
                        const hasLabel = Boolean(id && document.querySelector(`label[for="${CSS.escape(id)}"]`)) || Boolean(element.closest('label'));
                        return !hasLabel && !element.getAttribute('aria-label') && !element.getAttribute('aria-labelledby');
                      }).map((element) => ({ tag: element.tagName.toLowerCase(), type: element.getAttribute('type'), name: element.getAttribute('name'), html: element.outerHTML.slice(0, 180) }));
                      return {
                        lang: document.documentElement.lang,
                        dir: document.documentElement.dir,
                        interactiveCount: interactive.length,
                        unnamed,
                        unlabeledFields,
                      };
                    }""")
                    results.append({"viewport": viewport_name, "route": route, "status": response.status if response else None, "consoleErrors": console_errors, **audit})
                except Exception as error:
                    results.append({"viewport": viewport_name, "route": route, "loadError": str(error), "consoleErrors": console_errors})
                finally:
                    page.close()
            context.close()
        browser.close()
    report = root / "docs" / "accessibility-audit-results.json"
    report.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
    failures = [r for r in results if r.get("loadError") or r.get("consoleErrors") or r.get("status", 0) >= 400 or r.get("lang") != "ar" or r.get("dir") != "rtl" or r.get("unnamed") or r.get("unlabeledFields")]
    print(json.dumps({"total": len(results), "failures": len(failures), "reportPath": str(report), "failureSummary": [{"viewport": r.get("viewport"), "route": r.get("route"), "unnamed": len(r.get("unnamed", [])), "unlabeledFields": len(r.get("unlabeledFields", [])), "consoleErrors": len(r.get("consoleErrors", [])), "loadError": r.get("loadError")} for r in failures]}, ensure_ascii=False, indent=2))
    raise SystemExit(1 if failures else 0)


if __name__ == "__main__":
    main()
