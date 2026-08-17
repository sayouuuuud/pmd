# Projects / Pricing / Finance browser verification — 2026-08-17T21:31Z

- Opened `/projects` on `localhost:3004` in the existing Arabic RTL dark theme.
- Opened the project details for «منصة التحكم الشخصي» and selected «التسعير والدفعات».
- Added a local fallback test payment titled «اختبار fallback محلي» with amount `321` جنيه, expected date `2026-08-30`, and status «متوقعة».
- Clicked «تم التحصيل وربطه».
- Confirmed the payment changed to «تم التحصيل» and the UI displayed the locally preserved income and temporary-link message: «الدخل محفوظ محليًا، لكن المزامنة لم تكتمل. يمكنك إعادة المحاولة دون إنشاء سجل محلي مكرر.»
- Confirmed a «إعادة المزامنة» action is visible and the page remained responsive with no runtime error shown.
- The database/session path was not exercised because this environment has no configured database session; the test intentionally validates the local-first fallback boundary.

## Build status

- TypeScript: PASS.
- ESLint: PASS with the existing non-blocking `react-hooks/exhaustive-deps` warning in `components/workspace/workspace-workspace.tsx`.
- `next build --webpack`: PASS.
- Existing Next middleware deprecation and Edge Runtime warnings remain informational and unrelated to this change.

## Scope boundary

The endpoint `/api/projects/pricing/[pricingId]/collect` remains the authoritative database path. The local store now creates the local income and temporary link before attempting synchronization, then reconciles the temporary record with the remote response when available. No `drizzle-kit generate` was run.

---

## 2026-08-17T21:32Z follow-up

After the browser click and the development recompilation completed, the payment remained visible as «تم التحصيل» with the local-income/sync-pending message. This confirms the optimistic local state survives recompilation and remains available for retry without a second local income entry being created by the collect action.


## Backend smoke check — 2026-08-17T21:34Z

With the development server available on `localhost:3004`, an unauthenticated `POST /api/projects/pricing/test-pricing-id/collect` returned `HTTP 401 Unauthorized` with the standard JSON response headers. The page `/projects` returned `HTTP 200`. This confirms the route is not callable without a Better Auth session; the database mutation path still requires an authenticated database-backed test.
