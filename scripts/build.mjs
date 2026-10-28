// Сборка игры для Capacitor.
//   node scripts/build.mjs vendor — только упаковать supabase-js в vendor/supabase.js (нужно и для npm start)
//   node scripts/build.mjs        — vendor + копия игры в www/ (webDir Capacitor)
import { build } from 'esbuild';
import { cp, mkdir, readdir, rm, stat } from 'node:fs/promises';
import { join, resolve, extname } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const out = join(root, 'www');

await build({
  stdin: { contents: "export { createClient } from '@supabase/supabase-js';", resolveDir: root },
  bundle: true,
  format: 'esm',
  target: 'es2020',
  minify: true,
  outfile: join(root, 'vendor', 'supabase.js'),
  logLevel: 'warning',
});

if (process.argv[2] === 'vendor') process.exit(0);

// Только то, что игра загружает в рантайме. Исходники моделей, музыки и temp/ в сборку не попадают.
const files = (await readdir(root)).filter(f => (f.endsWith('.js') || f.endsWith('.css') || f === 'index.html') && !f.endsWith('.test.js') && f !== 'server.js');
const dirs = ['vendor', 'assets/sprites', 'assets/devices/cassette-player/concept-states.png', 'assets/devices/remote/parts', 'assets/devices/pager/parts', 'assets/devices/phone/parts', 'assets/devices/game-console/parts', 'assets/devices/vacuum/parts', 'assets/devices/boombox/parts', 'assets/devices/pda/parts', 'assets/devices/video-camera/parts', 'assets/devices/vcr/parts', 'assets/devices/television/parts', 'assets/devices/music-box/parts', 'assets/room', 'assets/ui/coin.svg', 'assets/ui/tools', 'assets/ui/marks', 'assets/ui/finds', 'assets/ui/screw-lying.png', 'music/menu', 'music/gameplay', 'sounds/ambience'];
const audioDirs = ['assets/kenney-interface-sounds/Audio', 'assets/kenney-rpg-sfx/OGG'];

await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
for (const f of files) await cp(join(root, f), join(out, f));
for (const f of await readdir(join(root, 'assets'))) if (extname(f) === '.png') await cp(join(root, 'assets', f), join(out, 'assets', f));
// Общему столу нужны только картинки видов; пульт собран из отдельных деталей, поэтому его копируем целиком.
const wanted = src => {
  const path = src.replaceAll('\\', '/');
  return !path.split('/').at(-1).startsWith('.') && !path.endsWith('/source') && !path.includes('/source/') && !path.endsWith('.md') && !path.endsWith('.psd') && !path.endsWith('.aseprite') && (!path.includes('/parts/') || path.includes('/remote/') || /view-[a-z]+\.png$/.test(path));
};
for (const d of dirs) await cp(join(root, d), join(out, d), { recursive: true, filter: wanted });
for (const d of audioDirs) await cp(join(root, d), join(out, d), { recursive: true, filter: src => !extname(src) || extname(src) === '.ogg' });

let total = 0;
const walk = async dir => { for (const e of await readdir(dir, { withFileTypes: true })) { const p = join(dir, e.name); e.isDirectory() ? await walk(p) : total += (await stat(p)).size; } };
await walk(out);
console.log(`www/ готов: ${(total / 1048576).toFixed(1)} МБ`);
