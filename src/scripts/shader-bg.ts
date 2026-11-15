export {};
// Фон сайта на WebGPU-шейдерах (библиотека shaders, MIT): медленный почти чёрный градиент с шумом.
// Только как надстройка: нет WebGPU, включено «меньше движения», узкий экран или экономия трафика,
// и остаётся статичный градиент из CSS.
const canvas = document.querySelector<HTMLCanvasElement>('[data-bg-shader]');

async function start(target: HTMLCanvasElement) {
  const { createShader } = await import('shaders/js');
  await createShader(target, {
    components: [
      { type: 'MeshGradient', id: 'mesh', props: { colorA: '#030304', colorB: '#1d1d20', stops: null, speed: 0.4, swirl: 0.7, smoothness: 1.6, count: 5 }, children: [] },
      { type: 'SimplexNoise', id: 'noise', props: { colorA: '#030304', colorB: '#1d1d20', stops: null, scale: 2.4, speed: 0.18, opacity: 0.3, blendMode: 'softLight' }, children: [] },
    ],
  });
  target.dataset['ready'] = 'true';
}

const supported = 'gpu' in navigator;
const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
const wide = matchMedia('(min-width: 900px) and (hover: hover)').matches;
const saver = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;

if (canvas && supported && !calm && wide && !saver) {
  // Грузим после первого показа, чтобы шейдеры не задерживали текст и картинку.
  const run = () => { start(canvas).catch(() => { canvas.remove(); }); };
  if ('requestIdleCallback' in window) requestIdleCallback(run, { timeout: 2500 }); else setTimeout(run, 800);
}
