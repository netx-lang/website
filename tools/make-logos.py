#!/usr/bin/env python3
"""Generate the square NetX logo assets from the master SVG.

Master:  tools/logo-master.svg   (the original stacked logo: mark above wordmark)
Outputs:
  assets/logo.svg         the N/X monogram, wordmark removed, filling a 1:1 square
  assets/logo-mark.svg    same square monogram (also used as the favicon)

The master is left untouched, so this script can be re-run at any time.
"""

import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
MASTER = os.path.join(HERE, "logo-master.svg")
ASSETS = os.path.join(ROOT, "public", "assets")

# Final-space content bounds measured from the master logo (in its viewBox units).
MARK_IDS = ["path1", "path2", "path4", "path9"]   # bird + stylised N and X
WORD_IDS = ["path5", "path6", "path7", "path8"]   # the "NetX" wordmark
GROUP = 'transform="translate(-431.99999,-368.17478)"'

MARK_W, MARK_H = 831.6, 674.3
FULL_W, FULL_H = 831.6, 915.3

BIRD_IDS = ["path1"]                                  # just the bird
BIRD_X, BIRD_Y = 167.467, 0.475942                    # bird bbox in the master
BIRD_W, BIRD_H = 335.867, 342.738

NAVY = "#0f2b46"
BLUE = "#3c70b3"


def load_paths():
    with open(MASTER, encoding="utf-8") as f:
        src = f.read()
    paths = re.findall(r"<path[\s\S]*?/>", src)
    by_id = {}
    for p in paths:
        m = re.search(r'id="([^"]+)"', p)
        by_id[m.group(1)] = p
    return by_id


def svg(viewbox, body, size, extra=""):
    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="%s" '
        'width="%s" height="%s"%s>\n%s\n</svg>\n' % (viewbox, size, size, extra, body)
    )


def square_viewbox(w, h, pad_frac):
    """Return (viewbox, side) centring a w x h box in a square canvas."""
    pad = pad_frac * max(w, h)
    side = max(w, h) + 2 * pad
    x0 = -(side - w) / 2.0
    y0 = -(side - h) / 2.0
    return "%.2f %.2f %.2f %.2f" % (x0, y0, side, side), side


def themed(path, navy, blue):
    p = path.replace("fill:%s" % NAVY, "fill:%s" % navy)
    p = p.replace("fill:%s" % BLUE, "fill:%s" % blue)
    return p


# `themed` is kept for anyone who wants a recoloured mark (e.g. on dark tiles).


def build_square_mark(paths):
    """The N/X monogram (bird + N + X), wordmark removed, squeezed left-right into a square."""
    inner = "\n    ".join(paths[i] for i in MARK_IDS)
    sx = MARK_H / MARK_W  # horizontal compression so that width == height
    body = (
        '  <g transform="scale(%.6f,1)">\n'
        '    <g %s>\n      %s\n    </g>\n  </g>' % (sx, GROUP, inner)
    )
    vb, side = square_viewbox(MARK_W * sx, MARK_H, 0.0)
    return svg(vb, body, round(side))


def main():
    paths = load_paths()
    outputs = {
        "logo.svg": build_square_mark(paths),
        "logo-mark.svg": build_square_mark(paths),
    }
    for name, content in outputs.items():
        with open(os.path.join(ASSETS, name), "w", encoding="utf-8") as f:
            f.write(content)
        print("wrote", os.path.relpath(os.path.join(ASSETS, name), ROOT))


if __name__ == "__main__":
    main()
