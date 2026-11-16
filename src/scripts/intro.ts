import { gsap } from 'gsap';
import { introActive, finishBang, finishDone, holeBorn } from './intro-state';

// Вступление на главной, «рождение чёрной дыры»: на чёрном экране зажигается звезда с кипящей поверхностью и короной, нагревается и
// схлопывается, взрывается (вспышка, ударная волна, разлетающиеся частицы), на её месте проявляется настоящая чёрная дыра сцены,
// потом поднимается имя и появляется всё остальное.
// Звезда рисуется фрагментным шейдером на маленьком холсте (поверхность из шума, потемнение к краю, корона с нитями); если WebGL нет,
// рисуется простое свечение на холсте 2D. Взрыв и частицы всегда на 2D. Запуск 3D-сцены (introBang) начинается ровно во вспышке,
// она скрывает возможные подвисания. Пока идёт вступление, страница закрыта завесой и не прокручивается, пропустить его нельзя.
const root = document.documentElement;

const BANG = 1.35; // секунда, на которой звезда взрывается
const COLLAPSE = 0.4; // длительность схлопывания перед взрывом
const easeIn = (x: number) => x * x * x;
const easeOut = (x: number) => 1 - (1 - x) ** 3;
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

const starVertex = 'attribute vec2 aPos; void main() { gl_Position = vec4(aPos, 0.0, 1.0); }';
const starFragment = `
  precision highp float;
  uniform vec2 uRes; uniform float uTime; uniform float uRad; uniform float uHeat; uniform float uAlpha;
  float hash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
  float noise(vec3 x) {
    vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
  }
  float fbm(vec3 p) { float v = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { v += a * noise(p); p = p * 2.02 + vec3(3.1, 1.7, 5.3); a *= 0.5; } return v; }
  void main() {
    vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / (0.5 * uRes.y);
    float rn = length(p) / uRad;
    float ang = atan(p.y, p.x);
    float lum = 0.0;
    if (rn < 1.0) {
      // Шар: поверхность из движущегося шума (грануляция), тёмные пятна и потемнение к краю.
      float z = sqrt(1.0 - rn * rn);
      vec3 n = vec3(p / uRad, z);
      float rot = uTime * 0.22, c = cos(rot), s = sin(rot);
      // Сдвиг от нуля: у самого начала координат хеш шума даёт лучевой узор в центре шара.
      vec3 q = vec3(c * n.x + s * n.z, n.y, -s * n.x + c * n.z) + vec3(17.3, 9.1, 4.7);
      float t = uTime * (0.4 + uHeat * 1.6);
      float g = fbm(q * (3.0 + uHeat * 2.0) + vec3(0.0, 0.0, t));
      float g2 = fbm(q * 9.0 - vec3(t * 0.8));
      float spots = smoothstep(0.6, 0.74, fbm(q * 2.2 + 4.0)) * 0.5;
      float surf = 0.5 + 0.95 * g + 0.4 * g2 - spots;
      lum = surf * pow(z, 0.5) * (0.62 + uHeat * 0.95);
    }
    // Корона: быстро гаснущее свечение с радиальными нитями, которые дрожат.
    float d = max(rn - 1.0, 0.0);
    float streak = fbm(vec3(cos(ang) * 2.4, sin(ang) * 2.4, uTime * 0.55 + d * 1.6));
    float flick = 0.88 + 0.12 * sin(uTime * 21.0 + ang * 3.0);
    float corona = exp(-d * 3.4) * (0.12 + 2.6 * pow(streak, 2.2)) * smoothstep(0.9, 1.0, rn) * flick * (0.5 + uHeat * 1.2);
    float halo = exp(-rn * 1.0) * 0.14 * (0.5 + uHeat);
    float v = 1.0 - exp(-(lum + corona + halo) * 1.15);
    gl_FragColor = vec4(vec3(v) * uAlpha, v * uAlpha);
  }`;

type Mote = { a: number; v: number; size: number; life: number };
type Star = { draw: (t: number) => void; remove: () => void };

/** Звезда на WebGL. Возвращает null, если WebGL недоступен. */
function createStar(canvas: HTMLCanvasElement, baseRadius: number, dpr: number): Star | null {
  const side = Math.round(baseRadius * 9.5);
  const px = Math.max(64, Math.min(Math.round(side * dpr), Math.floor(Math.sqrt(1.6e6))));
  canvas.width = px; canvas.height = px;
  canvas.style.width = `${side}px`; canvas.style.height = `${side}px`;
  const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false });
  if (!gl) return null;
  const compile = (type: number, source: string) => {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source); gl.compileShader(shader);
    return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
  };
  const vs = compile(gl.VERTEX_SHADER, starVertex), fs = compile(gl.FRAGMENT_SHADER, starFragment), program = gl.createProgram();
  if (!vs || !fs || !program) return null;
  gl.attachShader(program, vs); gl.attachShader(program, fs); gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  gl.useProgram(program);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, 'aPos');
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  const u = (name: string) => gl.getUniformLocation(program, name);
  const uTime = u('uTime'), uRad = u('uRad'), uHeat = u('uHeat'), uAlpha = u('uAlpha');
  gl.viewport(0, 0, px, px);
  gl.uniform2f(u('uRes'), px, px);
  gl.clearColor(0, 0, 0, 0);
  const half = side / 2;

  return {
    draw: t => {
      // Зажигается из темноты, медленно раздувается и нагревается; в конце резко схлопывается и ярко вспыхивает.
      const grow = clamp01(t / (BANG - COLLAPSE));
      const c = clamp01((t - (BANG - COLLAPSE)) / COLLAPSE);
      const radius = baseRadius * (0.5 + 0.5 * easeOut(grow)) * (1 - 0.88 * easeIn(c));
      const heat = 0.08 + 0.5 * grow + 1.6 * c;
      const alpha = clamp01(t / 0.45) * (1 - clamp01((t - BANG + 0.04) / 0.04));
      gl.uniform1f(uTime, t);
      gl.uniform1f(uRad, radius / half);
      gl.uniform1f(uHeat, heat);
      gl.uniform1f(uAlpha, alpha);
      // Перед взрывом звезду трясёт.
      const shake = easeIn(c) * 3 * (baseRadius / 90);
      canvas.style.transform = `translate(calc(-50% + ${(Math.sin(t * 91) * shake).toFixed(2)}px), calc(-50% + ${(Math.cos(t * 77) * shake).toFixed(2)}px))`;
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    },
    remove: () => canvas.remove(),
  };
}

export function runIntro() {
  if (!introActive) return;
  const veil = document.querySelector<HTMLElement>('.intro-veil');
  const starCanvas = document.querySelector<HTMLCanvasElement>('.intro-star');
  const canvas = document.querySelector<HTMLCanvasElement>('.intro-canvas');
  const ctx = canvas?.getContext('2d') ?? null;
  const chars = gsap.utils.toArray<HTMLElement>('.hero .ch');
  const bits = gsap.utils.toArray<HTMLElement>('.hero-top, .hero-bottom');
  const header = document.querySelector<HTMLElement>('.site-header');
  const movers = [header, ...bits].filter((el): el is HTMLElement => el !== null);

  let ended = false;
  const end = () => {
    if (ended) return;
    ended = true;
    gsap.ticker.lagSmoothing(500, 33);
    root.classList.remove('intro');
    gsap.set(movers, { clearProps: 'opacity,transform' });
    finishBang();
    finishDone();
  };
  // После перезагрузки посреди страницы вступление не нужно: сразу показываем страницу.
  if (!veil || !canvas || !ctx || scrollY > 60 || chars.length === 0) { end(); return; }

  const dpr = Math.min(devicePixelRatio, 2);
  const W = innerWidth, H = innerHeight;
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  const cx = W * 0.5, cy = H * 0.54;
  const far = Math.hypot(W * 0.5, H * 0.6);
  // Всё считается от размера экрана: на телефоне звезда и взрыв меньше, но не крошечные.
  const baseRadius = Math.max(34, Math.min(110, Math.min(W, H) * 0.115));
  const span = Math.min(1.1, Math.max(0.45, Math.hypot(W, H) / 1650));
  const star = starCanvas ? createStar(starCanvas, baseRadius, dpr) : null;
  if (!star) starCanvas?.remove();

  gsap.ticker.lagSmoothing(0); // время вступления идёт по часам, даже если кадр зависнет (запуск 3D)
  gsap.set(chars, { yPercent: 115 });
  gsap.set(movers, { opacity: 0 });
  if (header) gsap.set(header, { y: -22 });
  gsap.set(bits, { y: 18 });
  gsap.set(veil, { opacity: 1 });

  const motes: Mote[] = Array.from({ length: Math.round(140 + 160 * span) }, () => ({
    a: Math.random() * Math.PI * 2,
    v: (240 + Math.pow(Math.random(), 1.6) * 1500) * span + 70,
    size: 0.8 + Math.random() * 2.1,
    life: 0.9 + Math.random() * 1.0,
  }));

  let started = 0, banged = false, drawing = true;
  const glow = (x: number, y: number, r: number, alpha: number) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(255,255,255,${alpha})`);
    g.addColorStop(0.18, `rgba(240,240,236,${alpha * 0.55})`);
    g.addColorStop(1, 'rgba(240,240,236,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  };

  const frame = (now: number) => {
    if (!drawing) return;
    requestAnimationFrame(frame);
    if (!started) started = now;
    const t = (now - started) / 1000;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';

    if (t < BANG) {
      if (star) star.draw(t);
      else {
        // Запасной вариант без WebGL: простое пульсирующее свечение.
        const grow = clamp01(t / (BANG - COLLAPSE)), squeeze = 1 - easeIn(clamp01((t - (BANG - COLLAPSE)) / COLLAPSE));
        glow(cx, cy, (baseRadius * 3 + 120 * easeOut(grow)) * (0.3 + 0.7 * squeeze), 0.8);
        glow(cx, cy, baseRadius * (0.8 + 0.5 * grow) * squeeze + 6, 1);
      }
    } else {
      if (!banged) { banged = true; star?.remove(); finishBang(); }
      const s = t - BANG;
      // Вспышка: яркая и короткая, затухает за полсекунды.
      const flash = Math.pow(clamp01(1 - s / 0.55), 2) * 0.62;
      if (flash > 0.002) { ctx.fillStyle = `rgba(250,250,247,${flash})`; ctx.fillRect(0, 0, W, H); }
      // Огненный шар: ядро взрыва быстро растёт и гаснет.
      const burn = clamp01(1 - s / 0.7);
      if (burn > 0) glow(cx, cy, (baseRadius * 1.4 + 340 * span * easeOut(clamp01(s / 0.5))), 0.8 * burn);
      // Ударная волна: два кольца, второе тоньше и с запозданием.
      [{ delay: 0, width: 3.2, power: 0.95 }, { delay: 0.14, width: 1.6, power: 0.6 }].forEach(ring => {
        const k = clamp01((s - ring.delay) / 1.5);
        if (k <= 0 || k >= 1) return;
        ctx.strokeStyle = `rgba(255,255,255,${Math.pow(1 - k, 1.6) * ring.power})`;
        ctx.lineWidth = ring.width * (1 - k * 0.5);
        ctx.beginPath(); ctx.arc(cx, cy, easeOut(k) * far * 1.15, 0, Math.PI * 2); ctx.stroke();
      });
      // Обломки звезды разлетаются и тормозятся, оставляя короткий след.
      const drag = 1.7;
      ctx.lineCap = 'round';
      motes.forEach(m => {
        if (s >= m.life) return;
        const dist = (m.v / drag) * (1 - Math.exp(-drag * s));
        const speed = m.v * Math.exp(-drag * s);
        const x = cx + Math.cos(m.a) * dist, y = cy + Math.sin(m.a) * dist;
        const trail = Math.min(34, speed * 0.028);
        ctx.strokeStyle = `rgba(255,255,255,${Math.pow(1 - s / m.life, 1.3) * 0.9})`;
        ctx.lineWidth = m.size;
        ctx.beginPath();
        ctx.moveTo(x, y); ctx.lineTo(x - Math.cos(m.a) * trail, y - Math.sin(m.a) * trail);
        ctx.stroke();
      });
      if (s > 2.0) { drawing = false; ctx.clearRect(0, 0, W, H); canvas.remove(); }
    }
  };

  const fonts = document.fonts
    ? Promise.all([document.fonts.load('800 1em "Unbounded Variable"', 'Артем Хан'), document.fonts.load('400 1em "Onest Variable"', 'Создаю')])
    : Promise.resolve();
  Promise.race([fonts, new Promise(resolve => setTimeout(resolve, 1200))]).then(() => {
    if (ended) return;
    requestAnimationFrame(frame);
    // Тёмная завеса гаснет после взрыва, открывая рождающуюся чёрную дыру.
    gsap.to(veil, { opacity: 0, duration: 1.2, ease: 'power2.inOut', delay: BANG + 0.45 });
    // Текст появляется только когда дыра выросла и вокруг неё закружились частицы. Если сцена не запустилась, ждём не дольше 4,6 секунды.
    Promise.race([holeBorn, new Promise(resolve => setTimeout(resolve, 4600))]).then(() => {
      const tl = gsap.timeline({ onComplete: end, delay: 1.7 });
      tl.to(chars, { yPercent: 0, duration: 1.15, ease: 'expo.out', stagger: 0.05 }, 0);
      if (header) tl.to(header, { opacity: 1, y: 0, duration: 0.9, ease: 'expo.out' }, 0.3);
      tl.to(bits, { opacity: 1, y: 0, duration: 0.9, ease: 'expo.out', stagger: 0.1 }, 0.35);
    });
  });
}
