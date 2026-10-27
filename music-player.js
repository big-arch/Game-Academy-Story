export const GAME_TRACKS = [
  'music/gameplay/first-snow.ogg', 'music/gameplay/laundry-on-the-wire.ogg',
  'music/gameplay/everything-you-ever-dreamed.ogg', 'music/gameplay/keeping-cool.ogg',
  'music/gameplay/snow-drift.ogg', 'music/gameplay/windows-down.ogg', 'music/gameplay/two-hour-delay.ogg'
];
export function createShuffleBag(tracks, random = Math.random) {
  if (!tracks.length) throw new Error('Playlist must contain at least one track');
  let bag = [], last = null;
  return () => {
    if (!bag.length) {
      bag = [...tracks];
      for (let i = bag.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [bag[i], bag[j]] = [bag[j], bag[i]]; }
      if (bag.length > 1 && bag[0] === last) [bag[0],bag[1]] = [bag[1],bag[0]];
    }
    last = bag.shift(); return last;
  };
}
export function createMusicPlayer(onError) {
  const audio = document.createElement('audio'); audio.hidden = true; audio.setAttribute('aria-hidden','true'); audio.preload = 'none'; audio.volume = .24; document.body.append(audio);
  const next = createShuffleBag(GAME_TRACKS); let enabled = false, mode = null;
  const choose = () => mode === 'game' ? next() : 'music/menu/forget-me-not.ogg';
  function start() { audio.src = choose(); audio.play().catch(() => { enabled=false; onError(); }); }
  audio.addEventListener('ended',()=>{if(enabled)start();});
  audio.addEventListener('error',()=>{if(enabled){enabled=false;onError();}});
  return {
    setMode(nextMode) { if (mode === nextMode) return; mode = nextMode; if (enabled) start(); else { audio.removeAttribute('src'); audio.load(); } },
    async enable() { enabled=true; if(!audio.src)audio.src=choose(); try { await audio.play(); return true; } catch { enabled=false;onError();return false; } },
    disable() { enabled=false; audio.pause(); },
  };
}
