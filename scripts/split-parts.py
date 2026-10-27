# Вырезает детали с листа концептов устройства по их контуру, а не прямоугольником,
# чтобы в PNG детали не попадали куски соседних.
#   python scripts/split-parts.py remote
# Читает assets/devices/<device>/parts.json (имя + примерная рамка каждой детали),
# пишет assets/devices/<device>/parts/<имя>.png и дополняет parts.json точным положением (x, y).
# Если parts.json нет, размечает лист сам: первый столбец — view-closed, второй — view-open,
# последний — view-repaired, а каждая отдельная деталь между ними — part-NN (потом их можно переименовать).
import json, sys
from collections import deque
from pathlib import Path
from PIL import Image, ImageFilter

CORE_ALPHA = 235  # непрозрачное «тело» детали; полупрозрачное свечение вокруг деталей их не связывает
EDGE_GROW = 3     # пикселей вокруг тела, чтобы сохранить сглаженный край
MIN_COLUMN = 8    # столбец уже 8 px — это шум между видами, а не вид
MIN_PART = 60     # детали меньше 60 непрозрачных пикселей — крошки, а не детали

device = Path(__file__).resolve().parent.parent / 'assets' / 'devices' / sys.argv[1]
sheet = Image.open(device / 'concept-states.png').convert('RGBA')
W, H = sheet.size
core = sheet.getchannel('A').point(lambda v: 255 if v > CORE_ALPHA else 0)
cpx = core.load()

def components(x0, x1):
    """Связные непрозрачные области, лежащие в полосе x0..x1: (рамка, площадь)."""
    seen = bytearray(W * H); found = []
    for y in range(H):
        for x in range(x0, x1):
            if not cpx[x, y] or seen[y * W + x]:
                continue
            q = deque([(x, y)]); seen[y * W + x] = 1; bx0 = bx1 = x; by0 = by1 = y; n = 0
            while q:
                cx, cy = q.popleft(); n += 1
                bx0 = min(bx0, cx); bx1 = max(bx1, cx); by0 = min(by0, cy); by1 = max(by1, cy)
                for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                    if 0 <= nx < W and 0 <= ny < H and cpx[nx, ny] and not seen[ny * W + nx]:
                        seen[ny * W + nx] = 1; q.append((nx, ny))
            found.append(([bx0, by0, bx1 + 1, by1 + 1], n, [x, y]))
    return found

def detect():
    columns, start = [], None
    for x in range(W + 1):
        filled = x < W and core.crop((x, 0, x + 1, H)).getbbox() is not None
        if filled and start is None: start = x
        if not filled and start is not None:
            if x - start > MIN_COLUMN: columns.append((start, x))
            start = None
    if len(columns) < 3: sys.exit(f'{device.name}: на листе меньше трёх видов, разметьте parts.json вручную')
    def view(name, c):
        top = core.crop((c[0], 0, c[1], H)).getbbox()
        return {'name': name, 'box': [c[0], top[1], c[1], top[3]]}
    parts = [view('view-closed', columns[0]), view('view-open', columns[1]), view('view-repaired', columns[-1])]
    # Рамки деталей разобранного вида часто перекрываются, поэтому деталь задаётся точкой внутри неё (seed):
    # маска — ровно эта связная область, без соседей, чьи рамки попали внутрь.
    exploded = sorted((c for c in components(columns[1][1], columns[-1][0]) if c[1] >= MIN_PART), key=lambda c: (c[0][0] // 40, c[0][1]))
    parts += [{'name': f'part-{i:02d}', 'box': b, 'seed': seed} for i, (b, n, seed) in enumerate(exploded, 1)]
    return {'pad': 6, 'parts': parts}

cfg_path = device / 'parts.json'
cfg = json.loads(cfg_path.read_text(encoding='utf-8')) if cfg_path.exists() else detect()

def seed_mask(seed):
    """Маска одной связной области, содержащей точку seed."""
    mask = Image.new('L', (W, H), 0); mpx = mask.load()
    q = deque([tuple(seed)]); mpx[tuple(seed)] = 255
    while q:
        cx, cy = q.popleft()
        for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
            if 0 <= nx < W and 0 <= ny < H and cpx[nx, ny] and not mpx[nx, ny]:
                mpx[nx, ny] = 255; q.append((nx, ny))
    return mask.filter(ImageFilter.MaxFilter(EDGE_GROW * 2 + 1))

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
    mask = seed_mask(part['seed']) if 'seed' in part else component_mask(part['box'])
    piece = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    piece.paste(sheet, (0, 0), mask)
    bbox = piece.getbbox()
    piece.crop(bbox).save(out / f"{part['name']}.png", optimize=True)
    part['x'], part['y'] = bbox[0], bbox[1]
    print(part['name'], bbox)
cfg_path.write_text(json.dumps(cfg, ensure_ascii=False, indent=1), encoding='utf-8')
