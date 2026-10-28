// Кот на рабочем столе: кадры из models/PACK/cat 2, вырезанные в assets/sprites/cat/.
// Кот живёт в своей зоне (data-min/data-max — центр по X, data-floor — линия лап, в % коврика),
// поэтому не залезает на кружку, ноутбук и другие нарисованные предметы.
const ANIMS = {
  idle: { frames: 11, fps: 5, loop: true, faces: 0, bottomPadding: 0 },
  walk: { frames: 6, fps: 9, loop: true, faces: -1, bottomPadding: 2 },
  wash: { frames: 8, fps: 8, loop: false, faces: 0, bottomPadding: 2 },
  sleep: { frames: 2, fps: 1.2, loop: true, faces: 1, bottomPadding: 8 },
  stretch: { frames: 5, fps: 6, loop: false, faces: 1, bottomPadding: 2 },
};
const WALK_SPEED = 7; // % ширины коврика в секунду
const random = (a, b) => a + Math.random() * (b - a);

export function createCat(el) {
  const min = Number(el.dataset.min), max = Number(el.dataset.max);
  el.style.setProperty('--cat-floor', `${el.dataset.floor}%`);
  el.style.setProperty('--cat-size', `${el.dataset.size}%`);
  const sprite = document.createElement('span'); sprite.className = 'cat-sprite'; sprite.setAttribute('aria-hidden', 'true');
  el.replaceChildren(sprite);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let x = (min + max) / 2, target = x, facing = 1, anim = 'idle', frame = 0, frameTime = 0, last = 0, raf = 0, timer = 0, active = false, onDone = null, onArrival = null, hasBed = false;

  function play(name, done = null) {
    anim = name; frame = 0; frameTime = 0; onDone = done;
    sprite.style.backgroundImage = `url('assets/sprites/cat/${name}.png')`;
    sprite.style.backgroundSize = `${ANIMS[name].frames * 100}% 100%`;
    draw();
  }
  function draw() {
    const { frames, faces, bottomPadding } = ANIMS[anim];
    sprite.style.backgroundPosition = `${frames > 1 ? frame / (frames - 1) * 100 : 0}% 0`;
    // Кадры нарисованы смотрящими в одну сторону; разворачиваем по направлению взгляда.
    // All animations share a 48×34 canvas but sleep has eight empty bottom rows.
    // Keep the visible paws/body on the same floor, including on the purchased bed.
    sprite.style.transform = `translateY(${bottomPadding / 34 * 100}%) scaleX(${faces && faces !== facing ? -1 : 1})`;
    el.style.left = `${x}%`;
  }
  function tick(time) {
    const dt = Math.min((time - last) / 1000 || 0, 0.1); last = time;
    const a = ANIMS[anim];
    frameTime += dt;
    if (frameTime >= 1 / a.fps) {
      frameTime = 0;
      if (frame < a.frames - 1) frame++;
      else if (a.loop) frame = 0;
      else if (onDone) { const done = onDone; onDone = null; done(); }
    }
    if (anim === 'walk') {
      const step = WALK_SPEED * dt, d = target - x;
      if (Math.abs(d) <= step) { x = target; const arrived = onArrival || idle; onArrival = null; arrived(); } else x += Math.sign(d) * step;
    }
    draw();
    raf = requestAnimationFrame(tick);
  }
  function schedule(ms, fn) { clearTimeout(timer); timer = setTimeout(fn, ms); }
  function idle() {
    play('idle');
    schedule(random(4000, 9000), () => {
      const roll = Math.random();
      if (max - min > 8 && roll < 0.55) walkTo(random(min, max));
      else if (roll < 0.75) play('wash', idle);
      else if (hasBed && Math.abs(x - min) > 1) walkTo(min, sleep);
      else sleep();
    });
  }
  function walkTo(to, arrived = idle) {
    if (Math.abs(to - x) < 1) { arrived(); return; }
    target = to; onArrival = arrived; facing = to > x ? 1 : -1; clearTimeout(timer); play('walk');
  }
  function sleep() { play('sleep'); schedule(random(10000, 20000), () => play('stretch', idle)); }

  return {
    setBed(value) { hasBed = Boolean(value); },
    // Касание: спящий кот просыпается и потягивается, бодрствующий умывается.
    pet() {
      clearTimeout(timer);
      if (anim === 'sleep') play('stretch', idle);
      else play('wash', idle);
      if (!active) draw();
      return anim === 'stretch' ? 'wake' : 'wash';
    },
    setActive(on) {
      on = on && !reduced.matches;
      if (on === active) return;
      active = on;
      if (on) { last = 0; idle(); raf = requestAnimationFrame(tick); }
      else { cancelAnimationFrame(raf); clearTimeout(timer); if (anim === 'walk') x = target; play('idle'); }
    },
  };
}
