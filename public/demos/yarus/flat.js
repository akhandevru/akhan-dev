import { FLATS, STATUS, flatById, corpusById, mortgage, rub, mln, m2, bedsText } from './data.js';
import { planSVG } from './plan.js';
import { cardHTML } from './cards.js';

const root = document.getElementById('flat');
const narrow = matchMedia('(max-width: 640px)');
const id = new URLSearchParams(location.search).get('id');
const flat = flatById(id) || FLATS.find((f) => f.status === 'free');
const c = corpusById(flat.corpus);
const title = `${bedsText(flat.beds, flat.pent)}, ${m2(flat.area)}`;
document.title = `${title} - Ярус`;

const pay = mortgage(flat.price, 0.3, 20, 'base');
const similar = FLATS
  .filter((f) => f.id !== flat.id && f.status === 'free' && f.beds === flat.beds && f.pent === flat.pent)
  .sort((a, b) => Math.abs(a.price - flat.price) - Math.abs(b.price - flat.price))
  .slice(0, 3);
const view = flat.view.toLowerCase().replace('река', 'реку');

root.innerHTML = `
  <nav class="crumbs" aria-label="Навигационная цепочка">
    <a href="apartments.html">Квартиры</a><span aria-hidden="true">/</span>
    <a href="apartments.html?corpus=${c.id}">${c.name}</a><span aria-hidden="true">/</span>
    <span aria-current="page">Квартира ${flat.floor}${String(flat.pos).padStart(2, '0')}</span>
  </nav>
  ${id && !flatById(id) ? '<p class="empty">Такой квартиры нет в продаже. Показываем ближайшую свободную.</p>' : ''}
  <div class="flat-grid">
    <figure class="card plan">
      <div id="plan-svg">${planSVG(flat, { short: narrow.matches })}</div>
      <figcaption>Планировка условная, размеры комнат могут отличаться на 3-5%.</figcaption>
    </figure>
    <div class="flat-info">
      <span class="badge ${flat.status}">${STATUS[flat.status]}</span>
      <h1>${title}</h1>
      <p class="flat-meta">${c.name}, ${flat.floor} этаж. Вид на ${view}.</p>
      <dl class="specs">
        <div><dt>Площадь</dt><dd>${m2(flat.area)}</dd></div>
        <div><dt>Потолки</dt><dd>${flat.ceiling.toLocaleString('ru-RU')} м</dd></div>
        <div><dt>Цена за м²</dt><dd>${rub(Math.round(flat.price / flat.area / 1000) * 1000)}</dd></div>
        <div><dt>Отделка</dt><dd>${flat.pent ? 'Без отделки' : 'Под ключ, две палитры'}</dd></div>
      </dl>
      ${flat.status === 'sold'
        ? '<p class="flat-meta">Квартира продана. Похожие свободные варианты ниже.</p>'
        : `<p class="flat-price"><b>${mln(flat.price)}</b><span>В ипотеку от ${rub(pay.monthly)} в месяц при взносе 30% на 20 лет</span></p>
      <div class="cta-row">
        <a class="btn btn-ink" href="contacts.html?flat=${flat.id}">Записаться на показ</a>
        <a class="btn btn-line" href="mortgage.html?price=${flat.price}">Рассчитать ипотеку</a>
      </div>`}
    </div>
  </div>
  <section class="where" aria-labelledby="where-title">
    <div>
      <h2 id="where-title">${flat.floor} этаж ${c.name.replace('Башня', 'башни')}</h2>
      <p>${c.note}. Окна от пола до потолка, отделка под ключ в двух палитрах.</p>
    </div>
    <img src="assets/living.webp" width="1800" height="1200" alt="Гостиная с панорамными окнами и тёплым светом" loading="lazy">
  </section>
  ${similar.length ? `<section class="similar" aria-labelledby="sim-title">
    <h2 id="sim-title">Похожие квартиры</h2>
    <div class="grid">${similar.map(cardHTML).join('')}</div>
  </section>` : '<div class="similar"></div>'}
`;

/* На узком экране подписи комнат короче и крупнее, чтобы читались. */
narrow.addEventListener('change', () => { document.getElementById('plan-svg').innerHTML = planSVG(flat, { short: narrow.matches }); });
