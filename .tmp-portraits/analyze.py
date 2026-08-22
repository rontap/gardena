import xml.etree.ElementTree as ET
from PIL import Image
from pathlib import Path

PAL = {
    (0x4A, 0x7C, 0x3F, 255): "grass",
    (0x3A, 0x62, 0x32, 255): "grass-dark",
    (0x8A, 0x5A, 0x32, 255): "dirt",
    (0x6B, 0x44, 0x23, 255): "dirt-dark",
    (0x3D, 0x7E, 0xA6, 255): "water",
    (0x6B, 0xC0, 0x4A, 255): "leaf",
    (0xD4, 0xA0, 0x17, 255): "ripe",
    (0xC4, 0x3C, 0x3C, 255): "fruit-red",
    (0x1C, 0x17, 0x10, 255): "ink",
    (0xCF, 0xC6, 0xB0, 255): "house",
    (0x8B, 0x3A, 0x2A, 255): "roof",
}


def parse_color(c):
    c = c.lstrip("#")
    return tuple(int(c[i : i + 2], 16) for i in (0, 2, 4)) + (255,)


def raster(path):
    tree = ET.parse(path)
    svg = tree.getroot()
    vb = svg.attrib["viewBox"].split()
    w, h = int(vb[2]), int(vb[3])
    img = Image.new("RGBA", (w, h), (255, 0, 255, 255))
    px = img.load()
    for el in svg.iter():
        tag = el.tag.split("}")[-1]
        if tag != "rect":
            continue
        fill = el.attrib.get("fill")
        if not fill or fill == "none":
            continue
        x = int(float(el.attrib["x"]))
        y = int(float(el.attrib["y"]))
        rw = int(float(el.attrib["width"]))
        rh = int(float(el.attrib["height"]))
        col = parse_color(fill)
        for yy in range(y, y + rh):
            for xx in range(x, x + rw):
                if 0 <= xx < w and 0 <= yy < h:
                    px[xx, yy] = col
    return img


def tok(c):
    return PAL.get(c, "#{0:02x}{1:02x}{2:02x}".format(*c[:3]))


root = Path(r"C:\Users\ronta\PycharmProjects\gardena\src\assets\skills")
out = Path(r"C:\Users\ronta\PycharmProjects\gardena\.tmp-portraits")

for name in ["portrait-player.svg", "portrait-husband.svg", "portrait-daughter.svg"]:
    img = raster(root / name)
    px = img.load()
    w, h = img.size
    lines = ["=" * 70, name]
    for y in range(h):
        row = [tok(px[x, y]) for x in range(w)]
        skin = [x for x in range(w) if row[x] == "house"]
        inkp = [x for x in range(w) if row[x] == "ink"]
        dirtp = [x for x in range(1, w - 1) if row[x] in ("dirt", "dirt-dark")]
        waterp = [x for x in range(w) if row[x] == "water"]
        roofp = [x for x in range(w) if row[x] == "roof"]
        ripep = [x for x in range(w) if row[x] == "ripe"]
        if not (skin or (20 in inkp or any(8 < x < 56 for x in inkp))):
            continue
        compact = []
        i = 0
        while i < w:
            j = i
            while j < w and row[j] == row[i]:
                j += 1
            compact.append("%s@%d:%d" % (row[i], i, j - 1))
            i = j
        lines.append(
            "y%02d %s"
            % (y, " ".join(c for c in compact if not c.startswith("#ff00ff")))
        )
    (out / (name.replace(".svg", ".txt"))).write_text("\n".join(lines), encoding="utf-8")
    print("wrote", name)
