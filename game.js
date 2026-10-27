export const initialState = () => ({ stage: 'intro', inspected: false, tested: false, poweredOff: false, open: false, screws: 0, screwMask: 0, assembling: false, dust: 0, dustMask: 0, dustCleaned: false, fanConnected: false, thermalChecked: false, paste: false, repaired: false, upgrade: false, coins: 0, order: null, cassetteOpen: false, cScrews: 0, cScrewMask: 0, cassetteAssembling: false, tapeClipFixed: false, beltReplaced: false, headCleaned: false, cassetteTested: false, cassetteInteriorInspected: false, cassetteDiagnosed: false, cassetteRepaired: false });
export function act(s, action, target) {
  const n = { ...s };
  let message = '';
  switch (action) {
    case 'accept': n.stage = 'work'; n.order = 'laptop'; message = 'Заказ принят. Изучи симптомы, прежде чем разбирать ноутбук.'; break;
    case 'inspect': n.inspected = true; message = n.open ? 'Внутри скопилась пыль. Провод вентилятора неплотно сидит в разъёме; паста под радиатором сухая.' : 'На решётке видна пыль. Из корпуса почти не выходит тёплый воздух.'; break;
    case 'test':
      if (n.open) { message = 'Сначала установи крышку для проверки.'; break; }
      if (n.poweredOff) { message = 'Подключи питание, чтобы запустить проверку.'; break; }
      if (n.screwMask) { message = 'Перед проверкой закрепи все винты крышки.'; break; }
      n.tested = true;
      if (n.dustCleaned && n.fanConnected && n.paste) { n.repaired = true; message = 'Тест пройден: вентилятор вращается, температура стабильна. Фотографии сохранены!'; }
      else if (n.fanConnected) message = 'Вентилятор теперь вращается, но температура всё ещё растёт. Возможно, тепло плохо передаётся радиатору.';
      else message = 'Диагностика: температура быстро растёт, вентилятор не слышно.';
      break;
    case 'power': if (n.open && n.poweredOff) { message = 'Сначала закрой крышку.'; break; } if (n.poweredOff && n.assembling && n.screwMask) { message = 'Сначала закрепи все винты крышки.'; break; } n.poweredOff = !n.poweredOff; message = n.poweredOff ? 'Питание отключено. Теперь можно открыть корпус.' : 'Питание подключено.'; break;
    case 'cover':
      if (!n.open && !n.poweredOff) { message = 'Сначала отключи питание — работать с включённой техникой опасно.'; break; }
      if (!n.open && n.screws < 4) { message = `Крышку держат винты: откручено ${n.screws} из 4.`; break; }
      n.open = !n.open; n.assembling = !n.open; message = n.open ? 'Крышка снята. Что можно узнать при осмотре?' : 'Крышка установлена. Закрепи все четыре винта.'; break;
    case 'screw': if (!n.poweredOff || n.open) message = 'Отключи питание и закрой крышку для работы с винтами.'; else if (!Number.isInteger(target) || target < 0 || target > 3) message = 'Выбери один из винтов на крышке.'; else { const bit = 1 << target; if (n.assembling) { if (!(n.screwMask & bit)) { message = 'Этот винт уже закреплён.'; break; } n.screwMask &= ~bit; n.screws = n.screwMask.toString(2).replaceAll('0','').length; message = n.screws ? `Закреплено винтов: ${4 - n.screws} из 4.` : 'Все винты закреплены. Можно подключить питание.'; if (!n.screws) n.assembling = false; } else { if (n.screwMask & bit) { message = 'Этот винт уже снят.'; break; } n.screwMask |= bit; n.screws = n.screwMask.toString(2).replaceAll('0','').length; message = `Винты крышки: ${n.screws} из 4 откручено.`; } } break;
    case 'clean': if (!n.open) message = 'Вентилятор находится под крышкой.'; else if (!Number.isInteger(target) || target < 0 || target > 2) message = 'Выбери загрязнённый участок.'; else { const bit = 1 << target; if (n.dustMask & bit) { message = 'Здесь уже чисто.'; break; } n.dustMask |= bit; n.dust = n.dustMask.toString(2).replaceAll('0','').length; n.dustCleaned = n.dust === 3; message = n.dustCleaned ? 'Пыль удалена; теперь воздушный канал чистый.' : `Очищаем вентилятор: ${n.dust} из 3 участков.`; } break;
    case 'connect': if (!n.open) message = 'Разъём находится под крышкой.'; else { n.fanConnected = true; message = 'Провод вентилятора подключён.'; } break;
    case 'thermal': if (!n.open) message = 'Радиатор находится под крышкой.'; else { n.thermalChecked = true; message = 'Старая термопаста высохла и потрескалась.'; } break;
    case 'paste': if (!n.open || !n.thermalChecked) message = 'Сначала осмотри радиатор.'; else { n.paste = true; message = 'Старая паста удалена, нанесён тонкий новый слой.'; } break;
    case 'finish': if (n.stage === 'work' && n.order === 'laptop' && n.repaired) { n.stage = 'ending'; n.coins += 120; message = 'Заказ завершён! Получено 120 монет.'; } else message = 'Сначала добейся успешной проверки устройства.'; break;
    case 'upgrade': if (n.upgrade) message = 'Лампа уже улучшена.'; else if (n.coins < 120) message = 'Для улучшения лампы нужно 120 монет.'; else { n.coins -= 120; n.upgrade = true; message = 'Новая лампа куплена. В мастерской стало теплее.'; } break;
    // Кассетный плеер
    case 'cassette-accept': n.stage = 'work'; n.order = 'cassette'; message = 'Заказ принят: кассетный плеер не протягивает ленту.'; break;
    case 'cassette-inspect': n.inspected = true; if (n.cassetteOpen) n.cassetteInteriorInspected = true; message = n.cassetteOpen ? 'Приводной ремень растянут, головка загрязнена, лента ослаблена.' : 'Внешний осмотр: плеер включается, но лента не протягивается.'; break;
    case 'cassette-cover': if (!n.cassetteOpen && n.cScrews < 3) { message = 'Сначала открути все винты.'; break; } n.cassetteOpen = !n.cassetteOpen; n.cassetteAssembling = !n.cassetteOpen; message = n.cassetteOpen ? 'Корпус открыт. Внутри виден механизм.' : 'Корпус закрыт. Закрепи три винта.'; break;
    case 'cassette-screw': if (n.cassetteOpen) { message = 'Сначала снимите винты.'; break; } if (!Number.isInteger(target) || target < 0 || target > 2) { message = 'Выбери один из винтов.'; break; } const cb = 1 << target; if (n.cassetteAssembling) { if (!(n.cScrewMask & cb)) { message = 'Этот винт уже закреплён.'; break; } n.cScrewMask &= ~cb; n.cScrews = n.cScrewMask.toString(2).replaceAll('0','').length; message = n.cScrews ? `Закреплено винтов: ${3 - n.cScrews} из 3.` : 'Все винты закреплены. Можно проверить плеер.'; if (!n.cScrews) n.cassetteAssembling = false; } else { if (n.cScrewMask & cb) { message = 'Этот винт уже снят.'; break; } n.cScrewMask |= cb; n.cScrews = n.cScrewMask.toString(2).replaceAll('0','').length; message = `Винты сняты: ${n.cScrews} из 3.`; } break;
    case 'cassette-tape': if (!n.cassetteOpen || n.cScrews < 3) { message = 'Сними все винты, чтобы добраться до ленты.'; break; } n.tapeClipFixed = true; message = 'Клип ленты восстановлен. Лента больше не выпадает.'; break;
    case 'cassette-diagnose': if (!n.cassetteOpen || !n.cassetteInteriorInspected) { message = 'Сначала открой и осмотри механизм.'; break; } if (target === 'belt') { n.cassetteDiagnosed = true; message = 'Верно: ремень растянулся и проскальзывает. Замени его после ремонта клипа.'; } else if (target === 'battery') message = 'Плеер включается: батарея подаёт питание. Что мешает вращению?'; else if (target === 'head') message = 'Грязная головка влияет на звук, но не останавливает ленту. Посмотри на привод.'; else message = 'Выбери предполагаемую причину.'; break;
    case 'cassette-belt': if (!n.cassetteOpen) { message = 'Сначала открой корпус.'; break; } if (!n.cassetteDiagnosed) { message = 'Сначала осмотри механизм и определи причину неисправности.'; break; } if (!n.tapeClipFixed) { message = 'Сначала почини клип ленты.'; break; } n.beltReplaced = true; message = 'Новый приводной ремень установлен. Механизм протяжки работает!'; break;
    case 'cassette-head': if (!n.cassetteOpen) { message = 'Сначала открой корпус.'; break; } n.headCleaned = true; message = 'Головка очищена. Звук станет чище.'; break;
    case 'cassette-test': if (n.cassetteAssembling && n.cScrewMask) { message = 'Сначала закрепи винты корпуса.'; break; } if (n.cassetteOpen) { message = 'Сначала закрой корпус.'; break; } if (!n.beltReplaced || !n.tapeClipFixed || !n.headCleaned) { message = 'Плеер ещё работает неправильно. Проверь механизм и головку.'; break; } n.cassetteTested = true; n.cassetteRepaired = true; message = 'Плеер работает! Кассета протягивается, звук чистый.'; break;
    case 'cassette-finish': if (n.stage === 'work' && n.order === 'cassette' && n.cassetteRepaired) { n.stage = 'ending'; n.repaired = true; n.coins += 120; message = 'Заказ завершён! Получено 120 монет.'; } else message = 'Сначала пройдите проверку.'; break;
    default: message = 'Неизвестное действие.';
  }
  return { state: n, message };
}
