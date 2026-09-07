from pathlib import Path

INK = '#1c1710'
RIPE = '#d4a017'
HOUSE = '#cfc6b0'
WATER = '#3d7ea6'
LEAF = '#6bc04a'
DIRT = '#8a5a32'
DIRT_DARK = '#6b4423'
FRUIT_RED = '#c43c3c'

STEM_DX = -2

BODY = [(2, y, y) for y in range(2, 14)] + [
    (2, 14, 8),
    (2, 15, 6),
    (2, 16, 4),
    (2, 17, 2),
]
STEM = [
    (7, 13, 4),
    (8, 14, 4),
    (9, 15, 4),
    (9, 16, 4),
    (10, 17, 4),
    (11, 18, 4),
    (11, 19, 4),
    (12, 20, 4),
    (13, 21, 3),
]


def merge(spans: list[tuple[int, int, int]]) -> list[tuple[int, int, int]]:
    by_y: dict[int, list[tuple[int, int]]] = {}
    for x, y, w in spans:
        by_y.setdefault(y, []).append((x, x + w))
    out: list[tuple[int, int, int]] = []
    for y in sorted(by_y):
        segs = sorted(by_y[y])
        a, b = segs[0]
        for s, e in segs[1:]:
            if s <= b:
                b = max(b, e)
                continue
            out.append((a, y, b - a))
            a, b = s, e
        out.append((a, y, b - a))
    return out


def ink_spans() -> list[tuple[int, int, int]]:
    stem = [(x + STEM_DX, y, w) for x, y, w in STEM]
    return merge(BODY + stem)


def inset(spans: list[tuple[int, int, int]]) -> list[tuple[int, int, int]]:
    return [(x + 1, y, w - 2) for x, y, w in spans if w >= 3]


def rects(fill: str, spans: list[tuple[int, int, int]]) -> list[str]:
    return [f'<rect fill="{fill}" x="{x}" y="{y}" width="{w}" height="1"/>' for x, y, w in spans if w > 0]


def rim_house(spans: list[tuple[int, int, int]], rim: str) -> list[str]:
    out: list[str] = []
    for x, y, w in spans:
        if w <= 2:
            out.extend(rects(rim, [(x, y, w)]))
            continue
        out.extend(rects(rim, [(x, y, 1), (x + w - 1, y, 1)]))
        out.extend(rects(HOUSE, [(x + 1, y, w - 2)]))
    return out


def split_fill(spans: list[tuple[int, int, int]]) -> list[str]:
    out: list[str] = []
    for x, y, w in spans:
        mid = x + (w + 1) // 2
        out.extend(rects(FRUIT_RED, [(x, y, mid - x)]))
        out.extend(rects(WATER, [(mid, y, x + w - mid)]))
    return out


def group(gid: str, lines: list[str]) -> str:
    inner = '\n    '.join(lines)
    return f'  <g id="{gid}">\n    {inner}\n  </g>'


def pointer(gid: str, paint: str) -> str:
    ink = ink_spans()
    fill = inset(ink)
    if paint == 'wire':
        body = rects(INK, ink) + split_fill(fill)
    elif paint == 'tune':
        body = rects(INK, ink) + rects(HOUSE, fill) + rects(RIPE, [(x, y, 1) for x, y, w in fill if w > 0])
    else:
        rim = {'walk': RIPE, 'water': WATER, 'gather': LEAF}[paint]
        body = rects(INK, ink) + rim_house(fill, rim)
    return group(gid, body)


def dig() -> str:
    ink = merge(
        [
            (2, 2, 3),
            (2, 3, 5),
            (3, 4, 6),
            (4, 5, 6),
            (6, 6, 5),
            (2, 6, 3),
            (2, 7, 4),
            (2, 8, 3),
            (2, 9, 2),
            (9, 7, 3),
            (10, 8, 3),
            (11, 9, 3),
            (11, 10, 3),
            (12, 11, 3),
            (12, 12, 3),
            (13, 13, 3),
            (13, 14, 3),
            (14, 15, 3),
            (14, 16, 2),
            (15, 17, 2),
            (15, 18, 2),
            (16, 19, 1),
        ]
    )
    head = [
        (3, 3, 3),
        (4, 4, 4),
        (5, 5, 4),
        (7, 6, 3),
        (3, 6, 1),
        (3, 7, 2),
        (3, 8, 1),
    ]
    dark = [(6, 5, 2), (8, 6, 2), (3, 8, 1)]
    handle = [
        (10, 8, 1),
        (12, 9, 1),
        (12, 10, 1),
        (13, 11, 1),
        (13, 12, 1),
        (14, 13, 1),
        (14, 14, 1),
        (15, 15, 1),
        (15, 16, 1),
        (16, 17, 1),
        (16, 18, 1),
    ]
    edge = [(3, 3, 2), (4, 4, 1)]
    lines = rects(INK, ink) + rects(DIRT, head) + rects(DIRT_DARK, dark) + rects(HOUSE, handle) + rects(HOUSE, edge)
    return group('dig', lines)


def main() -> None:
    svg = '\n'.join(
        [
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" shape-rendering="crispEdges">',
            pointer('walk', 'walk'),
            dig(),
            pointer('water', 'water'),
            pointer('gather', 'gather'),
            pointer('tune', 'tune'),
            pointer('wire', 'wire'),
            '</svg>',
            '',
        ]
    )
    dest = Path(__file__).resolve().parents[1] / 'src' / 'assets' / 'ui' / 'ui-cursor.svg'
    dest.write_text(svg, encoding='utf-8')


if __name__ == '__main__':
    main()
