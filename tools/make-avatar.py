#!/usr/bin/env python3
"""Generate a circular-safe avatar from the site logo.

Most services (GitHub included) show an avatar as a square image masked to a
circle, so whatever sits in the corners of that square is cut away. The site
logo is deliberately a "complete square" — the N/X mark touches the edges — so a
circular mask clips its tips and it looks broken.

This writes a padded variant where the artwork occupies `SIDE_RATIO` of the
canvas (0.68 keeps the whole bounding box inside the inscribed circle) plus a
1024x1024 PNG, because GitHub does not accept SVG avatars.

Usage:
    python3 tools/make-avatar.py            # 68% artwork, white background PNG
    python3 tools/make-avatar.py --ratio 0.62 --background none
"""

from __future__ import annotations

import argparse
import re
import subprocess
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
ASSETS = ROOT / "public" / "assets"
SOURCE = ASSETS / "logo.svg"


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--ratio", type=float, default=0.68,
                        help="share of the canvas the artwork should cover (default 0.68)")
    parser.add_argument("--size", type=int, default=1024, help="PNG edge length")
    parser.add_argument("--background", default="#ffffff",
                        help="PNG background colour, or 'none' for transparency")
    args = parser.parse_args()

    src = SOURCE.read_text(encoding="utf-8")
    match = re.search(r'viewBox="([-\d.]+) ([-\d.]+) ([\d.]+) ([\d.]+)"', src)
    if not match:
        raise SystemExit(f"error: no viewBox in {SOURCE}")
    x, y, w, h = (float(g) for g in match.groups())

    # Inset by growing the viewBox instead of scaling the geometry: the artwork
    # stays byte-identical to the site logo, only the frame gets bigger.
    side = max(w, h) / args.ratio
    x0 = x - (side - w) / 2
    y0 = y - (side - h) / 2
    padded_vb = f"{x0:.2f} {y0:.2f} {side:.2f} {side:.2f}"

    out_svg = ASSETS / "logo-avatar.svg"
    out_svg.write_text(
        re.sub(r'viewBox="[^"]*"', f'viewBox="{padded_vb}"', src, count=1),
        encoding="utf-8",
    )
    print(f"wrote {out_svg.relative_to(ROOT)}  (viewBox {padded_vb}, artwork {args.ratio:.0%})")

    out_png = ASSETS / "logo-avatar.png"
    cmd = [
        "inkscape", str(out_svg),
        "-w", str(args.size), "-h", str(args.size),
        "-o", str(out_png),
    ]
    if args.background.lower() != "none":
        cmd += ["--export-background=" + args.background, "--export-background-opacity=255"]
    subprocess.run(cmd, check=True, capture_output=True)
    print(f"wrote {out_png.relative_to(ROOT)}  ({args.size}x{args.size}, background {args.background})")


if __name__ == "__main__":
    main()
