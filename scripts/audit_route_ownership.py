#!/usr/bin/env python3
"""Static ownership audit for Personal Command Center route handlers.

This is a heuristic audit, not a replacement for runtime authorization tests.
It reports route files that do not visibly resolve the current session user and
CRUD handlers whose Drizzle queries do not visibly mention user ownership.
"""
from __future__ import annotations

from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
ROUTES = sorted((ROOT / "app" / "api").rglob("route.ts"))

AUTH_RE = re.compile(r"getCurrentUser\s*\(")
USER_RE = re.compile(r"(?:currentUser|user|userId)\s*(?:\.id|:)")
DRIZZLE_RE = re.compile(r"\.(?:select|insert|update|delete|query)\s*\(")
PUBLIC_ALLOWLIST = {"auth/[...all]/route.ts", "religious/quran/route.ts", "religious/reciters/route.ts", "religious/timings/route.ts"}

missing_auth: list[str] = []
missing_ownership: list[str] = []
summary: list[tuple[str, bool, bool]] = []

for path in ROUTES:
    rel = path.relative_to(ROOT).as_posix()
    body = path.read_text(encoding="utf-8")
    has_auth = bool(AUTH_RE.search(body))
    has_user = bool(USER_RE.search(body))
    has_db = bool(DRIZZLE_RE.search(body))
    is_public_exception = rel.removeprefix("app/api/") in PUBLIC_ALLOWLIST
    if has_db and not has_auth and not is_public_exception:
        missing_auth.append(rel)
    if has_db and has_auth and not has_user:
        missing_ownership.append(rel)
    summary.append((rel, has_auth, has_user))

print(f"route_count={len(ROUTES)}")
print(f"routes_with_session={sum(has_auth for _, has_auth, _ in summary)}")
print(f"routes_with_visible_ownership={sum(has_user for _, _, has_user in summary)}")
print("missing_session_routes:")
for item in missing_auth:
    print(f"- {item}")
print("missing_visible_ownership_routes:")
for item in missing_ownership:
    print(f"- {item}")

if missing_auth or missing_ownership:
    raise SystemExit(1)
print("ownership_audit=PASS")
