import { IMG, drinkById, catName, rub } from './data.js';
import { add } from './cart.js';
import { notify } from './common.js';

const colors = (d) => `--c:${d.c};--a:${d.a}`;

/** Цветная плитка напитка для полки на главной. */
export function tileHTML(d) {
  return `<li class="tile" style="${colors(d)}">
    <img src="${IMG}${d.img}.webp" width="1100" height="1375" alt="" loading="lazy" style="object-position:${d.pos}">
    <span class="temp">${d.temp}</span>
    <button class="quick" type="button" data-quick="${d.id}" aria-label="Добавить в корзину: ${d.name}">+</button>
    <div class="info"><h3><a href="drink.html?id=${d.id}">${d.name}</a></h3><p class="meta">${d.short}</p>
      <div class="row"><span class="price">${rub(d.price)}</span><span class="mono" style="color:var(--mute)">${catName(d.cat)}</span></div></div>
  </li>`;
}

/** Строка в полном списке напитков. */
export function rowHTML(d) {
  return `<li style="${colors(d)}"><span class="sw" aria-hidden="true"></span>
    <h3><a href="drink.html?id=${d.id}">${d.name}</a><span class="short">${d.short}</span></h3>
    <span class="cat mono">${catName(d.cat)}</span><span class="tmp mono">${d.temp}</span>
    <span class="price">${rub(d.price)}</span>
    <button class="quick" type="button" data-quick="${d.id}" aria-label="Добавить в корзину: ${d.name}">+</button></li>`;
}

/** Обычная порция: размер M, без добавок. */
export function quickAdd(id) {
  const d = drinkById(id);
  add({ id: d.id, size: 'm', milk: 'none', addons: [], sweet: d.sweet ? 50 : undefined, qty: 1 });
  notify(`В корзине: ${d.name}`, 'order.html', 'Оформить');
}

export function bindQuick(root) {
  root.addEventListener('click', (e) => {
    const b = e.target.closest('[data-quick]');
    if (b) quickAdd(b.dataset.quick);
  });
}
