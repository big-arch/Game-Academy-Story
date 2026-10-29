import {parse} from 'acorn';
import {readFileSync,readdirSync} from 'node:fs';
import {EN} from '../locale-en.js';
const errors=[],used=new Set(),cyrillic=/[А-Яа-яЁё]/;
const placeholders=text=>[...text.matchAll(/\{\{(\d+)\}\}/g)].map(m=>m[1]).sort().join(',');
for(const [ru,en]of Object.entries(EN)){
 if(!en.trim()||cyrillic.test(en))errors.push('Invalid English: '+ru);
 if(placeholders(ru)!==placeholders(en))errors.push('Placeholder mismatch: '+ru);
}
for(const file of readdirSync('.').filter(f=>f.endsWith('.js')&&!f.endsWith('.test.js')&&!['locale-en.js','server.js'].includes(f))){
 const ast=parse(readFileSync(file,'utf8'),{ecmaVersion:'latest',sourceType:'module'});
 function walk(node,parent){if(!node||typeof node!=='object')return;
 if(node.type==='Literal'&&typeof node.value==='string'&&cyrillic.test(node.value)&&node.value!=='Русский'&&!(parent?.type==='CallExpression'&&parent.callee.name==='t'))errors.push('Unlocalized literal in '+file+': '+node.value);
 if(node.type==='TemplateLiteral'&&node.quasis.some(q=>cyrillic.test(q.value.cooked))&&!(parent?.type==='TaggedTemplateExpression'&&parent.tag.name==='t'))errors.push('Unlocalized template in '+file);
 if(node.type==='CallExpression'&&node.callee.name==='t'&&typeof node.arguments[0]?.value==='string')used.add(node.arguments[0].value);
 if(node.type==='TaggedTemplateExpression'&&node.tag.name==='t'){const q=node.quasi;used.add(q.quasis.map((p,i)=>p.value.cooked+(i<q.expressions.length?'{{'+i+'}}':'')).join(''));}
 for(const value of Object.values(node)){if(Array.isArray(value))value.forEach(child=>walk(child,node));else if(value?.type)walk(value,node);}
 }walk(ast);
}
const html=readFileSync('index.html','utf8');
for(const match of html.matchAll(/>([^<>]+)</g)){const text=match[1].trim();if(cyrillic.test(text))used.add(text);}
for(const match of html.matchAll(/(?:aria-label|title|placeholder|alt)="([^"]+)"/g))if(cyrillic.test(match[1]))used.add(match[1]);
for(const key of used)if(cyrillic.test(key)&&!Object.hasOwn(EN,key))errors.push('Missing: '+key);
if(errors.length){console.error(errors.join('\n'));process.exitCode=1;}else console.log(`${Object.keys(EN).length} English entries; ${used.size} source texts covered; placeholders valid.`);
