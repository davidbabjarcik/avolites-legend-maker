"""Vygeneruje ikony appky (mriežka farebných legiend). Spustenie: python tools/make_icons.py"""
from pathlib import Path
from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parent.parent / "icons"
COLORS = ["#ff1a1a", "#0040ff", "#ffb000", "#118a7e", "#7d3cc8", "#e67e22", "#2e8b3a", "#ffffff", "#36a3ff"]


def icon(size, maskable=False):
    img = Image.new("RGB", (size, size), "#14171c")
    d = ImageDraw.Draw(img)
    inset = size * (0.2 if maskable else 0.14)
    grid = size - 2 * inset
    gap = grid * 0.06
    cell = (grid - 2 * gap) / 3
    for i, c in enumerate(COLORS):
        x = inset + (i % 3) * (cell + gap)
        y = inset + (i // 3) * (cell + gap)
        d.rounded_rectangle([x, y, x + cell, y + cell], radius=cell * 0.14, fill=c)
    if not maskable:
        # zaoblené rohy pre bežnú ikonu
        mask = Image.new("L", (size, size), 0)
        ImageDraw.Draw(mask).rounded_rectangle([0, 0, size - 1, size - 1], radius=size * 0.2, fill=255)
        rgba = img.convert("RGBA")
        rgba.putalpha(mask)
        return rgba
    return img


OUT.mkdir(exist_ok=True)
icon(192).save(OUT / "icon-192.png")
icon(512).save(OUT / "icon-512.png")
icon(512, maskable=True).save(OUT / "icon-maskable-512.png")
icon(180, maskable=True).save(OUT / "apple-touch-icon.png")
print("ikony hotové:", OUT)
