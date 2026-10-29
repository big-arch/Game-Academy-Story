import { sceneKind } from './memories.js';
// A small live test bench. No timers survive a closed story or a different order.
export function createObjectScene(order, sound, memoryKey) {
  const kind = ({'pda:ira':'map','laptop:oleg':'render','laptop:nina':'message'})[memoryKey] || (order === 'phone' && memoryKey !== 'phone:dima' ? 'message' : sceneKind(order)), root = document.createElement('section');
  root.className = 'object-scene'; root.dataset.scene = kind;
  root.setAttribute('aria-label', 'Живая проверка устройства');
  const visual = document.createElement('div'); visual.className = 'scene-visual';

  const art = {
    map:'<rect x="14" y="8" width="132" height="72" fill="#bdb68c"/><path fill="none" stroke="#4b7d87" stroke-width="9" d="M25 10 70 36 52 61 107 80"/><path fill="none" stroke="#98644d" stroke-width="3" stroke-dasharray="5 4" d="M40 65 97 45 120 20"/><rect x="115" y="15" width="10" height="10" fill="#5b7952"/>',
    render:'<path fill="#819d95" d="M30 35H130V80H30Z"/><path fill="#517a51" d="M25 23H136V35H25Z"/><path fill="#d8c586" d="M42 45H54V57H42ZM70 45H82V57H70ZM98 45H110V57H98ZM42 64H54V76H42ZM70 64H82V76H70ZM98 64H110V76H98Z"/>',
    archive:'<path fill="#d9c8a1" d="M14 12H72V72H14ZM88 12H146V72H88Z"/><path fill="#729eaa" d="M19 17H67V45H19ZM93 17H141V45H93Z"/><path fill="#c3b179" d="M19 45H67V62H19ZM93 45H141V62H93Z"/><path fill="#497685" d="M19 36H67V50H19ZM93 36H141V50H93Z"/>',
    game:'<path fill="#344b60" d="M0 60 30 22 60 60 98 14 142 60Z"/><path fill="#b3bb79" d="M0 72H160V90H0Z"/><path fill="#84734f" d="M0 78H160V90H0Z"/><g class="scene-player" fill="#e8bc74"><path d="M16 52H28V64H16ZM12 64H32V72H12Z"/></g><g fill="#f4dc86"><path d="m68 40 3 7 8 1-6 5 2 8-7-4-7 4 2-8-6-5 8-1Z"/><path d="M122 57H145V72H122Z"/></g>',
    tape:'<rect x="12" y="15" width="136" height="61" rx="2" fill="#9a7956"/><rect x="22" y="24" width="116" height="36" fill="#273831"/><g class="scene-reel" fill="none" stroke="#c5bc8d" stroke-width="4"><circle cx="45" cy="42" r="13"/><circle cx="115" cy="42" r="13"/><path d="M32 42H58M45 29V55M102 42H128M115 29V55"/></g><path stroke="#c5bc8d" d="M45 56H115"/><path fill="#e0d2aa" d="M54 65H106V70H54Z"/>',
    call:'<rect x="45" y="5" width="70" height="80" fill="#a6b482"/><path fill="#344b3a" d="M55 13H59V23H55ZM62 10H66V23H62ZM69 7H73V23H69ZM91 13H105V22H91Z"/><path fill="none" stroke="#344b3a" stroke-width="7" d="M64 35Q60 61 88 66L94 57 83 51 79 57Q68 53 70 44L77 40 72 32Z"/>',
    air:'<path fill="none" stroke="#b9bba1" stroke-width="9" d="M12 30H115Q145 30 145 60H75"/><g class="scene-confetti" fill="#e9b16b"><rect x="22" y="26" width="6" height="6"/><rect x="54" y="26" width="4" height="5"/><rect x="87" y="26" width="5" height="5"/></g><rect x="38" y="45" width="42" height="30" fill="#8d6a50"/>',
    remote:'<rect x="70" y="8" width="80" height="60" fill="#8d795c"/><rect class="scene-tv" x="76" y="14" width="68" height="46" fill="#688f82"/><path fill="#b9b794" d="M95 70H125V75H95Z"/><rect x="16" y="35" width="23" height="45" fill="#82796b"/><path fill="#cdb382" d="M23 43H31V48H23ZM23 55H31V60H23ZM23 67H31V72H23Z"/>',
    sketch:'<path fill="#c6bc95" d="M12 8H148V82H12Z"/><path fill="none" stroke="#536e67" stroke-width="2" d="M22 63Q80 20 138 63M22 72Q80 30 138 72M39 51V68M62 38V60M87 37V60M111 46V65"/>',
    message:'<rect x="23" y="15" width="114" height="60" fill="#9aaa76"/><path fill="none" stroke="#324b39" stroke-width="3" d="M42 30H118V62H42ZM42 30 80 51 118 30"/>',
    waltz:'<rect x="32" y="35" width="96" height="40" fill="#896549"/><rect x="39" y="40" width="82" height="28" fill="#c3a275"/><g class="scene-reel" fill="none" stroke="#e8cb8f" stroke-width="2"><circle cx="80" cy="48" r="12"/><path d="M68 48H92M80 36V60"/></g><path fill="#c1a171" d="M34 17H126V31H34Z"/>',
  };
  const landscape='<rect x="12" y="8" width="136" height="72" fill="#355567"/><path fill="#82a5a1" d="M15 14H145V50H15Z"/><path fill="#b9b083" d="M15 50H145V73H15Z"/><path fill="#855d48" d="M60 40 80 25 100 40V62H60Z"/><rect x="76" y="48" width="9" height="14" fill="#d5bf80"/>';
  visual.innerHTML='<svg viewBox="0 0 160 90" role="img" aria-label="'+labelsForArt(kind)+'" shape-rendering="crispEdges">'+(art[kind]||landscape)+'</svg>';
  function labelsForArt(k){return {game:'Тестовая игра: герой, звезда и платформа',tape:'Лента и две катушки',call:'Входящий звонок',air:'Прозрачный стенд проверки тяги',remote:'Пульт и тестовый телевизор',sketch:'Восстановленный эскиз моста',map:'Восстановленный маршрут к озеру',render:'Общежитие с садом на крыше',archive:'Две фотографии из семейного архива',message:'Сохранённое сообщение',waltz:'Механизм музыкальной шкатулки'}[k]||'Восстановленная запись';}
  const status = document.createElement('p'); status.setAttribute('role','status');
  const control = document.createElement('button'); control.type = 'button';
  root.append(visual,status,control);
  let finish = null, count = 0, completed = false;
  const labels = {map:'Выбрать маршрут',render:'Завершить рендер',game:'Прыгнуть к звезде',tape:'Настроить скорость ленты',remote:'Нажать кнопку пульта',air:'Включить мотор',call:'Ответить на звонок',message:'Открыть сообщение',sketch:'Показать эскиз',archive:'Восстановить файл',video:'Запустить запись',waltz:'Завести ключ'};
  control.textContent = labels[kind]; control.disabled = true; control.hidden=true;
  let slider;
  if (['tape','video','game'].includes(kind)) {
    slider = document.createElement('input'); slider.type='range'; slider.min='0';slider.max='100';slider.value='15';
    slider.setAttribute('aria-label',kind === 'game' ? 'Сила прыжка' : kind === 'tape' ? 'Скорость ленты' : 'Настройка изображения');
    slider.disabled=true; root.insertBefore(slider,control);
    slider.oninput=()=>{root.style.setProperty('--signal',String(1-Math.abs(Number(slider.value)-50)/60)); status.textContent=kind==='game'?`Сила прыжка: ${slider.value}. Цель: ${[35,65,50][count]}.`:Math.abs(Number(slider.value)-50)<=8?'Сигнал ровный. Можно воспроизводить.':'Совмести настройку с центральной меткой 50.';};
  }
  control.onclick=()=>{
    if (!finish || completed) return;
    const target=kind==='game'?[35,65,50][count]:50;
    if(slider && Math.abs(Number(slider.value)-target)>8){status.textContent=kind==='game'?`Недолёт или перелёт. Подбери силу прыжка около ${target}.`:'Сигнал плывёт. Подстрой ползунок к метке 50.';sound('tool');return;}
    sound('object-'+kind); count++; root.dataset.active='true';
    if(kind==='game' && count<3){root.style.setProperty('--jump',`${count*20}px`);status.textContent=`Звёзды: ${count}/3. Следующий прыжок: сила ${[35,65,50][count]}.`;return;}
    root.style.setProperty('--jump','65px');
    status.textContent=kind==='call'?'Соединение установлено. Клиент снова на связи.':'Проверка пройдена. Можно прочитать историю.';
    completed=true;control.disabled=true;control.hidden=true;if(slider)slider.disabled=true;finish();
  };
  return {element:root,start(done){if(kind==='call')sound('object-call');finish=done;control.hidden=false;control.disabled=false;if(slider)slider.disabled=false;status.textContent=kind==='game'?'Подбери силу первого прыжка: 35. Затем нажми «Прыгнуть».':slider?'Настрой сигнал ползунком, затем запусти воспроизведение.':'Нажми кнопку и посмотри, как оживает вещь.';root.dataset.active='ready';control.focus();},complete(){root.dataset.active='true';control.hidden=true;if(slider)slider.hidden=true;status.textContent='Проверка сохранена в альбоме.';}};
}
