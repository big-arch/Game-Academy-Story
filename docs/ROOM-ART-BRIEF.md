# ТЗ: этапы рабочего стола мастерской (для Codex / генератора изображений)

Обустройство мастерской — это 6 целиком нарисованных картинок одного и того же стола. Каждая покупка в игре открывает следующий этап. Предметы **не вырезаются и не вставляются** — каждый этап рисуется заново, с живой раскладкой мелочей.

## Общие требования ко всем картинкам

- **Образец стиля и кадра:** `assets/workshop-cassette.png`. Прикладывать к каждому запросу.
- **Размер:** 936 × 1681 px, портрет, PNG без прозрачности.
- **Кадр неподвижен.** Камера, перспектива, окно, полка Лёвы с книгами и коробками, плющ слева вверху, стена из досок и передняя кромка стола стоят **на тех же местах**, что в образце. Иначе техника в игре окажется не на столе.
- **Центр стола свободен.** Прямоугольник примерно x 190–750, y 760–1300 — место для ремонтируемой техники. Там может лежать только коврик, без предметов.
- **Свет:** вечер, дождь за окном. На этапах без лампы комната темнее и холоднее, свет только от окна. С лампой — тёплое пятно на столе.
- **Стиль:** тот же пиксель-арт, та же палитра, без людей, рук, текста и интерфейса.
- **Мелочи:** на каждом этапе своя раскладка мелких деталей (винты, шайбы, обрезки проводов, бумажки). Они не повторяют прошлый этап один в один, лежат у краёв и не заходят в центр.

## Этапы

| Файл | Этап в игре | Что добавляется | Цена |
|---|---|---|---|
| `assets/room/stage-0.png` | Голый стол | Пустой стол Лёвы: доски, пыль, пара забытых винтов у края. Ни коврика, ни лампы, ни кружки | — |
| `assets/room/stage-1.png` | Рабочий коврик | Зелёный резиновый коврик с сеткой в центре стола; на его краю два-три винта | 60 |
| `assets/room/stage-2.png` | Лампа на приёмнике | Оранжевая настольная лампа на старом радиоприёмнике справа у стены, тёплый свет на коврике | 120 |
| `assets/room/stage-3.png` | Чайный уголок | Кружка с ёлками на подставке с паром слева, стакан с карандашами у стены слева | 60 |
| `assets/room/stage-4.png` | Порядок в инструментах | Коробочка с винтами, красная отвёртка, катушка припоя, ящичек с деталями по краям стола | 90 |
| `assets/room/stage-5.png` | Зелень | Цветок в горшке на подоконнике, маленький горшок на углу стола, стакан с кистями | 70 |

Каждый этап содержит **всё из предыдущих** плюс новое. Мелочи перекладываются по-новому.

## Промпт (английский, подставлять строку этапа)

> Use the attached image as the exact reference for camera, framing, room layout, pixel density, palette and lighting style. Redraw the SAME cozy pixel-art repair workshop desk at night with rain outside, 936×1681 portrait. Keep the window, Lev's shelf with books and boxes, the ivy plant at top-left, the wooden wall planks and the front edge of the desk in exactly the same positions. Keep the central area of the desk (roughly x 190–750, y 760–1300) free of objects except a work mat if listed. No people, no hands, no text, no UI. Desk contents for this stage: **[STAGE]**. Scatter a few small details (screws, washers, wire offcuts, a paper note) near the desk edges in a new natural arrangement.

Строки **[STAGE]**:

- **stage-0:** bare dusty wooden desk, no mat, no lamp, no mug; only two forgotten screws near the front edge; the room is darker and cooler, lit only by the window.
- **stage-1:** a green rubber cutting mat with a grid lies in the center of the desk; two or three screws on its edge; no lamp, no mug; cool light from the window.
- **stage-2:** everything from stage 1, plus an orange desk lamp standing on an old wooden radio receiver at the right wall, casting a warm pool of light on the mat.
- **stage-3:** everything from stage 2, plus a white mug with a pine-tree print on a cork coaster with rising steam at the left, and a wooden cup with pencils at the left wall.
- **stage-4:** everything from stage 3, plus a small open box of screws and a red screwdriver at the right edge, a spool of solder and a small parts drawer at the left edge.
- **stage-5:** everything from stage 4, plus a potted ivy on the windowsill, a tiny potted plant on the front-left corner of the desk, and a cup with brushes near the lamp.

## Как подключить

1. Сохранить файлы с именами из таблицы в `assets/room/`, заменив временные.
2. Ничего больше менять не нужно: игра берёт картинку этапа по имени.
3. Проверить, что техника на столе стоит на коврике (центр свободен).
