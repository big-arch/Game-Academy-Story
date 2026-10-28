"""Check runtime repair anchors against the actual transparent artwork.

Uses Pillow, already used by split-parts.py. Run from any working directory:
    python scripts/audit-device-layout.py
"""
import json
import subprocess
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
manifest = json.loads(subprocess.check_output([
    'node', '--input-type=module', '-e',
    "import {DEVICES,viewSrc} from './devices.js';"
    "import contains from './research/open-source/phaser/Contains.cjs';"
    "for(const [id,c] of Object.entries(DEVICES)){if(c.outline){"
    "const shape={points:c.outline.map(([x,y])=>({x,y}))};"
    "for(const [x,y] of c.screws)if(!contains(shape,x,y))throw Error(id+': screw outside outline');}}"
    "console.log(JSON.stringify(Object.entries(DEVICES).map(([id,c])=>"
    "({id,screws:c.screws,closed:viewSrc(id,'closed'),open:viewSrc(id,'open'),fixes:[...c.fixes,...(c.hidden?[c.hidden.fix]:[])]}))));",
], cwd=ROOT, text=True, encoding='utf-8'))

errors = []
for device in manifest:
    image = Image.open(ROOT / device['closed']).convert('RGBA')
    for index, screw in enumerate(device['screws'], 1):
        if len(screw) not in (2, 3) or (len(screw) == 3 and screw[2] not in ('long', 'short')):
            errors.append(f"{device['id']}: screw {index} has an invalid format or size")
            continue
        x, y = screw[:2]
        if not (0 <= x <= 100 and 0 <= y <= 100):
            errors.append(f"{device['id']}: screw {index} outside coordinate range")
            continue
        point = (round(x / 100 * (image.width - 1)), round(y / 100 * (image.height - 1)))
        if image.getpixel(point)[3] < 200:
            errors.append(f"{device['id']}: screw {index} outside painted casing at {point}")
    for fix in device['fixes']:
        if not (0 <= fix['x'] <= 100 and 0 <= fix['y'] <= 100):
            errors.append(f"{device['id']}: repair point {fix['id']} outside coordinate range")
    print(f"{device['id']}: {len(device['screws'])} screws, {len(device['fixes'])} repair points")

if errors:
    raise SystemExit('\n'.join(errors))
print(f'OK: anchors checked for {len(manifest)} devices')
