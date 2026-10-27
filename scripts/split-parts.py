# Вырезает детали с листа концептов устройства по их контуру, а не прямоугольником,
# чтобы в PNG детали не попадали куски соседних.
#   python scripts/split-parts.py remote
# Читает assets/devices/<device>/parts.json (имя + примерная рамка каждой детали),
# пишет assets/devices/<device>/parts/<имя>.png и дополняет parts.json точным положением (x, y).
import json, sys
from collections import deque
from pathlib import Path
from PIL import Image, ImageFilter

CORE_ALPHA = 235  # непрозрачное «тело» детали; полупрозрачное свечение вокруг деталей их не связывает
EDGE_GROW = 3     # пикселей вокруг тела, чтобы сохранить сглаженный край

device = Path(__file__).resolve().parent.parent / 'assets' / 'devices' / sys.argv[1]
cfg = json.loads((device / 'parts.json').read_text(encoding='utf-8'))
sheet = Image.open(device / 'concept-states.png').convert('RGBA')
W, H = sheet.size
core = sheet.getchannel('A').point(lambda v: 255 if v > CORE_ALPHA else 0)
cpx = core.load()

def component_mask(box):
    """Маска всех непрозрачных компонент, центр которых лежит внутри рамки детали."""
    x0, y0, x1, y1 = box
    mask = Image.new('L', (W, H), 0); mpx = mask.load()
    seen = set()
    for y in range(y0, y1):
        for x in range(x0, x1):
            if not cpx[x, y] or (x, y) in seen:
                continue
            pts = []; q = deque([(x, y)]); seen.add((x, y))
            while q:
                cx, cy = q.popleft(); pts.append((cx, cy))
                for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                    if 0 <= nx < W and 0 <= ny < H and cpx[nx, ny] and (nx, ny) not in seen:
                        seen.add((nx, ny)); q.append((nx, ny))
            mx = sum(p[0] for p in pts) / len(pts); my = sum(p[1] for p in pts) / len(pts)
            if x0 <= mx < x1 and y0 <= my < y1:
                for p in pts: mpx[p] = 255
    return mask.filter(ImageFilter.MaxFilter(EDGE_GROW * 2 + 1))

out = device / 'parts'; out.mkdir(exist_ok=True)
for part in cfg['parts']:
    mask = component_mask(part['box'])
    piece = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    piece.paste(sheet, (0, 0), mask)
    bbox = piece.getbbox()
    piece.crop(bbox).save(out / f"{part['name']}.png", optimize=True)
    part['x'], part['y'] = bbox[0], bbox[1]
    print(part['name'], bbox)
(device / 'parts.json').write_text(json.dumps(cfg, ensure_ascii=False, indent=1), encoding='utf-8')
