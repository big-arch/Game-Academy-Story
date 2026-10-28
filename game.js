import { DEVICES } from './devices.js';
import { purchaseDecoration } from './workshop.js';
import { campaignProgress } from './campaign.js';
import { memoryAvailable, memoryFor, memoryProgress } from './memories.js';
export const initialState = () => ({ stage: 'intro', inspected: false, tested: false, poweredOff: false, open: false, screws: 0, screwMask: 0, assembling: false, dust: 0, dustMask: 0, dustCleaned: false, fanConnected: false, thermalChecked: false, paste: false, repaired: false, upgrade: false, coins: 0, memories: [], memoryActions: [], memoryRead: false, memoryActionDone: false, furniture: [], order: null, cassetteOpen: false, cScrews: 0, cScrewMask: 0, cassetteAssembling: false, tapeClipFixed: false, beltReplaced: false, headCleaned: false, cassetteTested: false, cassetteInteriorInspected: false, cassetteDiagnosed: false, cassetteRepaired: false, rOpen: false, rScrewMask: 0, rAssembling: false, rInspectedInside: false, rDiagnosed: false, rGrimeMask: 0, rKeypadClean: false, rRepaired: false, client: null, clues: [], dev: null });
export const REWARDS = { laptop: 120, cassette: 120, remote: 80 };
export const allFixes = (cfg, d) => [...cfg.fixes, ...(cfg.hidden && d?.hiddenFound ? [cfg.hidden.fix] : [])];
export const CARE_BONUS = 15; // за ремонт без промахов
export const TIP_PER_CLUE = 10; // чаевые за каждую найденную историю на корпусе
// Оплата заказа плюс чаевые за внимание к деталям.
function pay(n, order) { const base = REWARDS[order] ?? DEVICES[order].reward, slips = n.dev?.slips ?? null, care = slips === 0 ? CARE_BONUS : 0, careless = slips >= 3 ? 10 : 0, tips = Math.max(0, TIP_PER_CLUE * n.clues.length + care - careless); n.coins += base + tips; const progress = campaignProgress(n); n.completedOrders = [...new Set([...progress.completedOrders, order])]; n.jobsCompleted = progress.jobsCompleted + 1; return `Заказ завершён! Получено ${base} монет` + (tips ? ` и ${tips} чаевых` : '') + (care ? ' — клиент заметил, как аккуратно ты работал.' : careless ? '. Клиент заметил лишнюю возню и оставил меньше.' : tips ? ' за внимание к деталям.' : '.'); }
const bits = mask => mask.toString(2).replaceAll('0', '').length;
export function act(s, action, target) {
  const n = { ...s };
  let message = '';
  switch (action) {
    case 'memory-read': {
      if (!memoryAvailable(s)) { message = 'Сначала успешно проверь собранное устройство.'; break; }
      const memory = memoryFor(s), progress = memoryProgress(s);
      n.memories = [...new Set([...progress.memories, memory.key])]; n.memoryRead = true;
      n.memoryActionDone = progress.memoryActions.includes(memory.key);
      message = 'История сохранена в альбоме мастерской.'; break;
    }
    case 'memory-action': {
      if (!memoryAvailable(s) || !s.memoryRead) { message = 'Сначала открой историю на экране устройства.'; break; }
      const memory = memoryFor(s), progress = memoryProgress(s);
      n.memoryActions = [...new Set([...progress.memoryActions, memory.key])]; n.memoryActionDone = true;
      message = 'Воспоминание сохранено вместе с историей клиента.'; break;
    }
    case 'accept': n.stage = 'work'; n.order = 'laptop'; n.client = target || null; message = 'Заказ принят. Изучи симптомы, прежде чем разбирать ноутбук.'; break;
    case 'inspect': n.inspected = true; message = n.open ? 'Внутри скопилась пыль. Провод вентилятора неплотно сидит в разъёме; паста под радиатором сухая.' : 'На решётке видна пыль. Из корпуса почти не выходит тёплый воздух.'; break;
    case 'test':
      if (n.open) { message = 'Сначала установи крышку для проверки.'; break; }
      if (n.poweredOff) { message = 'Подключи питание, чтобы запустить проверку.'; break; }
      if (n.screwMask) { message = 'Перед проверкой закрепи все винты крышки.'; break; }
      n.tested = true;
      if (n.dustCleaned && n.fanConnected && n.paste) { n.repaired = true; message = 'Тест пройден: вентилятор вращается, температура стабильна. Файлы снова доступны!'; }
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
    case 'finish': if (n.stage === 'work' && n.order === 'laptop' && n.repaired) { n.stage = 'ending'; message = pay(n, 'laptop'); } else message = 'Сначала добейся успешной проверки устройства.'; break;
    case 'buy-decoration': return purchaseDecoration(s, target);
    case 'upgrade': return purchaseDecoration(s, 'lamp');
    // Кассетный плеер
    case 'cassette-accept': n.stage = 'work'; n.order = 'cassette'; n.client = target || null; message = 'Заказ принят: кассетный плеер не протягивает ленту.'; break;
    case 'cassette-inspect': n.inspected = true; if (n.cassetteOpen) n.cassetteInteriorInspected = true; message = n.cassetteOpen ? 'Приводной ремень растянут, головка загрязнена, лента ослаблена. Что мешает протяжке? Сопоставь следы с причиной.' : 'Внешний осмотр: плеер включается, но лента не протягивается.'; break;
    case 'cassette-cover': if (!n.cassetteOpen && n.cScrews < 3) { message = 'Сначала открути все винты.'; break; } n.cassetteOpen = !n.cassetteOpen; n.cassetteAssembling = !n.cassetteOpen; message = n.cassetteOpen ? 'Корпус открыт. Внутри виден механизм.' : 'Корпус закрыт. Закрепи три винта.'; break;
    case 'cassette-screw': if (n.cassetteOpen) { message = 'Сначала снимите винты.'; break; } if (!Number.isInteger(target) || target < 0 || target > 2) { message = 'Выбери один из винтов.'; break; } const cb = 1 << target; if (n.cassetteAssembling) { if (!(n.cScrewMask & cb)) { message = 'Этот винт уже закреплён.'; break; } n.cScrewMask &= ~cb; n.cScrews = n.cScrewMask.toString(2).replaceAll('0','').length; message = n.cScrews ? `Закреплено винтов: ${3 - n.cScrews} из 3.` : 'Все винты закреплены. Можно проверить плеер.'; if (!n.cScrews) n.cassetteAssembling = false; } else { if (n.cScrewMask & cb) { message = 'Этот винт уже снят.'; break; } n.cScrewMask |= cb; n.cScrews = n.cScrewMask.toString(2).replaceAll('0','').length; message = `Винты сняты: ${n.cScrews} из 3.`; } break;
    case 'cassette-tape': if (!n.cassetteOpen || n.cScrews < 3) { message = 'Сними все винты, чтобы добраться до ленты.'; break; } n.tapeClipFixed = true; message = 'Клип ленты восстановлен. Лента больше не выпадает.'; break;
    case 'cassette-diagnose': if (!n.cassetteOpen || !n.cassetteInteriorInspected) { message = 'Сначала открой и осмотри механизм.'; break; } if (target === 'belt') { n.cassetteDiagnosed = true; message = 'Верно: ремень растянулся и проскальзывает. Замени его после ремонта клипа.'; } else if (target === 'battery') message = 'Плеер включается: батарея подаёт питание. Что мешает вращению?'; else if (target === 'head') message = 'Грязная головка влияет на звук, но не останавливает ленту. Посмотри на привод.'; else message = 'Выбери предполагаемую причину.'; break;
    case 'cassette-belt': if (!n.cassetteOpen) { message = 'Сначала открой корпус.'; break; } if (!n.cassetteDiagnosed) { message = n.cassetteInteriorInspected ? 'Коснись детали и выбери причину неисправности.' : 'Сначала осмотри механизм: инструмент «Осмотр» и коснись плеера.'; break; } if (!n.tapeClipFixed) { message = 'Сначала почини клип ленты — коснись ▥ на левой катушке.'; break; } n.beltReplaced = true; message = 'Новый приводной ремень установлен. Механизм протяжки работает!'; break;
    case 'cassette-head': if (!n.cassetteOpen) { message = 'Сначала открой корпус.'; break; } n.headCleaned = true; message = 'Головка очищена. Звук станет чище.'; break;
    case 'cassette-test': if (n.cScrewMask) { message = 'Сначала закрепи винты корпуса.'; break; } if (n.cassetteOpen) { message = 'Сначала закрой корпус.'; break; } if (!n.beltReplaced || !n.tapeClipFixed || !n.headCleaned) { message = 'Плеер ещё работает неправильно. Проверь механизм и головку.'; break; } n.cassetteTested = true; n.cassetteRepaired = true; message = 'Плеер работает! Кассета протягивается, звук чистый.'; break;
    case 'cassette-finish': if (n.stage === 'work' && n.order === 'cassette' && n.cassetteRepaired) { n.stage = 'ending'; n.repaired = true; message = pay(n, 'cassette'); } else message = 'Сначала пройдите проверку.'; break;
    // Пульт: западают кнопки из-за липкого налёта на контактах
    case 'remote-accept': n.stage = 'work'; n.order = 'remote'; n.client = target || null; message = 'Заказ принят: у пульта не работает половина кнопок.'; break;
    case 'remote-inspect': if (n.rOpen) { n.rInspectedInside = true; message = 'На плате под кнопками липкие пятна — похоже, пролили сладкий чай. Светодиод и батарейки выглядят целыми. Сопоставь следы с причиной.'; } else message = 'Красная кнопка работает: светодиод мигает. Цифры и стрелки не отвечают и слегка липнут.'; break;
    case 'remote-screw': {
      if (n.rOpen) { message = 'Сначала закрой корпус.'; break; }
      if (!Number.isInteger(target) || target < 0 || target > 2) { message = 'Выбери один из винтов.'; break; }
      const bit = 1 << target;
      if (n.rAssembling) { if (!(n.rScrewMask & bit)) { message = 'Этот винт уже закреплён.'; break; } n.rScrewMask &= ~bit; message = n.rScrewMask ? `Закреплено винтов: ${3 - bits(n.rScrewMask)} из 3.` : 'Все винты закреплены. Можно проверить пульт.'; if (!n.rScrewMask) n.rAssembling = false; }
      else { if (n.rScrewMask & bit) { message = 'Этот винт уже снят.'; break; } n.rScrewMask |= bit; message = `Винты сняты: ${bits(n.rScrewMask)} из 3.`; }
      break;
    }
    case 'remote-cover': if (!n.rOpen && (n.rAssembling || n.rScrewMask !== 7)) { message = 'Сначала открути все три винта.'; break; } n.rOpen = !n.rOpen; n.rAssembling = !n.rOpen; message = n.rOpen ? 'Передняя панель снята вместе с резиновой клавиатурой. Осмотри плату.' : 'Корпус закрыт. Закрути три винта.'; break;
    case 'remote-diagnose': if (!n.rOpen || !n.rInspectedInside) { message = 'Сначала открой корпус и осмотри плату.'; break; } if (target === 'contacts') { n.rDiagnosed = true; message = 'Верно: липкий налёт мешает кнопкам замыкать контакты. Очисти плату и клавиатуру спиртом.'; } else if (target === 'battery') message = 'Красная кнопка работает, значит питание есть. Дело не в батарейках.'; else if (target === 'led') message = 'Светодиод мигает от красной кнопки — он исправен.'; else message = 'Выбери предполагаемую причину.'; break;
    case 'remote-clean': if (!n.rOpen) { message = 'Плата под крышкой.'; break; } if (!n.rDiagnosed) { message = n.rInspectedInside ? 'Коснись детали и выбери причину неисправности.' : 'Сначала осмотри плату: инструмент «Осмотр» и коснись пульта.'; break; } if (!Number.isInteger(target) || target < 0 || target > 2) { message = 'Выбери пятно на плате.'; break; } { const bit = 1 << target; if (n.rGrimeMask & bit) { message = 'Здесь уже чисто.'; break; } n.rGrimeMask |= bit; message = n.rGrimeMask === 7 ? 'Контакты на плате чистые.' : `Очищено пятен: ${bits(n.rGrimeMask)} из 3.`; } break;
    case 'remote-keypad': if (!n.rOpen) { message = 'Клавиатура внутри корпуса.'; break; } if (!n.rDiagnosed) { message = n.rInspectedInside ? 'Коснись детали и выбери причину неисправности.' : 'Сначала осмотри плату: инструмент «Осмотр» и коснись пульта.'; break; } n.rKeypadClean = true; message = 'Резиновая клавиатура протёрта, кнопки больше не липнут.'; break;
    case 'remote-test': if (n.rOpen) { message = 'Сначала закрой корпус.'; break; } if (n.rAssembling || n.rScrewMask) { message = 'Сначала закрути винты корпуса.'; break; } if (n.rGrimeMask !== 7 || !n.rKeypadClean) { message = n.rDiagnosed ? 'Часть кнопок всё ещё не отвечает. Проверь плату и клавиатуру.' : 'Цифры и стрелки по-прежнему не работают. Загляни внутрь.'; break; } n.rRepaired = true; message = 'Все кнопки отвечают! Светодиод мигает на каждое нажатие.'; break;
    case 'remote-finish': if (n.stage === 'work' && n.order === 'remote' && n.rRepaired) { n.stage = 'ending'; n.repaired = true; message = pay(n, 'remote'); } else message = 'Сначала проверь пульт.'; break;
    // Общий движок для устройств из devices.js (пейджер, телефон, приставка…).
    case 'dev-accept': { const cfg = DEVICES[target?.order]; if (!cfg) { message = 'Неизвестное устройство.'; break; } n.stage = 'work'; n.order = target.order; n.client = target.client || null; n.dev = { open: false, screwMask: 0, assembling: false, inside: false, diagnosed: false, fixed: [], repaired: false, hiddenFound: false, slips: 0 }; message = cfg.accept; break; }
    case 'dev-inspect': { const cfg = DEVICES[n.order], d = n.dev; if (!cfg || !d) break; if (d.open) { n.dev = { ...d, inside: true }; message = cfg.inside + (d.diagnosed ? '' : ' Выбери причину.'); } else message = cfg.outside; break; }
    case 'dev-screw': {
      const cfg = DEVICES[n.order], d = { ...n.dev }; if (!cfg) break;
      if (d.open) { message = 'Сначала закрой корпус.'; break; }
      if (!Number.isInteger(target) || target < 0 || target >= cfg.screws.length) { message = 'Выбери один из винтов.'; break; }
      const bit = 1 << target, total = cfg.screws.length;
      if (d.assembling) { if (!(d.screwMask & bit)) { message = 'Этот винт уже закреплён.'; break; } d.screwMask &= ~bit; message = d.screwMask ? `Закреплено винтов: ${total - bits(d.screwMask)} из ${total}.` : 'Все винты закреплены. Можно проверять.'; if (!d.screwMask) d.assembling = false; }
      else { if (d.screwMask & bit) { message = 'Этот винт уже снят.'; break; } d.screwMask |= bit; message = `Винты сняты: ${bits(d.screwMask)} из ${total}.`; }
      n.dev = d; break;
    }
    case 'dev-cover': { const cfg = DEVICES[n.order], d = { ...n.dev }; if (!cfg) break; if (!d.open && (d.assembling || d.screwMask !== (1 << cfg.screws.length) - 1)) { message = 'Сначала открути все винты.'; break; } d.open = !d.open; d.assembling = !d.open; message = d.open ? 'Крышка снята. Осмотри, что внутри.' : `Корпус закрыт. Закрути винты: ${cfg.screws.length}.`; n.dev = d; break; }
    case 'dev-diagnose': { const cfg = DEVICES[n.order], d = n.dev; if (!cfg) break; if (!d.open || !d.inside) { message = 'Сначала открой корпус и осмотри, что внутри.'; break; } const cause = cfg.causes.find(c => c.id === target); if (!cause) { message = 'Выбери предполагаемую причину.'; break; } n.dev = cause.correct ? { ...d, diagnosed: true } : { ...d, slips: (d.slips || 0) + 1 }; message = cause.reply; break; }
    case 'dev-fix': {
      const cfg = DEVICES[n.order], d = n.dev, fix = cfg && allFixes(cfg, n.dev).find(f => f.id === target); if (!fix) { message = 'Здесь нечего чинить.'; break; }
      if (!d.open) { message = 'Сначала сними крышку.'; break; }
      if (!d.diagnosed) { message = d.inside ? 'Коснись детали и выбери причину неисправности.' : 'Сначала осмотри, что внутри: инструмент «Осмотр» и коснись устройства.'; break; }
      if (d.fixed.includes(fix.id)) { message = 'Здесь уже всё сделано.'; break; }
      if (fix.after?.some(id => !d.fixed.includes(id))) { message = fix.notReady || 'Сначала сделай предыдущий шаг.'; break; }
      n.dev = { ...d, fixed: [...d.fixed, fix.id] }; message = fix.text; break;
    }
    case 'dev-test': { const cfg = DEVICES[n.order], d = n.dev; if (!cfg) break; if (d.open) { message = 'Сначала закрой корпус.'; break; } if (d.assembling || d.screwMask) { message = 'Сначала закрути винты корпуса.'; break; } if (allFixes(cfg, d).some(f => !d.fixed.includes(f.id))) { n.dev = { ...d, slips: (d.slips || 0) + 1 }; message = cfg.testFail; break; }
      // Скрытая поломка: всё сделано по списку, а проверка выявляет новую причину — разбираем снова.
      if (cfg.hidden && !d.hiddenFound) { n.dev = { ...d, hiddenFound: true }; message = cfg.hidden.reveal; break; }
      n.dev = { ...d, repaired: true }; message = cfg.testOk; break; }
    case 'dev-finish': if (n.stage === 'work' && DEVICES[n.order] && n.dev?.repaired) { n.stage = 'ending'; n.repaired = true; message = pay(n, n.order); } else message = 'Сначала проверь устройство.'; break;
    // След истории на корпусе: текст показывает интерфейс, здесь только учёт для чаевых.
    case 'clue': if (n.stage !== 'work' || typeof target !== 'string') { message = 'Здесь нечего рассматривать.'; break; } if (n.clues.includes(target)) { message = 'Эту историю ты уже знаешь.'; break; } n.clues = [...n.clues, target]; break;
    default: message = 'Неизвестное действие.';
  }
  // Opening a tested device or changing its hardware invalidates the old test.
  const hardware = ['open', 'screwMask', 'poweredOff', 'dustMask', 'fanConnected', 'paste', 'cassetteOpen', 'cScrewMask', 'tapeClipFixed', 'beltReplaced', 'headCleaned', 'rOpen', 'rScrewMask', 'rGrimeMask', 'rKeypadClean'];
  if (n.stage === 'work' && hardware.some(key => n[key] !== s[key])) {
    n.repaired = false;
    if (n.order === 'cassette') { n.cassetteRepaired = false; n.cassetteTested = false; }
    if (n.order === 'remote') n.rRepaired = false;
  }
  if (n.stage === 'work' && ['dev-cover', 'dev-screw', 'dev-fix'].includes(action) && n.dev !== s.dev) {
    n.dev = { ...n.dev, repaired: false }; n.repaired = false;
  }
  return { state: n, message };
}
