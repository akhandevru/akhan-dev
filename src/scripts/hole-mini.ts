import { holeFragment } from './hole-shader';
import { tilt } from './parallax';

// Маленькая копия чёрной дыры с главной для страницы 404: тот же шейдер, но без three.js, на голом WebGL.
// Рисуется 30 раз в секунду только пока вкладка видна; при «меньше движения» один неподвижный кадр.
const canvas = document.querySelector<HTMLCanvasElement>('[data-hole-mini]');
const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;

const vertex = 'attribute vec2 aPos; varying vec2 vUv; void main() { vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }';

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
}

function run(target: HTMLCanvasElement) {
  const gl = target.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false });
  if (!gl) return;
  const vs = compile(gl, gl.VERTEX_SHADER, vertex);
  const fs = compile(gl, gl.FRAGMENT_SHADER, holeFragment);
  const program = gl.createProgram();
  if (!vs || !fs || !program) return;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
  gl.useProgram(program);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, 'aPos');
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  const at = (name: string) => gl.getUniformLocation(program, name);
  const uRes = at('uRes'), uTime = at('uTime'), uElev = at('uElev'), uShift = at('uShift');
  gl.uniform1f(at('uFade'), 1);
  gl.uniform1f(at('uElev'), 0.13);
  // Меньше uZoom, крупнее дыра. Тень занимает примерно треть высоты холста, диск помещается по ширине.
  gl.uniform1f(at('uZoom'), 0.7);
  gl.uniform2f(at('uShift'), 0, 0);
  gl.clearColor(0, 0, 0, 0);

  const resize = () => {
    const ratio = Math.min(devicePixelRatio, 1.5);
    target.width = Math.max(2, Math.round(target.clientWidth * ratio));
    target.height = Math.max(2, Math.round(target.clientHeight * ratio));
    gl.viewport(0, 0, target.width, target.height);
    gl.uniform2f(uRes, target.width, target.height);
  };
  const draw = (seconds: number) => {
    gl.uniform1f(uTime, seconds);
    gl.uniform1f(uElev, 0.13 + tilt.y * 0.06);
    gl.uniform2f(uShift, -tilt.x * 0.04, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };
  resize();
  addEventListener('resize', () => { resize(); if (calm) draw(4); }, { passive: true });
  document.documentElement.classList.add('hole-on');

  if (calm) { draw(4); return; }
  let last = 0;
  const frame = (now: number) => {
    requestAnimationFrame(frame);
    if (document.hidden || now - last < 33) return;
    last = now;
    draw(now / 1000);
  };
  requestAnimationFrame(frame);
}

if (canvas) run(canvas);
