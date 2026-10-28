export function focusedFix(fixes, repair, preferred) {
  const pending = fixes.filter(f => !repair.fixed.includes(f.id));
  return pending.find(f => f.id === preferred) || pending.find(f => !(f.after || []).some(id => !repair.fixed.includes(id))) || pending[0] || null;
}
export function cycleFix(fixes, repair, current, direction) {
  const pending = fixes.filter(f => !repair.fixed.includes(f.id));
  if (!pending.length) return null;
  const index = pending.findIndex(f => f.id === current);
  return pending[(Math.max(0,index) + direction + pending.length) % pending.length];
}

export function createPartNavigator(bench, { change, open, assemble }) {
  const node = document.createElement('nav'); node.className = 'repair-navigator'; node.setAttribute('aria-label','Узлы устройства'); node.hidden = true;
  const prev = document.createElement('button'); prev.textContent = '‹'; prev.setAttribute('aria-label','Предыдущий узел');
  const current = document.createElement('button'); current.className = 'repair-current';
  const next = document.createElement('button'); next.textContent = '›'; next.setAttribute('aria-label','Следующий узел');
  node.append(prev,current,next); bench.append(node);
  let selected = null, key = '', lastFixes = [], repair;
  const move = direction => { selected = cycleFix(lastFixes,repair,selected,direction)?.id || null; change(); };
  prev.onclick = () => move(-1); next.onclick = () => move(1);
  current.onclick = () => selected ? open(selected) : assemble();
  return {
    render(state, fixes, visible) {
      const id = `${state.order}:${state.client}`;
      if (id !== key) { key = id; selected = null; }
      repair = state.dev; lastFixes = fixes;
      selected = focusedFix(fixes,repair,selected)?.id || null;
      node.hidden = !visible; bench.classList.toggle('has-part-focus',visible && repair.diagnosed);
      const done = fixes.filter(f => repair.fixed.includes(f.id)).length;
      const name = selected ? fixes.find(f => f.id === selected).label : 'Узлы готовы · собрать корпус';
      current.replaceChildren();
      const count = document.createElement('small'); count.textContent = `${done}/${fixes.length} готово`;
      const title = document.createElement('span'); title.textContent = repair.diagnosed ? name : 'Осмотреть устройство';
      current.append(count,title); current.setAttribute('aria-label',repair.diagnosed ? name : 'Осмотреть устройство');
      prev.disabled = next.disabled = !repair.diagnosed || fixes.length - done <= 1;
      return selected;
    },
    position(device) {
      if (node.hidden) return;
      const d = device.getBoundingClientRect(), b = bench.getBoundingClientRect();
      node.style.top = `${Math.max(6,d.top - b.top - node.offsetHeight - 8)}px`;
    },
  };
}
