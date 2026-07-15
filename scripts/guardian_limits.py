#!/usr/bin/env python3

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

MAX_FILE_LINES = 500
MAX_FUNCTION_LINES = 50
IGNORE_PARTS = {".git", ".next", "node_modules", "coverage", "dist", "build", "out"}
SOURCE_SUFFIXES = {".js", ".jsx", ".ts", ".tsx"}
FUNC_PATTERNS = [
    re.compile(r"^\s*function\s+\w+\s*\("),
    re.compile(r"^\s*(?:export\s+)?(?:async\s+)?function\s+\w+\s*\("),
    re.compile(r"^\s*(?:export\s+)?const\s+\w+\s*=\s*(?:async\s*)?\([^)]*\)\s*=>\s*\{"),
    re.compile(r"^\s*(?:export\s+)?const\s+\w+\s*=\s*(?:async\s*)?[A-Za-z0-9_]+\s*=>\s*\{"),
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Guard frontend file and function size limits.")
    parser.add_argument("roots", nargs="+", help="Directories to scan")
    return parser.parse_args()


def should_skip(path: Path) -> bool:
    return any(part in IGNORE_PARTS for part in path.parts)


def iter_source_files(root: Path) -> list[Path]:
    files: list[Path] = []
    for path in sorted(root.rglob("*")):
        if path.is_file() and path.suffix in SOURCE_SUFFIXES and not should_skip(path):
            files.append(path)
    return files


def count_file_lines(path: Path) -> int:
    return sum(1 for _ in path.open("r", encoding="utf-8"))


def matching_pattern(line: str) -> bool:
    return any(pattern.search(line) for pattern in FUNC_PATTERNS)


def function_spans(path: Path) -> list[tuple[str, int, int]]:
    lines = path.read_text(encoding="utf-8").splitlines()
    spans: list[tuple[str, int, int]] = []
    start_line = 0
    brace_depth = 0
    name = ""
    in_function = False

    for index, line in enumerate(lines, start=1):
        if not in_function and matching_pattern(line):
            in_function = True
            start_line = index
            brace_depth = line.count("{") - line.count("}")
            name = line.strip()[:80]
            if brace_depth <= 0:
                spans.append((name, start_line, 1))
                in_function = False
            continue
        if in_function:
            brace_depth += line.count("{") - line.count("}")
            if brace_depth <= 0:
                spans.append((name, start_line, index - start_line + 1))
                in_function = False
    return spans


def file_violations(path: Path) -> list[str]:
    violations: list[str] = []
    line_count = count_file_lines(path)
    if line_count > MAX_FILE_LINES:
        violations.append(f"{path}: file has {line_count} lines (max {MAX_FILE_LINES})")

    for name, start, size in function_spans(path):
        if size > MAX_FUNCTION_LINES:
            violations.append(
                f"{path}:{start}: function '{name}' has {size} lines (max {MAX_FUNCTION_LINES})",
            )
    return violations


def main() -> int:
    args = parse_args()
    violations: list[str] = []
    for root_arg in args.roots:
        root = Path(root_arg).resolve()
        for path in iter_source_files(root):
            violations.extend(file_violations(path))

    if violations:
        print("Frontend guardian limits failed:")
        for violation in violations:
            print(f"  - {violation}")
        return 1

    print("Frontend guardian limits passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
