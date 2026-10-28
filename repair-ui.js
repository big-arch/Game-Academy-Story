// Stage-specific controls: an essential action must never live off-screen in a carousel.
export function deviceActions(config, repair) {
  if (repair.open) {
    const actions = [['dev-cover', 'Закрыть корпус']];
    actions.push(['dev-inspect', 'Осмотр внутри']);
    return actions;
  }
  return [
    ['dev-inspect', 'Осмотр'],
    ['dev-test', 'Проверить'],
    ...(repair.repaired ? [['dev-finish', 'Вернуть клиенту']] : []),
  ];
}

export function diagnosisChoices(order, config) {
  if (config) return config.causes.map(c => [`ddiag-${c.id}`, `Причина: ${c.label}`]);
  const labels = order === 'remote' ? [['battery','батарейки'],['led','светодиод'],['contacts','контакты']] : [['battery','батарея'],['head','головка'],['belt','ремень']];
  return labels.map(([id,label]) => [`${order === 'remote' ? 'rdiag-' : 'diagnose-'}${id}`, `Причина: ${label}`]);
}

export function targetState(repair, fix, tool) {
  if (repair.fixed.includes(fix.id)) return 'done';
  if (!repair.diagnosed || (fix.after || []).some(id => !repair.fixed.includes(id))) return 'inspect';
  return tool === fix.tool ? 'ready' : 'available';
}
