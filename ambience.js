// The rain is simulated as independent droplets, not replayed as a fixed animation.
export function startAmbience(mat) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const layer = document.createElement('div'); layer.className = 'ambience'; layer.setAttribute('aria-hidden','true');
  layer.innerHTML = '<canvas class="rain-canvas"></canvas><div class="plant-motion"></div><div class="lamp-glow"></div><div class="tea-steam"><i></i><i></i><i></i></div>';
  mat.prepend(layer);
  const canvas = layer.querySelector('canvas'); const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const drops = []; let frame = 0, last = 0, flickerTimer = 0, flashTimer = 0;
  const random = (a,b) => a + Math.random() * (b-a);
  function newDrop(initial = false) { return {x:random(-.1,1.1), y:initial?random(-.2,1.1):random(-.35,-.05), speed:random(.32,.75), length:random(.025,.09), opacity:random(.12,.42), drift:random(.025,.09)}; }
  function resize() { const r=canvas.getBoundingClientRect(), d=Math.min(devicePixelRatio || 1,2); canvas.width=Math.max(1,Math.round(r.width*d)); canvas.height=Math.max(1,Math.round(r.height*d)); }
  const observer = new ResizeObserver(resize); observer.observe(canvas); resize();
  for (let i=0;i<38;i++) drops.push(newDrop(true));
  function draw(time) {
    const dt=Math.min((time-last)/1000 || 0,.05);last=time;
    ctx.clearRect(0,0,canvas.width,canvas.height);ctx.lineWidth=Math.max(1,canvas.width/380);ctx.lineCap='square';
    for(let i=0;i<drops.length;i++){let d=drops[i];d.y+=d.speed*dt;d.x-=d.drift*dt;if(d.y>1.15){d=newDrop();drops[i]=d;}ctx.strokeStyle=`rgba(182,215,228,${d.opacity})`;ctx.beginPath();ctx.moveTo(d.x*canvas.width,d.y*canvas.height);ctx.lineTo((d.x-d.drift*.15)*canvas.width,(d.y+d.length)*canvas.height);ctx.stroke();}
    frame=requestAnimationFrame(draw);
  }
  function scheduleFlicker() { flickerTimer=setTimeout(()=>{ if(!document.hidden && !reduced.matches){layer.classList.add('lamp-flicker');flashTimer=setTimeout(()=>layer.classList.remove('lamp-flicker'),random(90,170));} scheduleFlicker(); },random(12000,30000)); }
  function sync() { cancelAnimationFrame(frame);clearTimeout(flickerTimer);clearTimeout(flashTimer);layer.classList.remove('lamp-flicker');last=0;if(!reduced.matches && !document.hidden){frame=requestAnimationFrame(draw);scheduleFlicker();}else ctx.clearRect(0,0,canvas.width,canvas.height); }
  document.addEventListener('visibilitychange',sync); reduced.addEventListener('change',sync);sync();
}
