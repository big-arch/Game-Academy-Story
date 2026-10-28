# Пустая мастерская и покупаемые предметы из готового арта assets/workshop-cassette.png (936×1681).
#   empty.png  — стол без вещей: доски стола собраны заново в перспективе из чистой полосы у стены,
#                свет лампы с комнаты снят (иначе остаётся засвет без лампы).
#   glow.png   — этот свет отдельно: слой «plus-lighter» поверх комнаты, когда куплена лампа.
#   <id>.png   — предметы во весь кадр (прозрачный холст того же размера), чтобы совпадать с фоном пиксель в пиксель.
# Маски предметов — GrabCut с подсказками; цветные варианты — поворот оттенка в HSV.
import json
from pathlib import Path
import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'assets/room'; OUT.mkdir(exist_ok=True)
for old in OUT.glob('*.png'): old.unlink()
src = np.array(Image.open(ROOT / 'assets/workshop-cassette.png').convert('RGBA'))
H, W = src.shape[:2]
rgb = src[..., :3].astype(np.float32)
base = rgb.copy()

# ---------- 1. Стол ----------
# Чистая полоса у стены (между кружкой и лампой) растягивается к зрителю: доски внизу крупнее, как в оригинале.
TOP, BOTTOM = 566, 1484           # от стены до передней кромки стола
band = rgb[566:796, 200:700].copy()
col = band.mean(axis=0, keepdims=True); band *= col.mean(axis=1, keepdims=True) / col   # убрать блик лампы по столбцам
band = np.concatenate([band, band[::-1]], axis=0)                                         # «пинг-понг» без шва
band = np.concatenate([band, band[:, ::-1]], axis=1)
bh, bw = band.shape[:2]
desk = np.zeros((BOTTOM - TOP, W, 3), np.float32)
sy = 0.0
for i in range(BOTTOM - TOP):
    t = i / (BOTTOM - TOP); scale = 1 + .7 * t                       # перспектива: чем ближе, тем крупнее
    row = band[int(sy) % bh]
    xs = ((np.arange(W) - W / 2) / scale + W / 2 + 173 * (int(sy) // bh)).astype(int) % bw
    desk[i] = row[xs]; sy += 1 / scale
yy, xx = np.mgrid[0:BOTTOM - TOP, 0:W].astype(np.float32)
t = yy / (BOTTOM - TOP)
light = (1 - .22 * ((xx / W - .5) * 2) ** 2) * (1.02 - .1 * t)
light[:24] *= np.linspace(.62, 1, 24)[:, None]                      # тень у стены, как в оригинале
desk *= light[..., None]
# Передняя кромка остаётся своей; последние 40 строк плавно переходят в неё.
fade = np.clip((yy - (BOTTOM - TOP - 40)) / 40, 0, 1)[..., None]
base[TOP:BOTTOM] = desk * (1 - fade) + rgb[TOP:BOTTOM] * fade

def move(dst, dx, dy=0):
    x0, y0, x1, y1 = dst; base[y0:y1, x0:x1] = base[y0 + dy:y1 + dy, x0 + dx:x1 + dx].copy()

# Стена: стакан с карандашами, стакан с кистями, приёмник и стойка лампы — сдвигом вертикальных досок.
move((44, 400, 184, TOP), 160)
move((712, 390, 936, TOP), -300)
# Окно и подоконник под лампой и цветком; справа от окна — стена из досок.
move((584, 0, 700, 264), -200)
move((700, 0, 744, 264), -300)
move((584, 264, 684, 400), -100)
move((684, 264, 744, 400), -180)
plank = base[416:556, 240:432].copy()
for y in range(0, TOP, plank.shape[0]):
    h = min(plank.shape[0], TOP - y); base[y:y + h, 744:936] = plank[:h, :192]
base[:TOP, 740:748] *= .45
move((600, 396, 744, 428), -120)                                         # свисающие листья под подоконником
# Пар над кружкой поднимался на шкафчик слева.
move((0, 540, 60, TOP), 0, -60)

# ---------- 2. Свет лампы ----------
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
g = .42 * np.exp(-(((xx - 800) / 330) ** 2 + ((yy - 380) / 300) ** 2)) + .5 * np.exp(-(((xx - 790) / 170) ** 2 + ((yy - 1500) / 45) ** 2))
g[:430, 560:744] *= .35                                                   # стекло окна свет почти не держит
lit = base.copy()
lit[TOP:BOTTOM] *= (1 + .5 * g[TOP:BOTTOM])[..., None] * np.array([1.06, 1, .9])  # тёплое пятно на новом столе
dark = base * (1 - g)[..., None]
glow = np.clip(np.maximum(lit, base) - dark, 0, 255)
Image.fromarray(np.dstack([dark.clip(0, 255), np.full((H, W), 255, np.float32)]).astype(np.uint8)).save(OUT / 'empty.png', optimize=True)
Image.fromarray(glow.astype(np.uint8)).save(OUT / 'glow.png', optimize=True)

# ---------- 3. Предметы ----------
ITEMS = []
def save(id, layer):
    Image.fromarray(layer.astype(np.uint8)).save(OUT / f'{id}.png', optimize=True); ITEMS.append(id)

def grab(box, fg=(), sure=(), bg=()):
    """GrabCut в box (x0,y0,x1,y1). fg — вероятно предмет, sure — точно предмет, bg — точно фон (прямоугольники или полигоны)."""
    x0, y0, x1, y1 = box
    crop = np.ascontiguousarray(src[y0:y1, x0:x1, 2::-1])
    m = np.full(crop.shape[:2], cv2.GC_PR_BGD if fg else cv2.GC_BGD, np.uint8)
    def paint(shapes, v):
        for s in shapes:
            pts = np.array(s, np.int32) - [x0, y0]
            if len(pts) == 2: cv2.rectangle(m, tuple(int(c) for c in pts[0]), tuple(int(c) for c in pts[1]), int(v), -1)
            else: cv2.fillPoly(m, [pts], int(v))
    if fg: paint(fg, cv2.GC_PR_FGD); paint(sure, cv2.GC_FGD); paint(bg, cv2.GC_BGD)
    bgm, fgm = np.zeros((1, 65), np.float64), np.zeros((1, 65), np.float64)
    if fg: cv2.grabCut(crop, m, None, bgm, fgm, 8, cv2.GC_INIT_WITH_MASK)
    else: cv2.grabCut(crop, m, (5, 5, crop.shape[1] - 10, crop.shape[0] - 10), bgm, fgm, 8, cv2.GC_INIT_WITH_RECT)
    keep = ((m == cv2.GC_FGD) | (m == cv2.GC_PR_FGD)).astype(np.uint8)
    keep = cv2.morphologyEx(keep, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    n, lab, st, _ = cv2.connectedComponentsWithStats(keep)
    if n > 1: keep = np.isin(lab, 1 + np.where(st[1:, cv2.CC_STAT_AREA] > 80)[0]).astype(np.uint8)
    out = np.zeros((H, W, 4), np.float32); out[y0:y1, x0:x1, :3] = rgb[y0:y1, x0:x1]
    out[y0:y1, x0:x1, 3] = cv2.GaussianBlur(keep.astype(np.float32), (3, 3), 0) * 255     # мягкий край без ореола
    return out

def recolor(layer, pick, hue=None, sat=None):
    """Поворот оттенка у пикселей pick(h,s,v) (OpenCV: h 0..180, s,v 0..255)."""
    hsv = cv2.cvtColor(layer[..., :3].clip(0, 255).astype(np.uint8), cv2.COLOR_RGB2HSV).astype(np.float32)
    h, s, v = hsv[..., 0], hsv[..., 1], hsv[..., 2]
    sel = pick(h, s, v) & (layer[..., 3] > 0)
    if hue is not None: h[sel] = hue(h[sel]) % 180
    if sat is not None: s[sel] = np.clip(sat(s[sel]), 0, 255)
    out = layer.copy(); out[..., :3] = cv2.cvtColor(np.dstack([h, s, v]).astype(np.uint8), cv2.COLOR_HSV2RGB); return out

# Лампа стоит на приёмнике — это один предмет, иначе стойка висит в воздухе.
P = lambda pts: [(x + 660, y + 60) for x, y in pts]
lamp = grab((680, 60, 936, 660),
            fg=[P([(30, 245), (145, 90), (175, 50), (235, 70), (250, 305), (35, 290)]), P([(165, 45), (205, 25), (276, 90), (276, 150), (240, 140)]),
                P([(232, 130), (276, 130), (276, 425), (232, 425)]), P([(148, 375), (276, 375), (276, 595), (148, 595)])],
            sure=[P([(90, 130), (215, 130), (215, 250), (90, 250)]), P([(178, 430), (262, 430), (262, 560), (178, 560)]), P([(250, 300), (266, 300), (266, 420), (250, 420)])],
            bg=[P([(70, 330), (152, 330), (152, 600), (70, 600)]), [(586, 250), (736, 250), (736, 410), (586, 410)]])
ROW = np.mgrid[0:H, 0:W][0]
COLS = np.mgrid[0:H, 0:W][1]
shade = lambda h, s, v: (s > 120) & ((h < 16) | (h > 170)) & (v > 60) & (ROW < 400) & (COLS < 872)
save('lamp-orange', lamp)
save('lamp-green', recolor(lamp, shade, hue=lambda h: h + 52, sat=lambda s: s * .78))
save('lamp-blue', recolor(lamp, shade, hue=lambda h: h + 100, sat=lambda s: s * .85))
save('brushes', grab((734, 384, 818, 656)))
plant = grab((592, 258, 726, 404)); save('plant-sill', plant)
desk_plant = np.zeros_like(plant); desk_plant[1290:1436, 40:174] = plant[258:404, 592:726][:, ::-1]; save('plant-desk', desk_plant)
mug = grab((0, 628, 172, 852))
body = lambda h, s, v: (v > 120) & ((h < 30) | (h > 170))
save('mug-trees', mug)
save('mug-red', recolor(mug, body, hue=lambda h: h * 0 + 2, sat=lambda s: s * .5 + 110))
save('mug-blue', recolor(mug, body, hue=lambda h: h * 0 + 108, sat=lambda s: s * .5 + 95))
tools = np.zeros((H, W, 4), np.float32)
for box in [(796, 826, 936, 930), (812, 1000, 930, 1316), (0, 836, 76, 960), (0, 980, 62, 1084)]:
    part = grab(box); tools = np.where(part[..., 3:] > tools[..., 3:], part, tools)
save('tools', tools)

# Коврик — настоящий из оригинала, по его контуру (с вырезами по углам, как нарисован); пиксели не цвета коврика
# (отвёртка, винты, край коробки) заполняются по соседям.
MAT = np.array([(97, 398), (430, 398), (446, 412), (446, 722), (42, 722), (42, 428), (97, 428)]) * 2
shape = np.zeros((H, W), np.uint8); cv2.fillPoly(shape, [MAT.astype(np.int32)], 1)
hsv = cv2.cvtColor(src[..., :3], cv2.COLOR_RGB2HSV)
matcolor = (hsv[..., 0] > 32) & (hsv[..., 0] < 100) & (hsv[..., 1] > 50)
shadow = (hsv[..., 2] < 70) & (np.mgrid[0:H, 0:W][1] > 760)                                   # тень отвёртки и коробки
holes = cv2.dilate(((shape == 1) & (~matcolor | shadow)).astype(np.uint8), np.ones((7, 7), np.uint8)) & shape
# Дыры закрываются тем же ковриком левее на 4 клетки сетки (клетка ≈ 36 px), края шва — мягкой заливкой.
fixed = src[..., :3].copy(); todo = holes.astype(bool)
for shift in (144, 288, 432):
    ys, xs = np.where(todo); ok = (xs - shift >= 0) & ~holes[ys, np.maximum(xs - shift, 0)].astype(bool) & (shape[ys, np.maximum(xs - shift, 0)] == 1)
    fixed[ys[ok], xs[ok]] = src[ys[ok], xs[ok] - shift, :3]; todo[ys[ok], xs[ok]] = False
mat = np.zeros((H, W, 4), np.float32); mat[..., :3] = fixed; mat[..., 3] = shape * 255
every = lambda h, s, v: np.ones_like(h, bool)
save('mat-green', mat)
save('mat-blue', recolor(mat, every, hue=lambda h: h + 30))
save('mat-leather', recolor(mat, every, hue=lambda h: h * 0 + 11, sat=lambda s: s * .85 + 25))

# Ноутбук (первый заказ) нарисован в workshop-pixel.png; вне его картинки совпадают — маска по разнице.
lap = np.array(Image.open(ROOT / 'assets/workshop-pixel.png').convert('RGBA')).astype(int)
m = np.zeros((H, W), np.uint8); X0, Y0, X1, Y1 = 84, 428, 842, 1396
m[Y0:Y1, X0:X1] = np.abs(lap[Y0:Y1, X0:X1, :3] - src[Y0:Y1, X0:X1, :3].astype(int)).sum(axis=2) > 90
m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
n, lab, st, _ = cv2.connectedComponentsWithStats(m)
big = (lab == 1 + np.argmax(st[1:, cv2.CC_STAT_AREA])).astype(np.uint8)
cs, _ = cv2.findContours(big, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
keep = np.zeros_like(big); cv2.drawContours(keep, cs, -1, 1, cv2.FILLED)
keep = cv2.morphologyEx(keep, cv2.MORPH_OPEN, np.ones((7, 7), np.uint8))
out = lap.astype(np.uint8).copy(); out[..., 3] = keep * 255
Image.fromarray(out).save(OUT / 'laptop.png', optimize=True)

(ROOT / 'room-layout.js').write_text('// Сгенерировано scripts/build-room.py: спрайты assets/room/<id>.png во весь кадр комнаты.\nexport const ROOM_ITEMS = ' + json.dumps(ITEMS) + ';\n', encoding='utf-8')
print('ok', ITEMS)
