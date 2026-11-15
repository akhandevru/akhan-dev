// Общий шейдер чёрной дыры: главная (scene3d.ts) и страница 404 (hole-mini.ts).
// Луч идёт назад от камеры и искривляется по уравнению нулевой геодезической: a = -1.5 * h^2 * p / r^5 (радиус горизонта = 1).
// Диск лежит в плоскости y = 0: тонкие волокна в полярных координатах закручиваются дифференциальным вращением (внутри быстрее),
// яркий внутренний край у ISCO, эффект Доплера, несколько пересечений дают вторичные кольца. Плюс фотонное кольцо и звёзды за дырой,
// которые тоже линзируются. Подход (геодезика + диск в полярных координатах) по мотивам rmarchet/blackhole-ts (MIT).
export const holeFragment = `
  precision highp float;
  uniform vec2 uRes; uniform float uTime; uniform float uFade; uniform float uElev; uniform float uZoom; uniform vec2 uShift;
  varying vec2 vUv;
  const float TAU = 6.2831853;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  // Шум, периодический по x с периодом per: на шве угла нет разрыва.
  float pnoise(vec2 p, float per) {
    vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    float x0 = mod(i.x, per), x1 = mod(i.x + 1.0, per);
    return mix(mix(hash(vec2(x0, i.y)), hash(vec2(x1, i.y)), f.x), mix(hash(vec2(x0, i.y + 1.0)), hash(vec2(x1, i.y + 1.0)), f.x), f.y);
  }
  float fibres(float ang, float lr, float t) {
    float a = ang / TAU;
    float v = 0.0, amp = 0.55, per = 6.0;
    for (int o = 0; o < 4; o++) {
      v += amp * pnoise(vec2(a * per, lr * per * 1.7 + t * 0.35), per);
      per *= 2.0; amp *= 0.5;
    }
    return v;
  }
  float disk(vec3 hp, vec3 v) {
    float dr = length(hp.xz);
    if (dr < 2.6 || dr > 15.0) return 0.0;
    // Кеплеровское вращение: угловая скорость ~ r^-1.5, поэтому волокна вытягиваются в спираль.
    float ang = atan(hp.z, hp.x) + uTime * 3.2 * pow(dr, -1.5);
    float lr = log(dr);
    float f = fibres(ang, lr, uTime);
    float streak = smoothstep(0.25, 0.95, f);
    // Крупные светлые сгустки: их движение по орбите хорошо видно, диск не выглядит застывшим.
    float clump = 0.55 + 0.9 * pnoise(vec2((ang / TAU) * 5.0, lr * 3.0 - uTime * 0.12), 5.0);
    float edge = smoothstep(2.6, 3.05, dr) * (1.0 - smoothstep(8.0, 15.0, dr));
    float profile = pow(3.0 / dr, 2.1) * edge;
    vec3 tang = normalize(vec3(-hp.z, 0.0, hp.x));
    float beta = 0.62 / sqrt(dr);
    // Луч идёт от камеры, фотон летит навстречу (-v): сторона диска, которая движется к нам, ярче.
    float dop = 1.0 / (1.0 + beta * dot(tang, v));
    return profile * (0.35 + 1.25 * streak) * clump * pow(dop, 2.6) * 1.1;
  }
  vec3 stars(vec3 d) {
    vec3 q = d * 90.0;
    vec3 c = floor(q);
    float h = fract(sin(dot(c, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
    if (h < 0.965) return vec3(0.0);
    vec3 o = vec3(fract(h * 13.1), fract(h * 71.7), fract(h * 37.3)) * 0.6 + 0.2;
    float s = exp(-dot(q - c - o, q - c - o) * 26.0);
    // Мерцание: у каждой звезды своя фаза.
    return vec3(s * (h - 0.965) * 22.0 * (0.6 + 0.4 * sin(uTime * 1.7 + h * 91.0)));
  }
  void main() {
    vec2 uv = vUv * 2.0 - 1.0;
    uv.x *= uRes.x / uRes.y;
    uv = (uv - uShift) * uZoom;
    float roll = -0.08;
    uv = mat2(cos(roll), -sin(roll), sin(roll), cos(roll)) * uv;
    vec3 cam = 28.0 * vec3(0.0, sin(uElev), cos(uElev));
    vec3 f = normalize(-cam);
    vec3 r = normalize(cross(f, vec3(0.0, 1.0, 0.0)));
    vec3 u = cross(r, f);
    vec3 v = normalize(f + (uv.x * r + uv.y * u) * 0.5);
    vec3 p = cam;
    float h2 = dot(cross(p, v), cross(p, v));
    vec3 col = vec3(0.0);
    float trans = 1.0, shadow = 0.0, minR = 100.0;
    bool captured = false;
    for (int i = 0; i < 120; i++) {
      float r2 = dot(p, p);
      float rr = sqrt(r2);
      minR = min(minR, rr);
      if (rr < 1.0) { shadow = trans; captured = true; break; }
      if (rr > 48.0 && dot(p, v) > 0.0) break;
      float dt = clamp(0.045 * rr, 0.03, 1.2);
      vec3 a = -1.5 * h2 * p / (r2 * r2 * rr);
      v = normalize(v + a * dt);
      vec3 pn = p + v * dt;
      if (p.y * pn.y < 0.0) {
        float t = p.y / (p.y - pn.y);
        float e = disk(mix(p, pn, t), v);
        if (e > 0.0) {
          col += vec3(e) * trans;
          trans *= 0.55;
        }
      }
      p = pn;
    }
    if (!captured) {
      // Фотонное кольцо: лучи, прошедшие у сферы фотонов (r = 1.5), дают тонкую светлую линию по краю тени.
      col += vec3(exp(-abs(minR - 1.55) * 9.0) * 0.55) * trans;
      // Звёздное небо медленно вращается, и звёзды текут вокруг дыры через линзу.
      float sa = uTime * 0.02;
      vec3 sv = vec3(cos(sa) * v.x - sin(sa) * v.z, v.y, sin(sa) * v.x + cos(sa) * v.z);
      col += stars(sv) * trans;
    }
    col = 1.0 - exp(-col * 1.35);
    float lum = max(col.r, max(col.g, col.b));
    float alpha = clamp(max(lum, shadow), 0.0, 1.0);
    col = min(col, vec3(alpha)) * uFade;
    gl_FragColor = vec4(col, alpha * uFade);
  }`;
