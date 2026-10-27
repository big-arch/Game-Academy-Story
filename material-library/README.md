# Библиотека материалов для «Мастерской историй»

Подборка исходных материалов для будущих экранов, окружения и анимаций. Скачано и проверено 27 октября 2026 г. Материалы пока **не подключены к игре**: перед применением надо проверить стиль, перспективу, масштаб, имена и условия распространения.

| Папка | Содержимое | Автор и источник | Условия на странице |
| --- | --- | --- | --- |
| `ui/golden-ui` | PNG-атлас и редактируемый PSD: рамки, кнопки и инвентарь. Шрифты из демонстрации в комплект не входят. | [Buch — Golden UI](https://opengameart.org/content/golden-ui) | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) |
| `objects/retro-items` | 25 PNG: батарейки, кассета, кассетный плеер, камера и другие предметы. | [knekko — Retro Items](https://opengameart.org/content/retro-items) | CC0 1.0 |
| `objects/computer-hardware` | 43 записи в архиве: платы, процессоры и накопители старых компьютеров, включая именные модели Apple. | [edomin — Old Computer Hardware](https://opengameart.org/content/old-computer-hardware) | CC0 1.0. Перед релизом отдельно проверить изображения торговых марок и обозначений реальной техники. |
| `environment/potted-plants` | 32 записи в архиве: растения в горшках и природные предметы; отдельные PNG и общий атлас. | [Reactorcore — Nature Props Surface Forest](https://opengameart.org/content/nature-props-surface-forest) | CC0 1.0 |
| `environment/rpg-props` | PNG-атлас с книгами, предметами интерьера и растениями. Часть набора выполнена в сказочном стиле и не подходит без адаптации. | [Jetrel — RPG item set](https://opengameart.org/content/rpg-item-set) | CC0 1.0 |
| `environment/sci-fi-interior` | Атлас технического интерьера. Холодная палитра отличается от нашей; использовать как дополнительный источник деталей, а не готовую комнату. | [Buch — Sci-fi Interior tiles](https://opengameart.org/content/sci-fi-interior-tiles) | CC0 1.0 |
| `effects/rain-particle` | Пять кадров 10 × 10 для анимации капли. Можно случайно распределять частицы; не требуется циклически воспроизводить весь фон. | [donte — Rain Particle Animated](https://opengameart.org/content/rain-particle-animated) | CC0 1.0 |
| `audio/rain` | Запись дождя в OGG. Это незацикленный фрагмент: для долгой сцены потребуется продуманное воспроизведение. | [Ove Melaa — Rainy](https://opengameart.org/content/rain-ambient-not-loopable-2-versions-available) | CC0 1.0 |
| `3d-reference/old-computer` | ZIP с файлом Blender и текстурой старого компьютера. Для изучения формы и возможных рендеров; не готовый 2D-спрайт. | [NephthysGameDev — old computer](https://opengameart.org/content/old-computer-0) | CC0 1.0 |

## Уже имевшиеся материалы

- `../models/PACK/`: три таблицы PNG 896 × 4608, исходники Aseprite, палитра и подписанные таблицы для рыжего, белого и чёрного кота. На подписанном листе есть ходьба в четырёх направлениях, вылизывание, зевота, сон и другие движения. По составу похож на [набор Last tick](https://last-tick.itch.io/animated-pixel-cats-64x64), но архив и отдельный файл лицензии в папке отсутствуют; происхождение нужно подтвердить до релиза. На странице набора заявлено бесплатное коммерческое использование без перепродажи и перераспространения исходников.
- `../models/Pixel_Art_Mechanics_Tool_Set_Asset_Pack_Devils_Garage_v01.1/`: 246 PNG инструментов и ракурсов, два XML-атласа и `readme.txt`. Лицензия **CC BY 4.0**, автор **Ajay Karat | Devil’s Garage**. При использовании нужно указать автора, [ссылку на лицензию](https://creativecommons.org/licenses/by/4.0/) и сообщить о внесённых изменениях. Исходные данные сохранены без изменений. [Страница набора](https://devilsworkshop.itch.io/pixel-art-mechanics-tool-set-asset-pack).
- `../research/assets/shepardskin-cat-sprites.zip`: дополнительный кот с GIF ходьбы и бега, [Shepardskin, CC0](https://opengameart.org/content/cat-sprites); визуально проще, чем сцена игры.

## Подход к дальнейшей работе

1. Сделать единый визуальный набор на основе согласованного референса: тёплый свет, вид сверху на рабочий стол, крупные интерактивные предметы.
2. Выбрать и протестировать отдельные спрайты кота и инструментов в сцене. Разные наборы отличаются масштабом и стилем; не применять все автоматически.
3. Сохранять исходные файлы и эту ведомость. Перед публикацией составить экран благодарностей для реально использованных работ, в особенности CC BY 4.0.
4. Архивы проверены на целостность; исходники Blender, PSD и Aseprite не редактировались и не запускались.
