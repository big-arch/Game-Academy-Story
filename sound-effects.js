export function createSoundEffects() {
  let enabled = true;
  const rain = new Audio('sounds/ambience/rainy-not-loopable.ogg'); rain.volume=.08; rain.preload='none';
  // Kenney interface sounds
  const files = {
    click: 'assets/kenney-interface-sounds/Audio/click_002.ogg',
    tool: 'assets/kenney-interface-sounds/Audio/switch_001.ogg',
    repair: 'assets/kenney-interface-sounds/Audio/close_001.ogg',
    purr: 'assets/kenney-interface-sounds/Audio/glass_001.ogg',
  };
  // Fallback: Kenney RPG SFX
  const fallbackFiles = {
    click: 'assets/kenney-rpg-sfx/OGG/handleCoins.ogg',
    tool: 'assets/kenney-rpg-sfx/OGG/cloth1.ogg',
    repair: 'assets/kenney-rpg-sfx/OGG/beltHandle1.ogg',
    purr: 'assets/kenney-rpg-sfx/OGG/chop.ogg',
  };
  let inWorkshop = false;
  function play(name='click') {
    if (!enabled) return;
    const src = files[name] || fallbackFiles[name] || files.click;
    const sound = new Audio(src);
    sound.volume = name === 'purr' ? .25 : .18;
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
  return {play, setEnabled(value){enabled=value;syncRain();}, get enabled(){return enabled;}, setWorkshop(value){if(inWorkshop===value)return;inWorkshop=value;syncRain();}};
}
