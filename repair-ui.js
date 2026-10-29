import { t } from './i18n.js';
// Stage-specific controls: an essential action must never live off-screen in a carousel.
export function deviceActions(config, repair) {
  if (repair.open) {
    const actions = [['dev-cover', t('Закрыть корпус')]];
    actions.push(['dev-inspect', t('Осмотр внутри')]);
    return actions;
  }
  return [
    ['dev-inspect', t('Осмотр')],
    ['dev-test', t('Проверить')],
    ...(repair.repaired ? [['dev-finish', t('Вернуть клиенту')]] : []),
  ];
}

export function diagnosisChoices(order, config) {
  if (config) return config.causes.map(c => [`ddiag-${c.id}`, t`Причина: ${c.label}`]);
  const labels = order === 'remote' ? [['battery',t('батарейки')],['led',t('светодиод')],['contacts',t('контакты')]] : [['battery',t('батарея')],['head',t('головка')],['belt',t('ремень')]];
  return labels.map(([id,label]) => [`${order === 'remote' ? 'rdiag-' : 'diagnose-'}${id}`, t`Причина: ${label}`]);
}

export function targetState(repair, fix, tool) {
  if (repair.fixed.includes(fix.id)) return 'done';
  if (!repair.diagnosed || (fix.after || []).some(id => !repair.fixed.includes(id))) return 'inspect';
  return tool === fix.tool ? 'ready' : 'available';
}
