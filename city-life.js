// Мелкая жизнь за окном и на столе поверх нарисованного фона мастерской.
// Координаты — в % коврика, сняты с assets/workshop-*.png (у всех трёх столов верх картинки одинаковый).
// Горящие окна домов: свет иногда гаснет и зажигается снова.
const WINDOWS = [
  [29.27, 5.71, .53, .24], [33.76, 8.33, .43, 1.67], [34.62, 13.86, .43, .3], [42.41, 12.08, .85, .78],
  [43.8, 9.99, .75, .48], [43.8, 12.02, .85, 1], [48.72, 16.3, .53, .65], [51.39, 14.16, .21, 1.07],
  [52.67, 14.69, .75, .89], [58.97, 15.88, .53, 1.6], [62.93, 15.65, .64, .71], [71.05, 11.66, 2.45, 1.3],
];
// Красные огни на крышах.
const BEACONS = [[76, 2.4], [76.3, 3.7], [48.5, 8.9], [61.2, 10.1]];
// Решётка динамика радио и точка, откуда поднимаются ноты.
const RADIO = { left: 89.5, top: 29.8, width: 7, height: 4.6 };
const NOTES = '♪♫♩';
const random = (a, b) => a + Math.random() * (b - a);

export function startCityLife(layer, { isMusicOn = () => false } = {}) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const city = document.createElement('div'); city.className = 'city-lights';
  for (const [x, y, w, h] of WINDOWS) {
    const win = document.createElement('i'); win.className = 'city-window';
    // Тёмная «штора» чуть больше окна, чтобы погашенное окно не оставляло светлой каймы.
    Object.assign(win.style, { left: `${x - .15}%`, top: `${y - .1}%`, width: `${w + .3}%`, height: `${h + .2}%` });
    city.append(win);
  }
  for (const [x, y] of BEACONS) {
    const b = document.createElement('i'); b.className = 'city-beacon';
    Object.assign(b.style, { left: `${x}%`, top: `${y}%`, animationDelay: `${random(0, 2.4).toFixed(2)}s` });
    city.append(b);
  }
  const radio = document.createElement('div'); radio.className = 'radio-glow';
  Object.assign(radio.style, { left: `${RADIO.left}%`, top: `${RADIO.top}%`, width: `${RADIO.width}%`, height: `${RADIO.height}%` });
  const notes = document.createElement('div'); notes.className = 'radio-notes';
  Object.assign(notes.style, { left: `${RADIO.left + 1}%`, top: `${RADIO.top - 1}%` });
  const motes = document.createElement('canvas'); motes.className = 'lamp-motes';
  layer.prepend(city);
  layer.append(radio, notes, motes);

  const windows = [...city.querySelectorAll('.city-window')];
  let lightsTimer = 0, notesTimer = 0, frame = 0, last = 0;
  // Свет в окнах: гасим по одному, не больше трети сразу; погашенные со временем загораются.
  function flipLight() {
    const off = windows.filter(w => w.classList.contains('off'));
    const pool = off.length >= windows.length / 3 || (off.length && Math.random() < .45) ? off : windows.filter(w => !w.classList.contains('off'));
    pool[Math.floor(Math.random() * pool.length)]?.classList.toggle('off');
    lightsTimer = setTimeout(flipLight, random(3500, 9000));
  }
  function spawnNote() {
    if (isMusicOn() && !document.hidden) {
      const n = document.createElement('span'); n.textContent = NOTES[Math.floor(Math.random() * NOTES.length)];
      n.style.setProperty('--drift', `${random(-26, 10).toFixed(0)}px`);
      notes.append(n); setTimeout(() => n.remove(), 3200);
    }
    notesTimer = setTimeout(spawnNote, random(1100, 2000));
  }
  layer.classList.toggle('music-on', isMusicOn());

  // Пылинки в луче лампы: медленный дрейф, яркость следует за мерцанием лампы (--lamp).
  const ctx = motes.getContext('2d'); const dust = [];
  for (let i = 0; i < 26; i++) dust.push({ x: Math.random(), y: Math.random(), r: random(.6, 1.6), vx: random(-.012, .012), vy: random(-.02, -.004), phase: Math.random() * 6.28 });
  function resize() { const r = motes.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2); motes.width = Math.max(1, Math.round(r.width * d)); motes.height = Math.max(1, Math.round(r.height * d)); }
  new ResizeObserver(resize).observe(motes); resize();
  function draw(time) {
    const dt = Math.min((time - last) / 1000 || 0, .05); last = time;
    if (!layer.offsetParent) { frame = requestAnimationFrame(draw); return; } // стол скрыт — не рисуем
    layer.classList.toggle('music-on', isMusicOn());
    const lamp = parseFloat(getComputedStyle(layer).getPropertyValue('--lamp')) || 1;
    const scale = motes.width / 200;
    ctx.clearRect(0, 0, motes.width, motes.height);
    for (const p of dust) {
      p.phase += dt; p.x += (p.vx + Math.sin(p.phase) * .004) * dt; p.y += p.vy * dt;
      if (p.y < -.05) { p.y = 1.05; p.x = Math.random(); }
      if (p.x < -.05) p.x = 1.05; else if (p.x > 1.05) p.x = -.05;
      // Ярче в центре луча (правый верх), тусклее к краям.
      const beam = Math.max(0, 1 - Math.hypot(p.x - .78, p.y - .25) * 1.25);
      ctx.fillStyle = `rgba(255,226,160,${(beam * .85 * lamp * (.6 + .4 * Math.sin(p.phase * 2))).toFixed(3)})`;
      ctx.beginPath(); ctx.arc(p.x * motes.width, p.y * motes.height, p.r * scale, 0, 6.283); ctx.fill();
    }
    frame = requestAnimationFrame(draw);
  }
  function sync() {
    clearTimeout(lightsTimer); clearTimeout(notesTimer); cancelAnimationFrame(frame); last = 0;
    if (reduced.matches || document.hidden) { ctx.clearRect(0, 0, motes.width, motes.height); return; }
    lightsTimer = setTimeout(flipLight, random(2000, 5000)); spawnNote(); frame = requestAnimationFrame(draw);
  }
  document.addEventListener('visibilitychange', sync); reduced.addEventListener('change', sync); sync();
}
