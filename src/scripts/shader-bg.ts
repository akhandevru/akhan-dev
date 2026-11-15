export {};
// Фон сайта: медленный почти чёрный градиент с мелким зерном, на обычном WebGL (работает в любом современном браузере и на телефоне).
// Широкие мягкие полосы получаются из шума с искажением координат, зерно пересчитывается несколько раз в секунду.
// Холст в половину размера экрана, CSS растягивает его вдвое, поэтому нагрузка маленькая. Нет WebGL, включено «меньше движения»
// или экономия трафика: остаётся статичный градиент из CSS.
const canvas = document.querySelector<HTMLCanvasElement>('[data-bg-shader]');

const vertex = 'attribute vec2 aPos; void main() { gl_Position = vec4(aPos, 0.0, 1.0); }';
const fragment = `
  precision mediump float;
  uniform vec2 uRes; uniform float uTime;
  float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
  }
  float fbm(vec2 p) { float v = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { v += a * noise(p); p = p * 2.03 + 7.1; a *= 0.5; } return v; }
  void main() {
    vec2 uv = gl_FragCoord.xy / uRes;
    vec2 p = vec2(uv.x * uRes.x / uRes.y * 0.6, uv.y * 0.5);
    float t = uTime * 0.045;
    vec2 q = vec2(fbm(p + vec2(0.0, t)), fbm(p + vec2(5.2, -t * 0.8)));
    float f = fbm(p * 0.9 + 1.7 * q + vec2(t * 0.6, 0.0));
    f = smoothstep(0.12, 0.92, f);
    vec3 dark = vec3(0.024, 0.024, 0.030), light = vec3(0.092, 0.092, 0.102);
    vec3 col = mix(dark, light, f);
    // Треугольное зерно: заодно разбивает ступени яркости на тёмном градиенте.
    vec2 gp = gl_FragCoord.xy + floor(uTime * 8.0) * 17.31;
    float grain = hash(gp) + hash(gp + 3.7) - 1.0;
    col += grain * 0.012;
    gl_FragColor = vec4(col, 1.0);
  }`;

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
}

function run(target: HTMLCanvasElement) {
  const gl = target.getContext('webgl', { alpha: false, antialias: false, powerPreference: 'low-power' });
  if (!gl) { target.remove(); return; }
  const vs = compile(gl, gl.VERTEX_SHADER, vertex), fs = compile(gl, gl.FRAGMENT_SHADER, fragment), program = gl.createProgram();
  if (!vs || !fs || !program) { target.remove(); return; }
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) { target.remove(); return; }
  gl.useProgram(program);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, 'aPos');
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  const uRes = gl.getUniformLocation(program, 'uRes'), uTime = gl.getUniformLocation(program, 'uTime');

  const resize = () => {
    target.width = Math.max(2, target.clientWidth);
    target.height = Math.max(2, target.clientHeight);
    gl.viewport(0, 0, target.width, target.height);
    gl.uniform2f(uRes, target.width, target.height);
  };
  resize();
  addEventListener('resize', resize, { passive: true });

  let last = 0;
  const started = performance.now();
  const frame = (now: number) => {
    requestAnimationFrame(frame);
    if (document.hidden || now - last < 33) return;
    last = now;
    gl.uniform1f(uTime, (now - started) / 1000);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    target.dataset['ready'] = 'true';
  };
  requestAnimationFrame(frame);
}

const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
const saver = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;
if (canvas && !calm && !saver) run(canvas);
