# Project Updates & Pricing Smoke Test

Date: 2026-08-17

## Scope

Verified the project details vertical slice at `http://localhost:3004/projects` using the existing Arabic RTL design system and localStorage fallback.

## Checks

- Opened an existing project and confirmed the details card renders three tabs: نظرة عامة, التحديثات, التسعير والدفعات.
- Opened تبويب التحديثات and confirmed the empty state, kind selector, textarea, and shared Button controls.
- Added the Arabic update `تم الانتهاء من تصميم التدفق الأولي للمشروع.` and confirmed the tab counter changed to `(1)` and the timeline card rendered with kind and localized timestamp.
- Opened تبويب التسعير والدفعات and confirmed the empty state and payment form.
- Added a payment titled `الدفعة الأولى` for `15000 جنيه`, expected date `2026-08-25`, with notes. Confirmed the counter changed to `(1)` and the card rendered the Arabic-formatted amount and metadata.
- Changed the payment status to `تم التحصيل` and confirmed the status updated and the financial income suggestion appeared.
- Confirmed no raw HTML form controls were introduced; the UI uses shared Input, Select, Textarea, and Button components.

## Result

PASS for localStorage fallback and browser interaction. Production typecheck, ESLint, and Next.js build also passed before this document was written. The database migration remains intentionally unapplied because DATABASE_URL is unavailable and the repository journal mismatch is known.
