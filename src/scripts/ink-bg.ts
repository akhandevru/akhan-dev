import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Фон от раздела «Как работаю»: мягкие графитовые капли, как в лава-лампе. Они медленно плывут, сливаются и отпускаются,
// а прокрутка плавно сдвигает и раздувает их. Поле считается на небольшом холсте и растягивается, поэтому нагрузка низкая.
const canvas = document.querySelector<HTMLCanvasElement>('[data-ink]');
const trigger = document.querySelector<HTMLElement>('#development');
const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;

// На главной фон появляется у раздела «Как работаю» (первый экран занимает чёрная дыра). На остальных страницах такого раздела нет,
// поэтому фон виден сразу и целиком.
if (canvas && !calm) {
  const ctx = canvas.getContext('2d');
  if (ctx) run(canvas, ctx, trigger);
}

function run(target: HTMLCanvasElement, ctx: CanvasRenderingContext2D, section: HTMLElement | null) {
  const blobs = Array.from({ length: 7 }, (_, i) => ({
    x: 0.1 + ((i * 0.41) % 0.8), y: 0.05 + ((i * 0.37) % 0.9),
    r: 0.13 + (i % 3) * 0.04, phase: i * 1.9, speed: 0.05 + (i % 4) * 0.018, depth: 0.2 + (i % 4) * 0.2,
  }));
  let width = 0, height = 0, image: ImageData | null = null, shown = section ? 0 : 1, follow = scrollY, swell = 0, last = 0, visible = true;

  const resize = () => {
    const scale = Math.min(0.34, 520 / innerWidth);
    width = Math.max(90, Math.round(innerWidth * scale));
    height = Math.max(90, Math.round(innerHeight * scale));
    target.width = width; target.height = height;
    image = ctx.createImageData(width, height);
  };
  resize();
  addEventListener('resize', resize, { passive: true });
  if (section) ScrollTrigger.create({ trigger: section, start: 'top 85%', end: 'top 30%', onUpdate: self => { shown = self.progress; } });
  document.addEventListener('visibilitychange', () => { visible = !document.hidden; });

  const frame = (now: number) => {
    requestAnimationFrame(frame);
    if (shown <= 0.01) { target.style.opacity = '0'; return; }
    // 30 кадров в секунду на компьютере, 20 на телефоне: поле считается на процессоре и мешает прокрутке.
    if (!visible || !image || now - last < (innerWidth < 700 ? 50 : 33)) return;
    last = now;
    const t = now / 1000;
    // Позиция и размер догоняют прокрутку с запозданием, поэтому капли движутся плавно, без рывков.
    const gap = scrollY - follow;
    follow += gap * 0.045;
    swell += (Math.min(1, Math.abs(gap) / 220) - swell) * 0.03;
    const aspect = width / height;
    const live = blobs.map(b => ({
      x: (b.x + Math.sin(t * b.speed + b.phase) * 0.1) * aspect,
      y: ((((b.y - (follow / innerHeight) * 0.16 * b.depth + Math.cos(t * b.speed * 0.9 + b.phase) * 0.1) % 1.3) + 1.3) % 1.3) - 0.15,
      r2: (b.r * (1 + swell * 0.6)) ** 2,
    }));
    const data = image.data;
    let k = 0;
    for (let j = 0; j < height; j++) {
      const y = j / height;
      for (let i = 0; i < width; i++) {
        const x = (i / width) * aspect;
        let field = 0;
        for (const b of live) { const dx = x - b.x, dy = y - b.y; field += b.r2 / (dx * dx + dy * dy + 0.003); }
        // Мягкий край и более светлая середина: капля объёмная, без резких пикселей.
        const body = Math.min(1, Math.max(0, (field - 0.55) / 0.9));
        const core = Math.min(1, Math.max(0, (field - 1.1) / 2.2));
        const shade = 16 + core * 22;
        data[k] = shade; data[k + 1] = shade; data[k + 2] = shade + 4;
        data[k + 3] = body * body * (3 - 2 * body) * (90 + core * 50);
        k += 4;
      }
    }
    ctx.putImageData(image, 0, 0);
    target.style.opacity = String(shown);
  };
  requestAnimationFrame(frame);
}
