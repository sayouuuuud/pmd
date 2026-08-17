from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
PATTERN = re.compile(r"\b(?:bg|text|border|ring|from|to|via)-(?:white|black|gray-\d+|slate-\d+|neutral-\d+|red-\d+|blue-\d+|green-\d+|yellow-\d+|purple-\d+|pink-\d+)\b")
EXTENSIONS = {".ts", ".tsx", ".css", ".mjs"}
SKIP = {"node_modules", ".next", ".git"}

for path in sorted(ROOT.rglob("*")):
    if not path.is_file() or path.suffix not in EXTENSIONS or any(part in SKIP for part in path.parts):
        continue
    try:
        lines = path.read_text(encoding="utf-8").splitlines()
    except UnicodeDecodeError:
        continue
    for number, line in enumerate(lines, 1):
        matches = PATTERN.findall(line)
        if matches:
            print(f"{path.relative_to(ROOT)}:{number}: {', '.join(sorted(set(matches)))}")
