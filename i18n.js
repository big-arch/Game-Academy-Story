import { EN } from './locale-en.js';

export const LANGUAGE_KEY = 'workshop-stories-language';
export const LANGUAGES = ['en', 'ru'];
export function readLanguage(storage) {
  try { const saved = storage?.getItem(LANGUAGE_KEY); return LANGUAGES.includes(saved) ? saved : 'en'; }
  catch { return 'en'; }
}
let language = typeof window === 'undefined'
  ? (typeof process !== 'undefined' && process.env.WORKSHOP_LANGUAGE === 'en' ? 'en' : 'ru')
  : (() => { try { return readLanguage(window.localStorage); } catch { return 'en'; } })();
export function getLanguage() { return language; }
export function setLanguage(value) {
  if (!LANGUAGES.includes(value)) return false;
  try { if (typeof window !== 'undefined') window.localStorage.setItem(LANGUAGE_KEY, value); }
  catch { return false; }
  language = value;
  return true;
}
// Tagged templates retain interpolation order even when the English sentence changes.
export function t(source, ...values) {
  const key = Array.isArray(source)
    ? source.map((part, i) => part + (i < values.length ? `{{${i}}}` : '')).join('')
    : source;
  const text = language === 'en' ? (EN[key] ?? key) : key;
  return values.length ? text.replace(/\{\{(\d+)\}\}/g, (_, index) => String(values[Number(index)])) : text;
}
export function localizeDocument(root = document) {
  document.documentElement.lang = language;
  document.title = t(document.title);
  const walker = document.createTreeWalker(root.body, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (node.parentElement?.closest('script,style')) continue;
    const original = node.nodeValue, trimmed = original.trim();
    if (trimmed) node.nodeValue = original.replace(trimmed, t(trimmed));
  }
  root.querySelectorAll('[aria-label],[title],[placeholder],[alt]').forEach(element => {
    for (const attr of ['aria-label', 'title', 'placeholder', 'alt']) {
      if (element.hasAttribute(attr)) element.setAttribute(attr, t(element.getAttribute(attr)));
    }
  });
}
