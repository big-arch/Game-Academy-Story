# Мастерская историй — прототип

Небольшой браузерный прототип мобильной игры: главное меню, один заказ, диагностика перегрева, ремонт, история и первое улучшение. Музыка и эффекты включаются раздельно в меню; после включения музыка мастерской перемешивается, а звуковая запись дождя играет один раз. Это не сборка для магазина.

## Запуск

Требуется Node.js 20.11 или новее. В папке проекта выполните `npm start`, затем откройте http://127.0.0.1:4173. Управление мышью или касанием. Прогресс хранится в браузере. При переходе в главное меню состояние заказа сохраняется.

Перед первым запуском выполните `npm install`: `npm start` упаковывает `supabase-js` в `vendor/supabase.js`, и игра загружает его локально, без CDN.

## Мобильная сборка (Capacitor)

- `npm run build` — собрать `www/`: только файлы, нужные игре; `models/`, `temp/` и исходники музыки туда не попадают.
- `npm run cap:sync` — собрать и скопировать в `android/` и `ios/`.
- `npm run android` / `npm run ios` — открыть проект в Android Studio / Xcode. Для iOS нужен Mac.
- `npm run apk` — собрать отладочный APK в `dist/workshop-stories-debug.apk`, его можно поставить на телефон. Нужен JDK 21 в `~/.jdks` (Java 25 из Android Studio для Gradle 8.14 слишком новая), а из-за кириллицы в пути проект на время сборки подключается буквой диска через `subst`.
- `npm run assets` — пересоздать иконки и сплэш из `resources/` (`icon-only.png`, `icon-foreground.png`, `icon-background.png` — 1024×1024, `splash.png` и `splash-dark.png` — 2732×2732).

Идентификатор приложения — `com.bigarch.workshopstories` (`capacitor.config.json`). Ориентация закреплена портретная.

Проверка: `npm test`. Лицензии музыки, плейлист и звуки описаны в `music/README.md`.

Вдохновение: [Assemble with Care — заметки разработчиков](https://ustwogames.co.uk/news/building-assemble-with-care/), [рекомендации по размерам элементов управления](https://gameaccessibilityguidelines.com/ensure-interactive-elements-virtual-controls-are-large-and-well-spaced-particularly-on-small-or-touch-screens/). Это оригинальный прототип, игровые материалы из источников не используются.

Для прототипа отдельные изображения покадрового кота в `assets/sprites/` вырезаны из находящегося в проекте `models/PACK/cat 2` без изменения рисунка. По составу набор похож на Last tick, однако происхождение файла и условия для финального релиза ещё нужно подтвердить. Сведения о материалах и лицензиях — в `models/README.md`, `material-library/README.md` и `music/README.md`.

## Инструменты для графики

- `pwsh scripts/adobe/run-photoshop.ps1 <устройство>` — режет `assets/devices/<устройство>/concept-states.png` на детали по контуру (`scripts/split-parts.py`, рамки деталей в `parts.json`) и собирает в Photoshop `source/<устройство>-parts.psd`, где каждая деталь — свой слой.
- `pwsh scripts/adobe/run-illustrator.ps1` — рисует в Illustrator векторную монету `assets/ui/coin.svg` (исходник `assets/ui/source/coin.ai`).

COM-регистрация Photoshop и Illustrator на этой машине пустая, поэтому скрипты `.jsx` передаются программам как файлы. Photoshop и Illustrator при этом открываются на экране.
- Кот в Aseprite: `assets/sprites/cat/source/cat.aseprite` — анимация на таймлайне, теги `idle`, `walk`, `wash`, `sleep`, `stretch` (скорость как в `cat.js`). После правок в Aseprite выполните `pwsh scripts/aseprite/export-cat.ps1` — теги выгрузятся в `assets/sprites/cat/<тег>.png`, которые читает игра. Если меняете число кадров в теге, поправьте `ANIMS` в `cat.js`. `-Build` заново собирает `.aseprite` из текущих PNG.
