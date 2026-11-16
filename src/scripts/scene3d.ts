import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { holeFragment } from './hole-shader';
import { tilt } from './parallax';
import { introActive, introBang, markHoleBorn } from './intro-state';

gsap.registerPlugin(ScrollTrigger);

// 3D-сцена. На первом экране чёрная дыра: свет трассируется по геодезическим Шварцшильда, поэтому диск огибает тень сверху и снизу,
// как в «Интерстеллар». Когда страницу листают к проектам, экраны по одному вылетают из дыры, а затем крупная лента проектов
// движется справа налево. Это надстройка: без WebGL2, при «меньше движения» или экономии трафика остаются обычные карточки.
const canvas = document.querySelector<HTMLCanvasElement>('[data-three]');
const stage = document.querySelector<HTMLElement>('[data-stage]');
const hero = document.querySelector<HTMLElement>('.hero');
const items = stage ? [...stage.querySelectorAll<HTMLElement>('[data-stage-item]')] : [];
const counter = stage?.querySelector<HTMLElement>('[data-stage-count]');
const root = document.documentElement;

const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
const saver = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;
const hasWebgl2 = (() => { try { return !!document.createElement('canvas').getContext('webgl2'); } catch { return false; } })();

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (x: number) => { const v = clamp01(x); return v * v * (3 - 2 * v); };
const pad = (n: number) => String(n).padStart(2, '0');

const quadVertex = 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';

async function start(target: HTMLCanvasElement, section: HTMLElement, top: HTMLElement) {
  const THREE = await import('three');
  // Картинки проектов качаются заранее, пока звезда горит, чтобы после взрыва оставались только рендерер и первый кадр.
  const loader = new THREE.TextureLoader();
  const load = (url: string) => new Promise<InstanceType<typeof THREE.Texture>>((resolve, reject) => loader.load(url, resolve, undefined, reject));
  const preloaded = items.map(item => load(item.dataset['tex'] ?? ''));
  preloaded.forEach(promise => { promise.catch(() => undefined); });
  // Рендерер и компиляция шейдера дыры тяжёлые: стартуем в момент взрыва звезды, вспышка скрывает возможные подвисания.
  await introBang;
  const small = innerWidth < 700;
  const renderer = new THREE.WebGLRenderer({ canvas: target, antialias: !small, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, small ? 2 : 1.5));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.autoClear = false;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 120);
  const CAM_Z = 11;

  const count = items.length;
  const W = 4, H = 2.5;
  const anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());

  type Panel = { group: InstanceType<typeof THREE.Group>; material: InstanceType<typeof THREE.MeshBasicMaterial>; frame: InstanceType<typeof THREE.MeshBasicMaterial>; texture: InstanceType<typeof THREE.Texture>; span: number; scroll: number; dir: number; hold: number; settled: number };
  const panels: Panel[] = await Promise.all(items.map(async (_item, index) => {
    const texture = await preloaded[index]!;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = anisotropy;
    const image = texture.image as { width: number; height: number };
    const shown = Math.min(1, (H / W) / (image.height / image.width));
    texture.repeat.set(1, shown);
    texture.offset.set(0, 1 - shown);
    const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide, toneMapped: false, transparent: true, opacity: 0 });
    const frame = new THREE.MeshBasicMaterial({ color: 0x1b1b1d, side: THREE.DoubleSide, transparent: true, opacity: 0 });
    const face = new THREE.Mesh(new THREE.PlaneGeometry(W, H), material);
    const back = new THREE.Mesh(new THREE.PlaneGeometry(W + 0.14, H + 0.14), frame);
    back.position.z = -0.012;
    const group = new THREE.Group();
    group.add(back, face);
    group.scale.setScalar(0.04);
    scene.add(group);
    return { group, material, frame, texture, span: 1 - shown, scroll: 0, dir: 1, hold: 0, settled: 0 };
  }));

  // Круглый спрайт для пыли.
  const dotCanvas = document.createElement('canvas');
  dotCanvas.width = 64; dotCanvas.height = 64;
  const dotCtx = dotCanvas.getContext('2d');
  if (dotCtx) {
    const glow = dotCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
    glow.addColorStop(0, 'rgba(255,255,255,1)'); glow.addColorStop(0.55, 'rgba(255,255,255,.9)'); glow.addColorStop(1, 'rgba(255,255,255,0)');
    dotCtx.fillStyle = glow; dotCtx.fillRect(0, 0, 64, 64);
  }
  const dust = new Float32Array(260 * 3);
  for (let i = 0; i < 260; i++) {
    const r = 12 + Math.random() * 30, a = Math.random() * Math.PI * 2, y = (Math.random() - 0.5) * 24;
    dust[i * 3] = Math.cos(a) * r; dust[i * 3 + 1] = y; dust[i * 3 + 2] = Math.sin(a) * r - 10;
  }
  const dustGeometry = new THREE.BufferGeometry();
  dustGeometry.setAttribute('position', new THREE.BufferAttribute(dust, 3));
  const stars = new THREE.Points(dustGeometry, new THREE.PointsMaterial({ size: 0.26, map: new THREE.CanvasTexture(dotCanvas), color: 0xffffff, transparent: true, opacity: 0.42, depthWrite: false, sizeAttenuation: true }));
  scene.add(stars);

  // Чёрная дыра рисуется отдельным проходом в уменьшенную текстуру, потом накладывается на экран.
  const holeScene = new THREE.Scene();
  const flat = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const holeUniforms = { uRes: { value: new THREE.Vector2(1, 1) }, uTime: { value: 0 }, uFade: { value: 1 }, uElev: { value: 0.13 }, uZoom: { value: 1 }, uShift: { value: new THREE.Vector2(0, -0.12) } };
  holeScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ uniforms: holeUniforms, vertexShader: quadVertex, fragmentShader: holeFragment, depthTest: false, depthWrite: false })));
  const holeTarget = new THREE.WebGLRenderTarget(2, 2, { depthBuffer: false, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter });
  const composite = new THREE.Scene();
  const compositeMaterial = new THREE.ShaderMaterial({
    uniforms: { tMap: { value: holeTarget.texture }, uTexel: { value: new THREE.Vector2(1, 1) } },
    vertexShader: quadVertex,
    // Свечение без отдельных проходов: к картинке добавляются размытые уровни мипмапов.
    // Свечение берётся из уменьшенных уровней в нескольких точках вокруг пикселя: так нет квадратов от мелкого мипмапа.
    fragmentShader: `uniform sampler2D tMap; uniform vec2 uTexel; varying vec2 vUv;
      vec4 soft(float lod, float spread) {
        vec2 o = uTexel * spread;
        return (texture2D(tMap, vUv + vec2(o.x, o.y), lod) + texture2D(tMap, vUv + vec2(-o.x, o.y), lod) + texture2D(tMap, vUv + vec2(o.x, -o.y), lod) + texture2D(tMap, vUv - o, lod)) * 0.25;
      }
      void main() { vec4 c = texture2D(tMap, vUv); vec4 g = soft(2.0, 3.0) * 0.32 + soft(4.0, 12.0) * 0.22; g.a *= 0.3; gl_FragColor = c + g * (1.0 - c.a); }`,
    transparent: true, depthTest: false, depthWrite: false,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendEquation: THREE.AddEquation,
  });
  const compositeQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), compositeMaterial);
  composite.add(compositeQuad);

  // Частицы вокруг дыры: отдельные пылинки на кеплеровских орбитах в плоскости диска. Их положение считается в JS
  // в той же камере, что у шейдера дыры, и рисуется точками поверх неё. Пылинки за тенью дыры скрыты.
  const MOTES = 640;
  const moteOrbit = Array.from({ length: MOTES }, () => {
    const r = 3.1 + Math.random() ** 1.15 * 13;
    const loose = Math.random() < 0.35;
    return { r, a: Math.random() * Math.PI * 2, y: (Math.random() - 0.5) * (loose ? 0.45 : 0.1) * r, w: 3.2 * r ** -1.5 * (0.85 + Math.random() * 0.3), glow: (0.45 + 0.55 * Math.random()) * Math.min(1, (5 / r) ** 0.5), size: 2.2 + Math.random() * 3.6 };
  });
  const motePos = new Float32Array(MOTES * 3), moteAlpha = new Float32Array(MOTES), moteSize = new Float32Array(MOTES);
  const moteGeometry = new THREE.BufferGeometry();
  moteGeometry.setAttribute('position', new THREE.BufferAttribute(motePos, 3));
  moteGeometry.setAttribute('aAlpha', new THREE.BufferAttribute(moteAlpha, 1));
  moteGeometry.setAttribute('aSize', new THREE.BufferAttribute(moteSize, 1));
  const moteMaterial = new THREE.ShaderMaterial({
    vertexShader: 'attribute float aAlpha; attribute float aSize; varying float vA; void main() { vA = aAlpha; gl_Position = vec4(position.xy, 0.0, 1.0); gl_PointSize = aSize; }',
    fragmentShader: 'varying float vA; void main() { float d = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.05, d) * vA; gl_FragColor = vec4(vec3(a), a); }',
    transparent: true, depthTest: false, depthWrite: false,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendEquation: THREE.AddEquation,
  });
  const moteScene = new THREE.Scene();
  const motePoints = new THREE.Points(moteGeometry, moteMaterial);
  motePoints.frustumCulled = false;
  moteScene.add(motePoints);
  const updateMotes = (time: number, fade: number) => {
    const e = holeUniforms.uElev.value, zoom = holeUniforms.uZoom.value, shift = holeUniforms.uShift.value;
    // Камера шейдера: позиция C = 28 * (0, sin e, cos e), взгляд f = -C / 28, право r = (1, 0, 0), верх u = (0, -f.z, f.y).
    const cy = 28 * Math.sin(e), cz = 28 * Math.cos(e);
    const fy = -Math.sin(e), fz = -Math.cos(e);
    const uy = -fz, uz = fy;
    const roll = -0.08, cr = Math.cos(roll), sr = Math.sin(roll);
    const ratio = Math.min(devicePixelRatio, small ? 2 : 1.5);
    // На узком экране дыра меньше, пылинки тоже мельче.
    const dotScale = Math.min(1, Math.sqrt(innerWidth / 1200));
    for (let i = 0; i < MOTES; i++) {
      const m = moteOrbit[i]!;
      const ang = m.a - time * m.w;
      const dx = Math.cos(ang) * m.r, dy = m.y - cy, dz = Math.sin(ang) * m.r - cz;
      const depth = dy * fy + dz * fz;
      const sx = (2 * dx) / depth, sy = (2 * (dy * uy + dz * uz)) / depth;
      // Обратно в координаты экрана: поворот, масштаб и сдвиг, обратные шейдерным.
      const qx = (cr * sx - sr * sy) / zoom + shift.x, qy = (sr * sx + cr * sy) / zoom + shift.y;
      motePos[i * 3] = qx / aspect; motePos[i * 3 + 1] = qy; motePos[i * 3 + 2] = 0;
      // За тенью: луч от камеры к пылинке проходит ближе 2.7 к центру дыры, а сама пылинка дальше этой точки.
      const len = Math.hypot(dx, dy, dz);
      const nx = dx / len, ny = dy / len, nz = dz / len;
      const tc = -(cy * ny + cz * nz);
      const closest = Math.hypot(nx * tc, cy + ny * tc, cz + nz * tc);
      const hidden = len > tc && closest < 2.7;
      const twinkle = 0.75 + 0.25 * Math.sin(time * 2.1 + i * 1.7);
      moteAlpha[i] = hidden ? 0 : m.glow * twinkle * fade;
      moteSize[i] = m.size * ratio * dotScale;
    }
    moteGeometry.attributes['position']!.needsUpdate = true;
    moteGeometry.attributes['aAlpha']!.needsUpdate = true;
    moteGeometry.attributes['aSize']!.needsUpdate = true;
  };

  let baseZoom = 0.68;
  const state = { b: 0, p: 0, out: 0 };
  let aspect = 1, visibleWidth = 8, visibleHeight = 5;
  const resize = () => {
    renderer.setSize(innerWidth, innerHeight, false);
    aspect = innerWidth / innerHeight;
    camera.aspect = aspect;
    camera.fov = aspect < 1 ? 52 : 38;
    camera.updateProjectionMatrix();
    visibleHeight = 2 * CAM_Z * Math.tan((camera.fov * Math.PI) / 360);
    visibleWidth = visibleHeight * aspect;
    // Разрешение дыры считается от реальной плотности пикселей экрана (на ретине и телефоне выше), но не больше
    // примерно 1,7 млн пикселей, чтобы большой монитор не тормозил. Раньше было 0,6-0,7 от CSS-пикселей, и дыра шла квадратами.
    const dense = Math.min(Math.max(devicePixelRatio * 0.62, 0.8), small ? 1.1 : 0.95);
    const scale = Math.min(dense, Math.sqrt(1.7e6 / (innerWidth * innerHeight)));
    const w = Math.max(64, Math.round(innerWidth * scale)), h = Math.max(64, Math.round(innerHeight * scale));
    holeTarget.setSize(w, h);
    holeUniforms.uRes.value.set(w, h);
    compositeMaterial.uniforms['uTexel']!.value.set(1 / w, 1 / h);
    // uZoom меньше 1 увеличивает дыру. На узком экране дыра вписывается по ширине.
    baseZoom = aspect < 1 ? Math.max(0.9, 0.7 / aspect) : 0.68;
    holeUniforms.uZoom.value = baseZoom;
    holeUniforms.uShift.value.set(0, aspect < 1 ? -0.02 : -0.12);
  };
  resize();
  addEventListener('resize', resize, { passive: true });

  root.classList.add('three-on');
  // Экраны вылетают, пока прокрутка идёт от конца первого экрана до начала секции проектов.
  ScrollTrigger.create({ trigger: top, start: 'bottom 80%', endTrigger: section, end: 'top top', onUpdate: self => { state.b = self.progress; }, onRefresh: self => { state.b = self.progress; } });
  const stageTrigger = ScrollTrigger.create({ trigger: section, start: 'top top', end: 'bottom bottom', onUpdate: self => { state.p = self.progress; }, onRefresh: self => { state.p = self.progress; } });
  ScrollTrigger.create({ trigger: section, start: 'bottom bottom', end: 'bottom top', onUpdate: self => { state.out = self.progress; }, onRefresh: self => { state.out = self.progress; } });
  ScrollTrigger.refresh();

  const began = performance.now();
  let focusNow = 0, activeIndex = -1, shownIndex = -2, last = began, lastShift = 1e9, lastSize = 0, lastEnd = -1, cleared = false, bornAt = 0;

  const frame = () => {
    requestAnimationFrame(frame);
    if (document.hidden || state.out >= 0.999) { target.style.opacity = '0'; return; }
    const now = performance.now();
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const t = (now - began) / 1000;
    const damp = 1 - Math.exp(-dt * 5);
    // Остановок на одну больше, чем проектов: последняя это кнопка «Все работы».
    focusNow += (state.p * count - focusNow) * damp;

    // Масштаб ленты: на телефоне экран почти во всю ширину, на компьютере около 60% и чуть правее, чтобы слева осталось место подписи.
    const wide = aspect >= 1.25;
    const unit = (visibleWidth * (aspect < 1 ? 0.88 : wide ? 0.54 : 0.7)) / W;
    const spacing = visibleWidth * (aspect < 1 ? 0.92 : 0.7);
    const shiftX = wide ? visibleWidth * 0.15 : 0;
    const baseY = visibleHeight * (aspect < 1 ? 0.1 : wide ? 0.03 : 0.12);
    // Лента уже собрана и едет вместе со страницей: пока секция не закрепилась (или уже уходит), картинка сцены
    // сдвигается на то же число пикселей через смещение проекции камеры. Дыра рисуется отдельно и не сдвигается.
    const box = section.getBoundingClientRect();
    const shiftY = box.top > 0 ? box.top : Math.min(0, box.bottom - innerHeight);
    if (Math.abs(shiftY - lastShift) > 0.5 || lastSize !== innerWidth * 10000 + innerHeight) {
      lastShift = shiftY; lastSize = innerWidth * 10000 + innerHeight;
      if (Math.abs(shiftY) < 0.5) camera.clearViewOffset();
      else camera.setViewOffset(innerWidth, innerHeight, 0, -shiftY, innerWidth, innerHeight);
    }
    const onScreen = box.top < innerHeight && box.bottom > 0;
    const camZ = CAM_Z;

    panels.forEach((panel, index) => {
      const rel = index - focusNow;
      const ahead = Math.max(0, rel), behind = Math.max(0, -rel);
      const fx = (rel >= 0 ? rel * spacing : rel * spacing * 0.9) + shiftX;
      const fz = -(Math.min(ahead, 3) * 2.2 + Math.min(behind, 3) * 2.2);
      const fry = rel >= 0 ? -0.3 * Math.min(ahead, 1.5) : 0.3 * Math.min(behind, 1);
      const fop = rel >= 0 ? 1 : clamp01(1 - behind * 1.6);
      panel.group.position.set(fx, baseY, fz);
      panel.group.rotation.set(0, fry, 0);
      panel.group.scale.setScalar(unit);
      const fade = onScreen ? 1 : 0;
      panel.material.opacity = fade * fop;
      panel.frame.opacity = fade * fop;
      const near = 1 - clamp01(Math.abs(rel));
      panel.material.color.setScalar(0.5 + 0.5 * near);
      // Превью: страница начинает листаться, как только экран подъезжает к центру (не нужно ждать полной остановки),
      // всегда с одной скоростью. Дошла до конца: пауза, потом так же ровно обратно. Ушёл экран: возвращается наверх.
      if (panel.span > 0.02) {
        const arrived = Math.abs(rel) < 0.3 && box.top < innerHeight * 0.35 && box.bottom > innerHeight * 0.65;
        panel.settled = arrived ? panel.settled + dt : 0;
        const speed = 0.035;
        if (panel.settled > 0.15) {
          if (panel.hold > 0) panel.hold -= dt;
          else {
            panel.scroll += panel.dir * speed * dt;
            if (panel.scroll >= panel.span) { panel.scroll = panel.span; panel.dir = -1; panel.hold = 1.6; }
            else if (panel.scroll <= 0) { panel.scroll = 0; panel.dir = 1; panel.hold = 1.6; }
          }
        } else if (!arrived) {
          panel.scroll = Math.max(0, panel.scroll - dt * 0.6);
          panel.dir = 1; panel.hold = 0;
        }
        panel.texture.offset.y = panel.span - panel.scroll;
      }
    });

    camera.position.set(tilt.x * 0.35, -tilt.y * 0.22, camZ);
    camera.lookAt(0, 0, 0);
    stars.rotation.y = t * 0.035;
    stars.rotation.x = Math.sin(t * 0.11) * 0.06;

    // Подпись меняется, только когда экран почти доехал до следующего.
    const visual = Math.min(count - 1, Math.max(0, focusNow));
    if (activeIndex < 0) activeIndex = Math.round(visual);
    else if (visual > activeIndex + 0.8) activeIndex = Math.min(count - 1, Math.floor(visual + 0.2));
    else if (visual < activeIndex - 0.8) activeIndex = Math.max(0, Math.ceil(visual - 0.2));
    if (activeIndex !== shownIndex) {
      shownIndex = activeIndex;
      items.forEach((item, i) => item.classList.toggle('is-active', i === shownIndex));
      if (counter) counter.textContent = pad(shownIndex + 1);
    }

    // Последняя остановка: подписи проектов гаснут, появляется кнопка «Все работы».
    const end = smooth((focusNow - (count - 1) - 0.35) / 0.5);
    if (Math.abs(end - lastEnd) > 0.004) { lastEnd = end; section.style.setProperty('--end', end.toFixed(3)); section.classList.toggle('at-end', end > 0.5); }
    target.style.opacity = '1';

    // Дыра «зажигается» плавно с первого кадра сцены, а не появляется сразу.
    if (!bornAt) { bornAt = now; markHoleBorn(); }
    const age = (now - bornAt) / 1000;
    // После взрыва дыра рождается маленькой и растёт (увеличиваем uZoom до обычного), потом вокруг неё проявляются кружащие частицы.
    // Без вступления дыра просто плавно проявляется.
    const grow = introActive ? 1 - (1 - clamp01(age / 2.8)) ** 3 : 1;
    holeUniforms.uZoom.value = baseZoom * (1 + (1 - grow) * 3.4);
    const appear = introActive ? smooth(age / 0.8) : smooth(age / 2.2);
    const holeFade = (1 - smooth(state.b * 1.6)) * appear;
    const motesFade = holeFade * (introActive ? smooth((age - 0.6) / 1.6) : 1);
    // Когда дыры уже не видно и лента вне экрана (читают «Как работаю», «Стоимость» и ниже), кадр не рисуется: холст остаётся пустым.
    if (holeFade <= 0.01 && !onScreen) {
      if (cleared) return;
      cleared = true;
      renderer.setRenderTarget(null);
      renderer.clear();
      return;
    }
    cleared = false;
    renderer.setRenderTarget(null);
    renderer.clear();
    if (holeFade > 0.01) {
      holeUniforms.uTime.value = t;
      // Дыра чуть поворачивается за курсором или наклоном телефона: видно, что она объёмная.
      holeUniforms.uElev.value = 0.13 + tilt.y * 0.05;
      holeUniforms.uShift.value.x = -tilt.x * 0.025;
      holeUniforms.uFade.value = holeFade;
      renderer.setRenderTarget(holeTarget);
      renderer.clear();
      renderer.render(holeScene, flat);
      renderer.setRenderTarget(null);
      renderer.render(composite, flat);
      updateMotes(t, motesFade);
      renderer.render(moteScene, flat);
    }
    renderer.clearDepth();
    renderer.render(scene, camera);
    target.dataset['ready'] = 'true';
  };
  frame();

  // Листание мышью и пальцем: тянем ленту вбок, страница прокручивается на нужную долю. После отпускания экран доезжает до ближайшего проекта.
  const layer = section.querySelector<HTMLElement>('[data-stage-drag]');
  const perProject = () => (stageTrigger.end - stageTrigger.start) / Math.max(1, count);
  const snap = () => {
    const per = perProject();
    const index = Math.round((scrollY - stageTrigger.start) / per);
    window.scrollTo({ top: stageTrigger.start + Math.min(count, Math.max(0, index)) * per, behavior: 'smooth' });
  };
  if (layer) {
    let down = false, lastX = 0, startX = 0;
    layer.addEventListener('pointerdown', event => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      down = true; lastX = startX = event.clientX;
      layer.setPointerCapture(event.pointerId);
      layer.classList.add('is-drag');
    });
    layer.addEventListener('pointermove', event => {
      if (!down) return;
      const delta = event.clientX - lastX;
      lastX = event.clientX;
      if (Math.abs(event.clientX - startX) < 4) return;
      window.scrollBy({ top: -delta * (perProject() / (innerWidth * 0.6)), behavior: 'instant' });
    });
    const release = () => { if (!down) return; down = false; layer.classList.remove('is-drag'); snap(); };
    layer.addEventListener('pointerup', release);
    layer.addEventListener('pointercancel', release);
  }
  addEventListener('keydown', event => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    const target = event.target as HTMLElement | null;
    if (target && (target.closest('input,textarea,select,dialog') || target.isContentEditable)) return;
    if (state.p <= 0 || state.p >= 1) return;
    const per = perProject();
    const index = Math.round((scrollY - stageTrigger.start) / per) + (event.key === 'ArrowRight' ? 1 : -1);
    window.scrollTo({ top: stageTrigger.start + Math.min(count, Math.max(0, index)) * per, behavior: 'smooth' });
  });
}

if (canvas && stage && hero && items.length > 0 && !calm && !saver && hasWebgl2) {
  const run = () => { start(canvas, stage, hero).catch(() => { root.classList.remove('three-on'); canvas.remove(); markHoleBorn(); }); };
  if ('requestIdleCallback' in window) requestIdleCallback(run, { timeout: 2000 }); else setTimeout(run, 600);
} else {
  // Сцены не будет (нет WebGL2, «меньше движения» или экономия трафика): вступление не должно её ждать.
  markHoleBorn();
}
