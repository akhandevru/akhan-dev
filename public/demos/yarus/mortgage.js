import { PROGRAMS, mortgage, rub, mln } from './data.js';

const form = document.getElementById('mort');
const result = document.getElementById('result');
const priceInput = form.elements.price;
const err = document.getElementById('price-err');
const nf = new Intl.NumberFormat('ru-RU');

const start = Number(new URLSearchParams(location.search).get('price'));
let price = Number.isFinite(start) && start >= 5e6 ? start : 120000000;
priceInput.value = nf.format(price);

document.getElementById('programs').insertAdjacentHTML('beforeend', PROGRAMS.map((p, i) => `
  <label class="prog"><input type="radio" name="program" value="${p.id}"${i === 0 ? ' checked' : ''}>
    <b>${p.name}</b><em>${p.rate.toLocaleString('ru-RU')}%</em><span>${p.note}</span>
  </label>`).join(''));

const years = (n) => (n % 10 === 1 && n % 100 !== 11 ? 'год' : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? 'года' : 'лет');

function render() {
  const raw = Number(priceInput.value.replace(/\D/g, ''));
  const bad = !raw || raw < 5e6 || raw > 2e9;
  err.hidden = !bad;
  priceInput.setAttribute('aria-invalid', String(bad));
  if (bad) err.textContent = 'Введите стоимость от 5 млн до 2 млрд ₽.';
  else price = raw;
  const down = Number(form.elements.down.value);
  const term = Number(form.elements.years.value);
  const r = mortgage(price, down / 100, term, form.elements.program.value);
  document.getElementById('down-out').textContent = `${down}%, ${mln(r.down)}`;
  document.getElementById('years-out').textContent = `${term} ${years(term)}`;
  const total = r.loan + r.overpay || 1;
  const principal = Math.round((r.loan / total) * 100);
  result.innerHTML = `
    <p class="pay"><span>Платёж в месяц</span><b>${rub(r.monthly)}</b></p>
    <div class="split-bar">
      <div class="bar" role="img" aria-label="Основной долг ${principal}%, проценты ${100 - principal}%"><i style="width:${principal}%"></i><i style="width:${100 - principal}%"></i></div>
      <p class="keys"><span>Основной долг ${mln(r.loan)}</span><span>Проценты ${mln(r.overpay)}</span></p>
    </div>
    <dl>
      ${r.program.markup ? `<div><dt>Цена с субсидией</dt><dd>${rub(r.total)}</dd></div>` : ''}
      <div><dt>Сумма кредита</dt><dd>${rub(r.loan)}</dd></div>
      <div><dt>Переплата за ${term} ${years(term)}</dt><dd>${rub(r.overpay)}</dd></div>
      <div><dt>Нужный доход в месяц</dt><dd>от ${rub(r.income)}</dd></div>
    </dl>
    <p class="note">${r.program.limit && r.loan > r.program.limit ? `Кредит больше 12 млн ₽: на остаток ${rub(r.loan - r.program.limit)} действует стандартная ставка ${PROGRAMS[0].rate.toLocaleString('ru-RU')}%.` : 'Банк может попросить подтвердить доход и стаж от 6 месяцев.'}</p>
    <a class="btn btn-coral" href="contacts.html">Записаться на показ</a>`;
}

priceInput.addEventListener('blur', () => { if (priceInput.getAttribute('aria-invalid') === 'false') priceInput.value = nf.format(price); });
form.addEventListener('input', render);
form.addEventListener('submit', (e) => e.preventDefault());
render();
