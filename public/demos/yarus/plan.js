/* Планировка квартиры в SVG: комнаты прямоугольниками, площадь каждой посчитана из общей. */
const TEMPLATES = {
  1: { w: 120, h: 80, rooms: [['Гостиная с кухней', 0, 0, 72, 46], ['Спальня', 72, 0, 48, 46], ['Прихожая', 0, 46, 38, 34], ['Ванная', 38, 46, 30, 34], ['Гардероб', 68, 46, 52, 34]] },
  2: { w: 120, h: 80, rooms: [['Гостиная с кухней', 0, 0, 66, 50], ['Мастер-спальня', 66, 0, 54, 44], ['Спальня', 66, 44, 54, 36], ['Прихожая', 0, 50, 34, 30], ['Ванная', 34, 50, 32, 30]] },
  3: { w: 130, h: 84, rooms: [['Гостиная', 0, 0, 56, 50], ['Кухня-столовая', 56, 0, 36, 50], ['Мастер-спальня', 92, 0, 38, 50], ['Спальня', 0, 50, 36, 34], ['Спальня', 36, 50, 34, 34], ['Ванная', 70, 50, 26, 34], ['Гардероб', 96, 50, 34, 34]] },
  4: { w: 140, h: 88, rooms: [['Гостиная', 0, 0, 58, 52], ['Кухня-столовая', 58, 0, 38, 52], ['Мастер-спальня', 96, 0, 44, 52], ['Спальня', 0, 52, 34, 36], ['Спальня', 34, 52, 34, 36], ['Спальня', 68, 52, 34, 36], ['Ванные', 102, 52, 38, 36]] },
  pent: { w: 160, h: 92, rooms: [['Гостиная', 0, 0, 62, 56], ['Кухня-столовая', 62, 0, 40, 56], ['Мастер-спальня', 102, 0, 40, 56], ['Кабинет', 0, 56, 34, 36], ['Спальня', 34, 56, 34, 36], ['Спальня', 68, 56, 34, 36], ['Ванные', 102, 56, 40, 36], ['Терраса', 142, 0, 18, 92]] },
};

const fmt = (n) => n.toLocaleString('ru-RU', { maximumFractionDigits: 1 });

/** Полный чертёж с подписями, либо мини-версия для карточки (mini: true) без текста. */
const SHORT = { 'Гостиная с кухней': 'Гостиная', 'Мастер-спальня': 'Мастер', 'Кухня-столовая': 'Кухня', 'Прихожая': 'Прихожая' };

export function planSVG(flat, { mini = false, short = false } = {}) {
  const t = TEMPLATES[flat.pent ? 'pent' : flat.beds];
  const indoor = t.rooms.filter((r) => r[0] !== 'Терраса');
  const total = indoor.reduce((s, r) => s + r[3] * r[4], 0);
  const k = 10;
  const W = t.w * k, H = t.h * k;
  const parts = t.rooms.map(([name, x, y, w, h]) => {
    const terrace = name === 'Терраса';
    const rect = `<rect x="${x * k}" y="${y * k}" width="${w * k}" height="${h * k}" class="${terrace ? 'room terrace' : 'room'}"/>`;
    if (mini) return rect;
    const a = terrace ? Math.round(flat.area * 0.22) : Math.round(((w * h) / total) * flat.area * 0.94 * 10) / 10;
    const cx = (x + w / 2) * k, cy = (y + h / 2) * k;
    const small = w < 36;
    return `<g>${rect}
      <text x="${cx}" y="${cy - 8}" class="rn${small ? ' sm' : ''}">${short ? (SHORT[name] || name) : name}</text>
      <text x="${cx}" y="${cy + 40}" class="ra">${fmt(a)} м²</text>
    </g>`;
  }).join('');
  /* Окна на фасадной стороне: отрезки по верхней стене. */
  const windows = t.rooms.filter((r) => r[2] === 0 && r[0] !== 'Терраса').map(([, x, , w]) => `<line x1="${(x + w * 0.2) * k}" y1="0" x2="${(x + w * 0.8) * k}" y2="0" class="win"/>`).join('');
  const uid = `h${flat.id.replace(/\W/g, '')}${mini ? 'm' : ''}`;
  const label = mini ? `Планировка: ${flat.beds} спальни, ${fmt(flat.area)} м²` : `Планировка: ${t.rooms.map((r) => r[0].toLowerCase()).join(', ')}`;
  return `<svg viewBox="-20 -20 ${W + 40} ${H + 40}" role="img" aria-label="${label}">
    <style>
      .room{fill:${mini ? '#fff' : '#f3f5f9'};stroke:#0b1020;stroke-width:${mini ? 9 : 6}}
      .terrace{fill:url(#${uid});stroke-dasharray:18 12}
      .rn{fill:#0b1020;font:500 ${short ? 52 : 38}px Onest,sans-serif;text-anchor:middle}
      .rn.sm{font-size:${short ? 42 : 29}px}
      .ra{fill:rgb(11 16 32 / .68);font:400 ${short ? 46 : 34}px Onest,sans-serif;text-anchor:middle}
      .win{stroke:#ff6a3d;stroke-width:${mini ? 20 : 14}}
    </style>
    <defs><pattern id="${uid}" width="22" height="22" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="22" height="22" fill="#fff"/><line x1="0" y1="0" x2="0" y2="22" stroke="#cfd5e3" stroke-width="6"/></pattern></defs>
    ${parts}${windows}
  </svg>`;
}
