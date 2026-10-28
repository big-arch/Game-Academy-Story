# Пиксельная музыкальная шкатулка Нади (глава 5): три вида для общего движка ремонта.
# Рисуется на сетке 128×96 и увеличивается ×4 без сглаживания → assets/devices/music-box/parts/view-*.png
from pathlib import Path
from PIL import Image, ImageDraw

W, H, K = 128, 96, 4
OUT = Path(__file__).resolve().parent.parent / 'assets/devices/music-box/parts'
INK, WOOD_D, WOOD, WOOD_L, WOOD_H = '#2b1d14', '#5a3420', '#80502e', '#a06a3e', '#c48a52'
BRASS_D, BRASS, BRASS_L, STEEL, STEEL_L, VELVET, VELVET_D = '#7a5a1e', '#c99a3a', '#f0d27a', '#8c9296', '#d6dde0', '#7a2436', '#4e1422'


def box(d, glossy=False):
    # Корпус: толстая рамка дерева с тёмным контуром, волокна полосами.
    d.rectangle([6, 8, 121, 89], fill=INK)
    d.rectangle([8, 10, 119, 87], fill=WOOD)
    for y in range(13, 86, 6): d.line([10, y, 117, y + (1 if y % 12 else 0)], fill=WOOD_L if y % 12 else WOOD_D)
    d.rectangle([8, 10, 119, 12], fill=WOOD_H)
    d.rectangle([8, 84, 119, 87], fill=WOOD_D)
    for x, y in [(8, 10), (112, 10), (8, 80), (112, 80)]:  # латунные уголки
        d.rectangle([x, y, x + 7, y + 7], fill=BRASS); d.line([x, y, x + 7, y], fill=BRASS_L); d.line([x, y, x, y + 7], fill=BRASS_L)
    if glossy: d.line([14, 15, 60, 15], fill='#e2b07a'); d.line([14, 16, 40, 16], fill='#e2b07a')


def closed(glossy=False):
    im = Image.new('RGBA', (W, H)); d = ImageDraw.Draw(im); box(d, glossy)
    # Крышка-вставка и медальон с буквой «Н».
    d.rectangle([22, 22, 105, 75], outline=WOOD_D); d.rectangle([24, 24, 103, 73], outline=WOOD_H)
    d.ellipse([50, 34, 77, 61], fill=INK); d.ellipse([52, 36, 75, 59], fill=BRASS); d.ellipse([54, 38, 73, 57], fill=BRASS_D)
    d.line([59, 41, 59, 54], fill=BRASS_L, width=2); d.line([68, 41, 68, 54], fill=BRASS_L, width=2); d.line([59, 47, 68, 47], fill=BRASS_L, width=2)
    d.rectangle([70, 53, 71, 54], fill=BRASS_L)
    # Замочная скважина спереди и заводной ключ сбоку.
    d.rectangle([62, 80, 65, 86], fill=INK)
    d.rectangle([121, 44, 125, 50], fill=INK); d.rectangle([122, 40, 126, 54], fill=BRASS); d.line([122, 40, 122, 54], fill=BRASS_L)
    if not glossy:  # пыль и потёртость
        for x, y in [(30, 30), (90, 66), (40, 70), (96, 28), (84, 40)]: d.point((x, y), fill='#b9a58a')
        d.line([28, 64, 44, 60], fill=WOOD_D)
    return im


def opened():
    im = Image.new('RGBA', (W, H)); d = ImageDraw.Draw(im); box(d)
    d.rectangle([14, 16, 113, 81], fill=VELVET_D); d.rectangle([16, 18, 111, 79], fill=VELVET)
    # Отсек механизма: латунная плита.
    d.rectangle([20, 30, 108, 76], fill=INK); d.rectangle([22, 32, 106, 74], fill=BRASS_D)
    # Барабан со штырьками (центр ~ 48%, 47%).
    d.rectangle([30, 38, 92, 52], fill=INK); d.rectangle([31, 39, 91, 51], fill=BRASS)
    d.line([31, 40, 91, 40], fill=BRASS_L)
    for i, x in enumerate(range(33, 90, 4)): d.point((x, 42 + (i * 3) % 8), fill=STEEL_L)
    d.rectangle([26, 41, 30, 49], fill=STEEL); d.rectangle([92, 41, 96, 49], fill=STEEL)
    # Гребёнка: стальные зубцы под барабаном (~ 48%, 60%). Один зубец согнут.
    d.rectangle([30, 62, 92, 66], fill=STEEL); d.line([30, 62, 92, 62], fill=STEEL_L)
    for x in range(31, 92, 3): d.line([x, 54, x, 61], fill=STEEL_L if x != 61 else STEEL)
    d.line([61, 54, 63, 58], fill='#c8452e')
    # Пружинный барабан справа внизу (~ 84%, 74%) и пыль на механизме.
    d.ellipse([96, 60, 110, 74], fill=INK); d.ellipse([98, 62, 108, 72], fill=STEEL)
    for r in (3, 1): d.ellipse([103 - r, 67 - r, 103 + r, 67 + r], outline=STEEL_L)
    for x, y in [(40, 70), (52, 71), (70, 69), (80, 72), (36, 35), (88, 34)]: d.rectangle([x, y, x + 1, y], fill='#b9a58a')
    # Записка Лёвы под бархатом крышки (~ 20%, 20%).
    d.rectangle([18, 19, 34, 27], fill='#f2e6c8'); d.line([20, 22, 31, 22], fill='#8a6f4a'); d.line([20, 24, 28, 24], fill='#8a6f4a')
    return im


OUT.mkdir(parents=True, exist_ok=True)
for name, im in [('closed', closed()), ('open', opened()), ('repaired', closed(glossy=True))]:
    im.resize((W * K, H * K), Image.NEAREST).save(OUT / f'view-{name}.png')
print('ok', OUT)
