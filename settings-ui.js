import { t } from './i18n.js';
import { getLanguage, setLanguage } from './i18n.js';
export function createSettingsUI({beforeChange,restart}) {
 const dialog=document.createElement('dialog');dialog.className='settings-dialog';document.body.append(dialog);
 let opener;
 function frame(title){opener=document.activeElement;dialog.replaceChildren();const h=document.createElement('h2');h.textContent=title;dialog.append(h);dialog.setAttribute('aria-label',title);}
 function button(label,run,primary=false){const b=document.createElement('button');b.type='button';b.textContent=label;if(primary)b.className='primary';b.onclick=run;dialog.append(b);return b;}
 function close(){dialog.close();opener?.focus({preventScroll:true});}
 return {
 confirmRestart(){frame(t('Начать сначала?'));const p=document.createElement('p');p.textContent=t('Все заказы, монеты, покупки, находки и письма будут сброшены. Выбранный язык сохранится.');dialog.append(p);const cancel=button(t('Продолжить игру'),close,true);button(t('Сбросить прогресс'),()=>{try{restart();dialog.close();}catch{p.textContent=t('Не удалось сбросить прогресс. Текущая игра сохранена.');}});dialog.showModal();cancel.focus();},
 showLanguages(){frame(t('Языки / Languages'));const p=document.createElement('p');p.textContent=t('Язык изменится после перезагрузки. Прогресс сохранится.');dialog.append(p);
 for(const [code,label]of [['en','English'],['ru','Русский']]){const b=button(label,()=>{if(code===getLanguage()){close();return;}beforeChange();if(setLanguage(code))location.reload();else p.textContent=t('Не удалось сохранить язык. Проверь доступ к локальному хранилищу.');});b.lang=code;b.setAttribute('aria-pressed',String(code===getLanguage()));}
 button(t('Назад'),close);dialog.showModal();}
 };
}
