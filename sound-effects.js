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
