import { drinkById, unitPrice } from './data.js';

const KEY = 'chasha-cart';

/* В корзине хранятся только id напитка, параметры и количество. Цена всегда считается заново из меню. */
export function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(raw) ? raw.filter((i) => i && drinkById(i.id) && Number.isInteger(i.qty) && i.qty > 0 && i.qty < 100) : [];
  } catch { return []; }
}
function save(list) {
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { /* приватный режим */ }
  document.dispatchEvent(new CustomEvent('cart:change'));
}
export const keyOf = (i) => `${i.id}|${i.size}|${i.milk || 'none'}|${[...(i.addons || [])].sort().join('+')}|${i.sweet ?? ''}`;

export function add(item) {
  const list = load();
  const k = keyOf(item);
  const found = list.find((i) => keyOf(i) === k);
  if (found) found.qty = Math.min(9, found.qty + item.qty);
  else list.push({ ...item });
  save(list);
}
export function setQty(k, qty) {
  const list = load();
  const item = list.find((i) => keyOf(i) === k);
  if (!item) return;
  item.qty = Math.max(1, Math.min(9, qty));
  save(list);
}
export function remove(k) { save(load().filter((i) => keyOf(i) !== k)); }
export function clear() { save([]); }
export const count = () => load().reduce((s, i) => s + i.qty, 0);
export const total = () => load().reduce((s, i) => s + unitPrice(drinkById(i.id), i) * i.qty, 0);
