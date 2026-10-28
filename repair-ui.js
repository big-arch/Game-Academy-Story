// Stage-specific controls: an essential action must never live off-screen in a carousel.
export function deviceActions(config, repair) {
  if (repair.open) {
    const actions = [['dev-cover', 'Закрыть корпус']];
    if (!repair.inside || repair.diagnosed) actions.push(['dev-inspect', 'Осмотр внутри']);
    if (repair.inside && !repair.diagnosed) {
      actions.push(...config.causes.map(cause => [`ddiag-${cause.id}`, `Причина: ${cause.label}`]));
    }
    return actions;
  }
  return [
    ['dev-inspect', 'Осмотр'],
    ['dev-test', 'Проверить'],
    ...(repair.repaired ? [['dev-finish', 'Вернуть клиенту']] : []),
  ];
}

export function targetState(repair, fix, tool) {
  if (repair.fixed.includes(fix.id)) return 'done';
  if (!repair.diagnosed || (fix.after || []).some(id => !repair.fixed.includes(id))) return 'inspect';
  return tool === fix.tool ? 'ready' : 'available';
}
