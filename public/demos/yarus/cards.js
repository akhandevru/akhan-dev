import { STATUS, corpusById, mln, m2, bedsText } from './data.js';
import { planSVG } from './plan.js';

const viewText = (v) => v.toLowerCase().replace('река', 'реку');

/** Карточка квартиры: мини-планировка, цена и статус. */
export function cardHTML(f) {
  const c = corpusById(f.corpus);
  const title = `${bedsText(f.beds, f.pent)}, ${m2(f.area)}`;
  return `<a class="flat-card ${f.status}" href="flat.html?id=${f.id}" aria-label="${title}, ${c.name}, ${f.floor} этаж, ${STATUS[f.status].toLowerCase()}${f.status === 'sold' ? '' : `, ${mln(f.price)}`}">
    <div class="tile">${planSVG(f, { mini: true })}${f.status === 'sold' ? '' : `<span class="pill price">${mln(f.price)}</span>`}<span class="pill state ${f.status}">${STATUS[f.status]}</span></div>
    <div class="info"><b>${title}</b><span>${c.name}, ${f.floor} этаж, вид на ${viewText(f.view)}</span></div>
  </a>`;
}
