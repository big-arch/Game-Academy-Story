# Пустая мастерская и покупаемые предметы из готового арта assets/workshop-cassette.png.
# 1) Закрашивает со стола коврик, кружку, лампу, приёмник, стакан с карандашами, инструменты и цветок на подоконнике
#    кусками чистого дерева/стены/окна из той же картинки → assets/room/empty.png.
# 2) Разница «было − стало» даёт маски предметов: каждый вырезается в свой спрайт assets/room/<id>.png,
#    варианты (цвет кружки, лампы, коврика) — сдвигом оттенка. Координаты спрайтов → room-layout.js.
import colorsys, json
from pathlib import Path
from PIL import Image, ImageChops, ImageFilter
import numpy as np
import cv2

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'assets/room'; OUT.mkdir(exist_ok=True)
src = Image.open(ROOT / 'assets/workshop-cassette.png').convert('RGBA')
W, H = src.size  # 936 × 1681; координаты ниже — в превью 468×840, умножаются на 2
a = np.array(src)
base = a.copy()
S = lambda v: int(round(v * 2))


def copy(dst, sx, sy):
    """Переносит прямоугольник dst=(x0,y0,x1,y1) из позиции со сдвигом (sx, sy), всё в превью-координатах."""
    x0, y0, x1, y1 = map(S, dst); dx, dy = S(sx), S(sy)
    base[y0:y1, x0:x1] = a[y0 + dy:y1 + dy, x0 + dx:x1 + dx]


# Стол: строки 300..742 заполняются чистыми досками из полосы x 92..360 / y 326..396 (между кружкой и лампой).
# Яркость полосы выравнивается по столбцам (иначе повторяется блик лампы), плитка зеркалится и сдвигается
# на каждом повторе, сверху — ровный тёплый свет без лампы и виньетка по краям.
band = a[S(326):S(396), S(92):S(360), :3].astype(float)
col = band.mean(axis=0, keepdims=True); band *= col.mean(axis=1, keepdims=True) / col  # по каналам: блик лампы жёлтый
bh, bw = band.shape[:2]
y0, y1 = S(300), S(742)
tile = np.concatenate([band, band[:, ::-1]], axis=1)
rows = []
for y in range(y0, y1):
    k = (y - y0) // bh
    r = np.roll(tile[(y - y0) % bh], k * 137, axis=0)
    rows.append(np.vstack([r] * (W // len(r) + 2))[:W])
desk = np.stack(rows)
yy, xx = np.mgrid[0:y1 - y0, 0:W]
vign = 1 - .28 * ((xx / W - .5) * 2) ** 2 - .16 * (yy / (y1 - y0))
desk *= (.86 * vign)[..., None]
base[y0:y1, :, :3] = np.clip(desk, 0, 255).astype(np.uint8)
for i in range(S(10)):
    t = i / S(10); y = y0 + i
    base[y, :, :3] = (a[y, :, :3] * (1 - t) + base[y, :, :3] * t).astype(np.uint8)

# Задняя стенка: стакан с карандашами (слева) и приёмник со стойкой лампы (справа) — сдвигом вертикальных досок.
copy((22, 200, 92, 300), 80, 0)
copy((356, 196, 468, 300), -150, 0)
# Лампа и цветок на подоконнике: окно — чистыми стёклами левее; справа от подоконника (x > 372) — стена из досок.
copy((292, 0, 350, 132), -100, 0)
copy((350, 0, 372, 132), -150, 0)
copy((292, 132, 342, 200), -50, 0)
copy((342, 132, 372, 200), -90, 0)
plank = a[S(208):S(278), S(120):S(216)]
for y in range(0, S(280), plank.shape[0]):
    h = min(plank.shape[0], S(280) - y); base[y:y + h, S(372):S(468)] = plank[:h, :S(468) - S(372)]
base[:S(280), S(370):S(374), :3] = (base[:S(280), S(370):S(374), :3] * .45).astype(np.uint8)
copy((300, 198, 372, 214), -60, 0)
copy((356, 278, 468, 300), -156, 0)
base[S(296):S(314), S(350):S(468)] = base[S(296):S(314), S(194):S(312)].copy()  # остатки приёмника у кромки

empty = Image.fromarray(base)
empty.save(OUT / 'empty.png')
print('empty ok')

# ---------- Предметы ----------
orig = a.astype(int); emp = base.astype(int)
diff = np.abs(orig[..., :3] - emp[..., :3]).sum(axis=2) > 46
items = {}


def save(id, rgba, box):
    """box в полном разрешении; rgba — массив того же размера, что box."""
    x0, y0, x1, y1 = box
    img = Image.fromarray(rgba.astype(np.uint8))
    bb = img.getbbox()
    if not bb: raise SystemExit(f'{id}: пусто')
    img = img.crop(bb); x0 += bb[0]; y0 += bb[1]
    img.save(OUT / f'{id}.png')
    items[id] = [round(x0 / W * 100, 2), round(y0 / H * 100, 2), round(img.width / W * 100, 2), round(img.height / H * 100, 2)]


def cut(box, mask_extra=None, pad=6):
    """Объект внутри box: GrabCut по прямоугольнику (фон — то, что у краёв box), без чужих пикселей стола и стены."""
    x0, y0, x1, y1 = box
    crop = np.ascontiguousarray(a[y0:y1, x0:x1, :3][..., ::-1])
    m = np.zeros(crop.shape[:2], np.uint8); bg = np.zeros((1, 65), float); fg = np.zeros((1, 65), float)
    rect = (pad, pad, crop.shape[1] - 2 * pad, crop.shape[0] - 2 * pad)
    cv2.grabCut(crop, m, rect, bg, fg, 6, cv2.GC_INIT_WITH_RECT)
    keep = (m == cv2.GC_FGD) | (m == cv2.GC_PR_FGD)
    if mask_extra is not None: keep &= mask_extra[y0:y1, x0:x1]
    keep = cv2.morphologyEx(keep.astype(np.uint8), cv2.MORPH_OPEN, np.ones((3, 3), np.uint8)) > 0
    out = a[y0:y1, x0:x1].copy(); out[..., 3] = np.where(keep, 255, 0)
    return out


def hue(rgba, shift, pick):
    """Сдвиг оттенка только у пикселей, где pick(h, s, v) истинно (например, абажур, а не стена в его свете)."""
    out = rgba.copy()
    for y in range(out.shape[0]):
        for x in range(out.shape[1]):
            if not out[y, x, 3]: continue
            r, g, b = out[y, x, :3] / 255
            h, s, v = colorsys.rgb_to_hsv(r, g, b)
            if pick(h, s, v):
                out[y, x, :3] = [int(c * 255) for c in colorsys.hsv_to_rgb((h + shift) % 1, s, v)]
    return out


def tint(rgba, color, pick):
    out = rgba.copy(); c = np.array(color, float)
    for y in range(out.shape[0]):
        for x in range(out.shape[1]):
            if not out[y, x, 3]: continue
            r, g, b = out[y, x, :3] / 255
            h, s, v = colorsys.rgb_to_hsv(r, g, b)
            if pick(h, s, v): out[y, x, :3] = np.clip(c * v * 1.05, 0, 255)
    return out


not_green = orig[..., 1] <= orig[..., 0] + 4
BOX = {
    'lamp': (690, 90, 936, 476), 'radio': (815, 440, 936, 650), 'brushes': (730, 330, 822, 650),
    'plant-sill': (592, 258, 726, 404), 'mug': (0, 630, 172, 852),
}
lamp = cut(BOX['lamp'])
lb = BOX['lamp']; lamp[max(0, 380 - lb[1]):, max(0, 730 - lb[0]):max(0, 822 - lb[0]), 3] = 0  # стакан с кистями — отдельно
shade = lambda h, s, v: s > .55 and (h < .09 or h > .95)
# Стойка лампы стояла на приёмнике и при вырезании теряется: рисуем настенный кронштейн — лампа держится сама.
from PIL import ImageDraw
ys, xs = np.where(lamp[..., 3] > 0); top, right = ys.min(), xs.max()
li = Image.fromarray(lamp); d = ImageDraw.Draw(li)
hub = (right - 60, top + 14); wall = (lamp.shape[1] - 6, top + 80)
for w, c in [(12, (40, 28, 24, 255)), (6, (96, 78, 66, 255))]: d.line([hub, (hub[0] + 40, top - 20), wall], fill=c, width=w, joint='curve')
for (cx, cy), r in [(hub, 9), ((hub[0] + 40, top - 20), 8)]: d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(40, 28, 24, 255)); d.ellipse([cx - r + 3, cy - r + 3, cx + r - 3, cy + r - 3], fill=(150, 120, 90, 255))
d.rectangle([wall[0] - 10, wall[1] - 26, wall[0] + 6, wall[1] + 26], fill=(40, 28, 24, 255)); d.rectangle([wall[0] - 7, wall[1] - 23, wall[0] + 3, wall[1] + 23], fill=(120, 96, 70, 255))
lamp = np.array(li)
save('lamp-orange', lamp, lb)
save('lamp-green', hue(lamp, .3, shade), lb)
save('lamp-blue', hue(lamp, .58, shade), lb)
radio = cut(BOX['radio']); rb = BOX['radio']; radio[:max(0, 476 - rb[1]), :, 3] = 0
save('radio', radio, rb)
save('brushes', cut(BOX['brushes']), BOX['brushes'])
plant = cut(BOX['plant-sill']); save('plant-sill', plant, BOX['plant-sill'])
mug = cut(BOX['mug'])
white = lambda h, s, v: v > .5 and .02 < h < .18
save('mug-trees', mug, BOX['mug'])
save('mug-red', tint(mug, (214, 70, 58), white), BOX['mug'])
save('mug-blue', tint(mug, (86, 140, 214), white), BOX['mug'])
# Инструменты на коврике и по краям: всё, что изменилось и не зелёное (сам коврик рисуется отдельно).
tools = np.zeros_like(a); tools_box = (0, 740, 936, 1460)
for box in [(780, 730, 936, 1460), (0, 820, 90, 1440)]:
    x0, y0, x1, y1 = box; tools[y0:y1, x0:x1] = cut(box, not_green)
save('tools', tools[740:1460], (0, 740, 936, 1460))

# Коврик: рисуется заново по контуру исходного (пиксели 4×), чтобы перекрасить и чтобы под ним не было дыр от инструментов.
def mat(fill, line, edge):
    x0, y0, x1, y1 = 84, 796, 892, 1446
    w, h = (x1 - x0) // 4, (y1 - y0) // 4
    im = Image.new('RGBA', (w, h)); px = im.load()
    for y in range(h):
        for x in range(w):
            if (x < 8 and y < 10) or (x > w - 9 and y > h - 10): continue  # срезанные углы, как у исходного
            c = edge if x in (0, w - 1) or y in (0, h - 1) else line if (x % 9 == 0 or y % 9 == 0) else fill
            shade = 1 - .12 * y / h
            px[x, y] = tuple(int(v * shade) for v in c) + (255,)
    big = np.array(im.resize((w * 4, h * 4), Image.NEAREST))
    return big, (x0, y0, x0 + w * 4, y0 + h * 4)
for id, colors in {'mat-green': ((34, 110, 96), (70, 150, 120), (16, 60, 52)), 'mat-blue': ((40, 78, 130), (84, 124, 176), (20, 38, 70)), 'mat-leather': ((120, 72, 40), (146, 96, 58), (66, 38, 20))}.items():
    save(id, *mat(*colors))

# Цветок на стол: тот же горшок, отражённый, у левого края стола.
flip = plant[:, ::-1]; save('plant-desk', flip, (30, 1300, 30 + flip.shape[1], 1300 + flip.shape[0]))

print(json.dumps(items))

# Ноутбук (первый заказ и меню) нарисован прямо в workshop-pixel.png: вне ноутбука эта картинка совпадает
# с workshop-cassette.png, поэтому разница даёт чистую маску. Сохраняется во весь холст — точки ремонта не сдвигаются.
lap = np.array(Image.open(ROOT / 'assets/workshop-pixel.png').convert('RGBA')).astype(int)
m = np.zeros(orig.shape[:2], np.uint8); X0, Y0, X1, Y1 = 84, 428, 842, 1396  # рамка ноутбука
m[Y0:Y1, X0:X1] = (np.abs(lap[Y0:Y1, X0:X1, :3] - orig[Y0:Y1, X0:X1, :3]).sum(axis=2) > 90)
m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
n, lab, stats, _ = cv2.connectedComponentsWithStats(m)
big = (lab == 1 + np.argmax(stats[1:, cv2.CC_STAT_AREA])).astype(np.uint8)
cs, _ = cv2.findContours(big, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
keep = np.zeros_like(big); cv2.drawContours(keep, cs, -1, 1, cv2.FILLED)
keep = cv2.morphologyEx(keep, cv2.MORPH_OPEN, np.ones((7, 7), np.uint8))
out = lap.astype(np.uint8).copy(); out[..., 3] = keep * 255
Image.fromarray(out).save(OUT / 'laptop.png', optimize=True)
print('laptop ok')

# Раскладка для игры: левый верх и размер каждого спрайта в % холста комнаты.
(ROOT / 'room-layout.js').write_text('// Сгенерировано scripts/build-room.py: [left, top, width, height] спрайтов assets/room в % комнаты.\nexport const ROOM_LAYOUT = ' + json.dumps(items) + ';\n', encoding='utf-8')
