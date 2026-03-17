#!/usr/bin/env python3
"""
Clean Tailwind Plus HTML files into individual block snippets.

Handles two input formats:
  1. Clean code paste — blocks are already top-level HTML elements
  2. Raw page source — blocks are HTML-encoded inside srcdoc iframe attributes

Usage:
  python3 scripts/clean-tailwind-blocks.py themes/tailwind/features.html
  python3 scripts/clean-tailwind-blocks.py themes/tailwind/*.html
  python3 scripts/clean-tailwind-blocks.py themes/tailwind/heroes.html --remove-headers
"""

import re
import html
import sys
import argparse
from pathlib import Path


def extract_from_srcdoc(content: str) -> list[str]:
    """Extract blocks from srcdoc iframe attributes (raw page source format)."""
    matches = re.findall(r'srcdoc="(.*?)"(?:\s|>)', content, re.DOTALL)
    blocks = []
    for m in matches:
        decoded = html.unescape(m)
        body = re.search(r'<body>(.*?)(?:</body>|$)', decoded, re.DOTALL)
        if body:
            block = body.group(1).strip()
            if block:
                blocks.append(block)
    return blocks


def extract_top_level_elements(content: str) -> list[str]:
    """Extract top-level HTML elements by tracking tag nesting depth."""
    blocks = []
    i = 0
    content = content.strip()

    while i < len(content):
        # Skip whitespace between blocks
        while i < len(content) and content[i] in ' \t\n\r':
            i += 1
        if i >= len(content):
            break

        # Expect a tag opening
        if content[i] != '<':
            i += 1
            continue

        # Find the tag name
        tag_match = re.match(r'<(\w+)', content[i:])
        if not tag_match:
            i += 1
            continue

        tag_name = tag_match.group(1)
        start = i
        depth = 0

        # Track open/close of this tag type to find the matching close
        j = i
        while j < len(content):
            # Find next tag
            next_tag = re.search(r'<(/?)(' + tag_name + r')[\s>]', content[j:])
            if not next_tag:
                # No more tags — take rest as final block
                j = len(content)
                break

            pos = j + next_tag.start()
            is_close = next_tag.group(1) == '/'

            if is_close:
                depth -= 1
                if depth == 0:
                    # Find the end of this closing tag
                    end = content.find('>', pos) + 1
                    blocks.append(content[start:end])
                    i = end
                    break
            else:
                # Check for self-closing
                tag_end = content.find('>', pos)
                if tag_end != -1 and content[tag_end - 1] == '/':
                    if depth == 0:
                        blocks.append(content[start:tag_end + 1])
                        i = tag_end + 1
                        break
                else:
                    depth += 1

            j = pos + 1
        else:
            # Reached end without closing — take what we have
            if start < len(content):
                blocks.append(content[start:])
            break

        if depth != 0:
            # Unmatched — skip forward
            i = j
            break

    return blocks


def remove_headers(block_html: str) -> str:
    """Remove <header>...</header> elements from a block."""
    return re.sub(r'\s*<header[^>]*>.*?</header>\s*', '\n', block_html, flags=re.DOTALL)


def is_srcdoc_format(content: str) -> bool:
    """Detect if the file is a raw Tailwind Plus page source."""
    return 'srcdoc="' in content[:50000]


def clean_file(filepath: Path, remove_hdrs: bool = False, dark_only: bool = False) -> int:
    content = filepath.read_text()
    original_size = len(content)

    # Detect format and extract
    if is_srcdoc_format(content):
        blocks = extract_from_srcdoc(content)
        fmt = "srcdoc"
    else:
        blocks = extract_top_level_elements(content)
        fmt = "top-level"

    if not blocks:
        print(f"  {filepath.name}: no blocks found")
        return 0

    # Optional: filter to dark variants only
    if dark_only:
        blocks = [b for b in blocks if 'bg-gray-900' in b[:400] or 'bg-gray-950' in b[:400]]

    # Optional: remove header elements
    if remove_hdrs:
        blocks = [remove_headers(b) for b in blocks]

    # Write clean output
    output = '\n\n'.join(blocks) + '\n'
    filepath.write_text(output)

    print(f"  {filepath.name}: {len(blocks)} blocks extracted ({fmt} format, {original_size:,} -> {len(output):,} bytes)")
    return len(blocks)


def main():
    parser = argparse.ArgumentParser(description='Clean Tailwind Plus HTML into block snippets')
    parser.add_argument('files', nargs='+', help='HTML files to clean')
    parser.add_argument('--remove-headers', action='store_true', help='Remove <header> elements from blocks')
    parser.add_argument('--dark-only', action='store_true', help='Keep only dark variant blocks')
    args = parser.parse_args()

    total = 0
    for f in args.files:
        p = Path(f)
        if not p.exists():
            print(f"  {f}: not found, skipping")
            continue
        total += clean_file(p, args.remove_headers, args.dark_only)

    print(f"\nDone: {total} blocks total")


if __name__ == '__main__':
    main()
