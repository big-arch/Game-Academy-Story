export function createSoundEffects() {
  let enabled = true;
  const rain = new Audio('sounds/ambience/rainy-not-loopable.ogg'); rain.volume=.18; rain.preload='none'; rain.loop=true;
  // Kenney interface sounds
  const files = {
    click: 'assets/kenney-interface-sounds/Audio/click_002.ogg',
    tool: 'assets/kenney-interface-sounds/Audio/switch_001.ogg',
    repair: 'assets/kenney-interface-sounds/Audio/close_001.ogg',
    purr: 'assets/kenney-interface-sounds/Audio/glass_001.ogg',
    coin: 'assets/kenney-rpg-sfx/OGG/handleCoins.ogg',
  };
  // Fallback: Kenney RPG SFX
  const fallbackFiles = {
    click: 'assets/kenney-rpg-sfx/OGG/handleCoins.ogg',
    tool: 'assets/kenney-rpg-sfx/OGG/cloth1.ogg',
    repair: 'assets/kenney-rpg-sfx/OGG/beltHandle1.ogg',
    purr: 'assets/kenney-rpg-sfx/OGG/chop.ogg',
  };
  let inWorkshop = false;
  let audioContext;
  function unlockAudio() {
    try { audioContext ||= new (window.AudioContext || window.webkitAudioContext)(); if (audioContext.state === 'suspended') audioContext.resume().catch(()=>{}); } catch {}
  }
  function playThunder() {
    if (!enabled || !inWorkshop || !audioContext || audioContext.state !== 'running') return;
    const context = audioContext, length = Math.floor(context.sampleRate * 2.8);
    const buffer = context.createBuffer(1, length, context.sampleRate), data = buffer.getChannelData(0);
    for (let i=0; i<length; i++) data[i] = Math.random()*2-1;
    const source=context.createBufferSource(), filter=context.createBiquadFilter(), gain=context.createGain();
    source.buffer=buffer; filter.type='lowpass'; filter.frequency.value=160;
    const now=context.currentTime; gain.gain.setValueAtTime(.001,now); gain.gain.exponentialRampToValueAtTime(.38,now+.13); gain.gain.exponentialRampToValueAtTime(.001,now+2.8);
    source.connect(filter); filter.connect(gain); gain.connect(context.destination); source.start();
  }
  function play(name='click') {
    if (!enabled) return;
    unlockAudio();
    if (name.startsWith('object-') && audioContext?.state === 'running') {
      const kind=name.slice(7), profiles={game:[523,659,784],call:[440,480,440,480],tape:[262,330,392,330],video:[330,392,523],air:[75,95,110],remote:[1568],waltz:[523,659,784,659],message:[880,1174],sketch:[392,523],archive:[330,440,659]};
      const notes=profiles[kind]||profiles.message, now=audioContext.currentTime;
      notes.forEach((frequency,i)=>{const osc=audioContext.createOscillator(),gain=audioContext.createGain(),t=now+i*.16;osc.type=kind==='game'?'triangle':'sine';osc.frequency.value=frequency;gain.gain.setValueAtTime(.001,t);gain.gain.exponentialRampToValueAtTime(.025,t+.02);gain.gain.exponentialRampToValueAtTime(.001,t+.15);osc.connect(gain);gain.connect(audioContext.destination);osc.start(t);osc.stop(t+.16);});return;
    }
    if (name === 'memory' && audioContext?.state === 'running') {
      const now = audioContext.currentTime;
      for (const [delay, frequency] of [[0,880],[.15,1174]]) {
        const oscillator = audioContext.createOscillator(), gain = audioContext.createGain();
        oscillator.type = 'sine'; oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(.001, now + delay); gain.gain.exponentialRampToValueAtTime(.025, now + delay + .015); gain.gain.exponentialRampToValueAtTime(.001, now + delay + .12);
        oscillator.connect(gain); gain.connect(audioContext.destination); oscillator.start(now + delay); oscillator.stop(now + delay + .13);
      }
      return;
    }
    const src = files[name] || fallbackFiles[name] || files.click;
    const sound = new Audio(src);
    sound.volume = name === 'purr' ? .25 : name === 'coin' ? .12 : .18;
    sound.play().catch(()=>{
      // If Kenney sound fails, try original path
      if (files[name]) {
        const fb = fallbackFiles[name] || files.click;
        const retry = new Audio(fb);
        retry.volume = sound.volume;
        retry.play().catch(()=>{});
      }
    });
  }
  function syncRain() { if(enabled && inWorkshop){ if(rain.paused)rain.play().catch(()=>{}); } else rain.pause(); }
  return {play, playThunder, setEnabled(value){enabled=value;syncRain();}, get enabled(){return enabled;}, setWorkshop(value){if(inWorkshop===value)return;inWorkshop=value;syncRain();}};
}
