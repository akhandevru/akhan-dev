/* Квартиры, программы ипотеки и общие функции. Всё вымышлено, цены условные. */
export const BASE = '/demos/yarus/';

export const CORPUS = [
  { id: 'A', tower: 0, name: 'Башня А', floors: 32, note: '32 этажа, три верхних отданы пентхаусам' },
  { id: 'B', tower: 1, name: 'Башня Б', floors: 22, note: '22 этажа, окна на реку и парк' },
  { id: 'C', tower: 2, name: 'Башня В', floors: 16, note: '16 этажей, по четыре квартиры на этаже' },
];

/* Шаблон этажа: спальни, площадь, вид, тип планировки. */
const LAYOUT = {
  A: [
    { beds: 2, area: 74, view: 'Река' },
    { beds: 3, area: 108, view: 'Река' },
    { beds: 1, area: 52, view: 'Двор' },
    { beds: 4, area: 146, view: 'Парк' },
    { beds: 2, area: 81, view: 'Парк' },
    { beds: 3, area: 118, view: 'Город' },
  ],
  B: [
    { beds: 2, area: 70, view: 'Река' },
    { beds: 3, area: 102, view: 'Река' },
    { beds: 1, area: 49, view: 'Двор' },
    { beds: 3, area: 115, view: 'Парк' },
    { beds: 2, area: 77, view: 'Город' },
  ],
  C: [
    { beds: 3, area: 128, view: 'Парк' },
    { beds: 4, area: 164, view: 'Парк' },
    { beds: 2, area: 92, view: 'Двор' },
    { beds: 4, area: 171, view: 'Город' },
  ],
  PH: [
    { beds: 4, area: 286, view: 'Река и центр', pent: true },
    { beds: 4, area: 241, view: 'Парк и город', pent: true },
  ],
};

const PRICE = { A: [980000, 9000], B: [860000, 7000], C: [920000, 6000], PH: [1650000, 0] };

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeFlats() {
  const rand = rng(2028);
  const list = [];
  for (const c of CORPUS) {
    for (let floor = 2; floor <= c.floors; floor++) {
      const pent = c.id === 'A' && floor >= 30;
      const plan = pent ? LAYOUT.PH : LAYOUT[c.id];
      plan.forEach((t, i) => {
        const area = Math.round((t.area + (rand() - 0.5) * 3) * 10) / 10;
        const [base, step] = PRICE[pent ? 'PH' : c.id];
        const perM = base + step * floor + Math.round(rand() * 40) * 1000;
        const price = Math.round((area * perM) / 100000) * 100000;
        const r = rand();
        const status = r < 0.6 ? 'free' : r < 0.78 ? 'hold' : 'sold';
        list.push({
          id: `${c.id}-${floor}-${i + 1}`,
          corpus: c.id,
          tower: c.tower,
          floor,
          pos: i + 1,
          beds: t.beds,
          pent: Boolean(t.pent),
          area,
          price,
          view: t.view,
          ceiling: pent ? 4.2 : floor >= 20 ? 3.5 : 3.3,
          status,
        });
      });
    }
  }
  return list;
}

export const FLATS = makeFlats();
export const flatById = (id) => FLATS.find((f) => f.id === id);
export const corpusById = (id) => CORPUS.find((c) => c.id === id);

export const STATUS = { free: 'Свободна', hold: 'Бронь', sold: 'Продана' };

export const PROGRAMS = [
  { id: 'base', name: 'Стандартная', rate: 16.9, note: 'Без ограничений по сумме' },
  { id: 'family', name: 'Семейная', rate: 6, limit: 12000000, note: 'Для семей с ребёнком до 6 лет: 6% на первые 12 млн ₽, остаток по стандартной ставке' },
  { id: 'dev', name: 'С субсидией застройщика', rate: 9.9, note: 'Ставка 9,9% на весь срок, цена квартиры выше на 7%', markup: 0.07 },
];

/* Ежемесячный аннуитетный платёж. */
export function annuity(sum, ratePercent, years) {
  if (sum <= 0) return 0;
  const n = years * 12;
  const r = ratePercent / 100 / 12;
  if (r === 0) return sum / n;
  return (sum * r) / (1 - Math.pow(1 + r, -n));
}

/** Расчёт ипотеки: цена, взнос в долях, срок, программа. */
export function mortgage(price, downShare, years, programId) {
  const program = PROGRAMS.find((p) => p.id === programId) || PROGRAMS[0];
  const total = Math.round(price * (1 + (program.markup || 0)));
  const down = Math.round(total * downShare);
  const loan = Math.max(0, total - down);
  let monthly;
  if (program.limit) {
    const cheap = Math.min(loan, program.limit);
    monthly = annuity(cheap, program.rate, years) + annuity(loan - cheap, PROGRAMS[0].rate, years);
  } else {
    monthly = annuity(loan, program.rate, years);
  }
  monthly = Math.round(monthly);
  const paid = monthly * years * 12;
  return { program, total, down, loan, monthly, overpay: Math.max(0, paid - loan), income: monthly * 2 };
}

const nf = new Intl.NumberFormat('ru-RU');
export const rub = (n) => `${nf.format(Math.round(n))} ₽`;
export const mln = (n) => `${(n / 1e6).toLocaleString('ru-RU', { maximumFractionDigits: n >= 1e8 ? 0 : 1 })} млн ₽`;
export const m2 = (n) => `${n.toLocaleString('ru-RU', { maximumFractionDigits: 1 })} м²`;
export const bedsText = (b, pent) => {
  const word = b === 1 ? 'спальня' : b < 5 ? 'спальни' : 'спален';
  return `${pent ? 'Пентхаус, ' : ''}${b} ${word}`;
};

export const escapeHTML = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
