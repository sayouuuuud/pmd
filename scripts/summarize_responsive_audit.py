import json
from collections import Counter, defaultdict

report_path = "docs/responsive-audit-results.json"
with open(report_path, encoding="utf-8") as handle:
    rows = json.load(handle)

print(f"total={len(rows)}")
print(f"load_failures={sum(1 for row in rows if row.get('loadError'))}")
print(f"horizontal_overflow={sum(1 for row in rows if row.get('horizontalOverflow'))}")
status_counts = Counter(row.get("status") for row in rows)
print("status_counts=" + ", ".join(f"{key}:{value}" for key, value in sorted(status_counts.items(), key=lambda item: str(item[0]))))
console_by_route = defaultdict(Counter)
for row in rows:
    for message in row.get("consoleErrors", []):
        if "401" in message:
            console_by_route[row["route"]]["401"] += 1
        elif "503" in message:
            console_by_route[row["route"]]["503"] += 1
        else:
            console_by_route[row["route"]]["other"] += 1
print("console_error_routes:")
for route in sorted(console_by_route):
    print(f"  {route}: {dict(console_by_route[route])}")
print("overflow_routes:")
for row in rows:
    if row.get("horizontalOverflow"):
        print(f"  {row['viewport']} {row['route']} {row['metrics']}")
print("load_error_routes:")
for row in rows:
    if row.get("loadError"):
        print(f"  {row['viewport']} {row['route']}: {row['loadError']}")
