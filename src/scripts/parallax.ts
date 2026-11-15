// Лёгкий параллакс всего фона: от курсора на компьютере и от наклона телефона. Значения от -1 до 1, сглаженные.
// Фоновые холсты читают CSS-переменные --tilt-x и --tilt-y, 3D-сцена берёт объект tilt напрямую.
// При «меньше движения» ничего не двигается.
export const tilt = { x: 0, y: 0 };

const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
const root = document.documentElement;
const goal = { x: 0, y: 0 };
const clamp = (v: number) => Math.max(-1, Math.min(1, v));

type Orientation = typeof DeviceOrientationEvent & { requestPermission?: () => Promise<string> };

if (!calm) {
  if (matchMedia('(hover:hover) and (pointer:fine)').matches) {
    addEventListener('pointermove', event => {
      goal.x = (event.clientX / innerWidth) * 2 - 1;
      goal.y = (event.clientY / innerHeight) * 2 - 1;
    }, { passive: true });
  } else if ('DeviceOrientationEvent' in window) {
    // Наклон считается от положения, в котором телефон держали при первом событии.
    let base: { beta: number; gamma: number } | null = null;
    const onTilt = (event: DeviceOrientationEvent) => {
      if (event.beta === null || event.gamma === null) return;
      base ??= { beta: event.beta, gamma: event.gamma };
      goal.x = clamp((event.gamma - base.gamma) / 22);
      goal.y = clamp((event.beta - base.beta) / 22);
    };
    const listen = () => addEventListener('deviceorientation', onTilt, { passive: true });
    const Orientation = DeviceOrientationEvent as Orientation;
    if (typeof Orientation.requestPermission === 'function') {
      // iOS спрашивает разрешение только по касанию.
      addEventListener('touchend', () => {
        Orientation.requestPermission?.().then(state => { if (state === 'granted') listen(); }).catch(() => {});
      }, { once: true, passive: true });
    } else listen();
  }

  let shownX = 0, shownY = 0;
  const frame = () => {
    requestAnimationFrame(frame);
    tilt.x += (goal.x - tilt.x) * 0.06;
    tilt.y += (goal.y - tilt.y) * 0.06;
    if (Math.abs(tilt.x - shownX) > 0.002 || Math.abs(tilt.y - shownY) > 0.002) {
      shownX = tilt.x; shownY = tilt.y;
      root.style.setProperty('--tilt-x', shownX.toFixed(3));
      root.style.setProperty('--tilt-y', shownY.toFixed(3));
    }
  };
  requestAnimationFrame(frame);
}
