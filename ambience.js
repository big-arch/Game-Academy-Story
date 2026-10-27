// The rain is simulated as independent droplets, not replayed as a fixed animation.
export function startAmbience(mat, onThunder = () => {}) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const layer = document.createElement('div'); layer.className = 'ambience'; layer.setAttribute('aria-hidden','true');
  layer.innerHTML = '<canvas class="rain-canvas"></canvas><div class="lightning-flash"></div><div class="plant-motion"></div><div class="lamp-pool"></div><div class="lamp-bulb"></div><div class="lamp-glow"></div><div class="tea-steam"><i></i><i></i><i></i></div>';
  mat.prepend(layer);
  const canvas = layer.querySelector('canvas'); const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const drops = []; let frame = 0, last = 0, flickerTimer = 0, flashTimer = 0, stormTimer = 0, thunderTimer = 0;
  const random = (a,b) => a + Math.random() * (b-a);
  function newDrop(initial = false) { return {x:random(-.1,1.1), y:initial?random(-.2,1.1):random(-.35,-.05), speed:random(.32,.75), length:random(.025,.09), opacity:random(.35,.8), drift:random(.025,.09)}; }
  function resize() { const r=canvas.getBoundingClientRect(), d=Math.min(devicePixelRatio || 1,2); canvas.width=Math.max(1,Math.round(r.width*d)); canvas.height=Math.max(1,Math.round(r.height*d)); }
  const observer = new ResizeObserver(resize); observer.observe(canvas); resize();
  for (let i=0;i<65;i++) drops.push(newDrop(true));
  function draw(time) {
    const dt=Math.min((time-last)/1000 || 0,.05);last=time;
    ctx.clearRect(0,0,canvas.width,canvas.height);ctx.lineWidth=Math.max(1,canvas.width/240);ctx.lineCap='square';
    for(let i=0;i<drops.length;i++){let d=drops[i];d.y+=d.speed*dt;d.x-=d.drift*dt;if(d.y>1.15){d=newDrop();drops[i]=d;}ctx.strokeStyle=`rgba(182,215,228,${d.opacity})`;ctx.beginPath();ctx.moveTo(d.x*canvas.width,d.y*canvas.height);ctx.lineTo((d.x-d.drift*.15)*canvas.width,(d.y+d.length)*canvas.height);ctx.stroke();}
    frame=requestAnimationFrame(draw);
  }
  // Старая лампа: свет постоянно чуть дрожит, а иногда спотыкается серией коротких провалов.
  const setLamp = v => layer.style.setProperty('--lamp', v.toFixed(2));
  function shimmer() { setLamp(random(.88,1)); flickerTimer=setTimeout(shimmer,random(90,220)); }
  function stutter() {
    const steps=[.12,1,.35,.95,.05,.8,1].slice(0,Math.round(random(3,7)));
    let i=0; clearTimeout(flickerTimer);
    const next=()=>{ if(i<steps.length){ setLamp(steps[i++]); flickerTimer=setTimeout(next,random(45,110)); } else { shimmer(); flashTimer=setTimeout(stutter,random(6000,15000)); } };
    next();
  }
  function scheduleFlicker() { shimmer(); flashTimer=setTimeout(stutter,random(3000,8000)); }
  function scheduleStorm() { stormTimer=setTimeout(()=>{ if (!document.hidden && !reduced.matches && !mat.closest('.bench').hidden) { layer.classList.add('lightning'); setTimeout(()=>layer.classList.remove('lightning'),500); thunderTimer=setTimeout(onThunder, random(700,1800)); } scheduleStorm(); },random(22000,50000)); }
  function sync() { cancelAnimationFrame(frame);clearTimeout(flickerTimer);clearTimeout(flashTimer);clearTimeout(stormTimer);clearTimeout(thunderTimer);setLamp(1);last=0;if(!reduced.matches && !document.hidden){frame=requestAnimationFrame(draw);scheduleFlicker();scheduleStorm();}else ctx.clearRect(0,0,canvas.width,canvas.height); }
  document.addEventListener('visibilitychange',sync); reduced.addEventListener('change',sync);sync();
}
