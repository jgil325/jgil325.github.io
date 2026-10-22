// Draws the home page's scene art as a grid of colored dots, like a halftone
// screen: each dot takes the color of the area it covers and its size follows
// brightness. Day draws ink-sized dots on the light canvas; night grades the
// same picture toward blue and draws light on dark.
//
// Motion stays light: dots dissolve in, in ordered-dither order, the first
// time a scene appears (the hero only on the first visit of a session), then
// the clouds billow and wind runs through the grass at 30 fps. Scenes pause
// offscreen and in background tabs. Reduced motion gets one still frame.
(() => {
  const root = document.documentElement;
  const stages = [...document.querySelectorAll(".scene-stage")];
  if (!stages.length) return;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const systemDark = window.matchMedia("(prefers-color-scheme: dark)");
  const isDark = () =>
    root.dataset.theme ? root.dataset.theme === "dark" : systemDark.matches;

  const CELL = 6; // CSS pixels per dot
  const REVEAL_MS = 1100;
  const FPS = 30;
  const LOOKS = {
    light: {
      ground: [250, 250, 252],
      min: 0.5,
      max: 0.9,
      gamma: 0.9,
      sat: 1.35,
      exposure: 0.97,
      round: 0,
      night: 0,
    },
    dark: {
      ground: [21, 23, 27],
      min: 0.25,
      max: 0.8,
      gamma: 0.9,
      sat: 1.3,
      exposure: 1.05,
      round: 1,
      night: 1,
    },
  };

  const VERTEX = `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`;

  const FRAGMENT = `#version 300 es
precision highp float;
uniform sampler2D uImage;
uniform vec2 uRes;
uniform float uCell;
uniform vec2 uOrigin;
uniform vec2 uScale;
uniform float uLod;
uniform vec3 uGround;
uniform float uDark;
uniform float uNight;
uniform float uRound;
uniform float uMin;
uniform float uMax;
uniform float uGamma;
uniform float uSat;
uniform float uExposure;
uniform vec2 uFade;
uniform float uReveal;
uniform float uTime;
uniform float uMotion;
uniform float uSkyline;
uniform float uWind;
out vec4 outColor;

float bayer2(vec2 a) { a = floor(a); return fract(a.x / 2.0 + a.y * a.y * 0.75); }
float bayer4(vec2 a) { return bayer2(0.5 * a) * 0.25 + bayer2(a); }
float bayer8(vec2 a) { return bayer4(0.5 * a) * 0.25 + bayer2(a); }
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}
float hue(vec3 c) {
  float hi = max(c.r, max(c.g, c.b));
  float d = hi - min(c.r, min(c.g, c.b));
  if (d < 1e-4) return 0.0;
  float h = hi == c.r ? mod((c.g - c.b) / d, 6.0) : hi == c.g ? (c.b - c.r) / d + 2.0 : (c.r - c.g) / d + 4.0;
  return h / 6.0;
}

void main() {
  vec2 px = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  vec2 cell = floor(px / uCell);
  vec2 uv = uOrigin + (cell + 0.5) * uCell / uRes * uScale;

  // Classify the cell from a softer sample so the masks do not flicker:
  // yellow-green grass bends in the wind; bright, pale sky billows.
  vec3 soft = textureLod(uImage, uv, uLod + 1.5).rgb;
  float hi = max(soft.r, max(soft.g, soft.b));
  float sat = hi > 0.0 ? (hi - min(soft.r, min(soft.g, soft.b))) / hi : 0.0;
  float grass = smoothstep(0.15, 0.3, sat) * (1.0 - smoothstep(0.08, 0.12, abs(hue(soft) - 0.22)));
  float sky = smoothstep(0.6, 0.8, dot(soft, vec3(0.2126, 0.7152, 0.0722)))
    * (1.0 - smoothstep(0.35, 0.5, sat))
    * (1.0 - smoothstep(uSkyline - 0.06, uSkyline, uv.y));

  // Wind: a slow wave sways the grass from side to side, a little stronger
  // in passing gusts and toward the bottom, where the blades are nearest.
  float gust = 0.5 + 0.5 * noise(vec2(uv.x * 2.5 - uTime * 0.22, uv.y * 3.0));
  float sway = sin(uv.x * 22.0 + uv.y * 9.0 - uTime * 1.4) * gust * grass * uWind * uMotion;
  // Clouds billow and drift slowly back and forth.
  vec2 billow = vec2(noise(uv * 4.0 + uTime * 0.09), noise(uv * 4.0 + 17.0 - uTime * 0.075)) - 0.5;
  vec2 shift = vec2(sway * 0.013 * smoothstep(0.35, 1.0, uv.y), 0.0)
    + (billow * 0.03 + vec2(0.035 * sin(uTime * 0.06), 0.0)) * sky * uMotion;

  vec3 c = textureLod(uImage, uv + shift, uLod).rgb + max(sway, 0.0) * 0.05;
  if (uNight > 0.5) c = pow(clamp(c * vec3(0.55, 0.66, 0.98), 0.0, 1.0), vec3(1.15));
  float lum = dot(c, vec3(0.2126, 0.7152, 0.0722));
  vec3 col = clamp((vec3(lum) + (c - lum) * uSat) * uExposure, 0.0, 1.0);
  float size = uMin + (uMax - uMin) * pow(clamp(uDark > 0.5 ? lum : 1.0 - lum, 0.0, 1.0), uGamma);
  // Light drifting across the field.
  size *= 1.0 + 0.1 * uMotion * (noise(cell * 0.07 + vec2(uTime * 0.11, uTime * 0.04)) - 0.5);

  // Edges dissolve in an ordered pattern instead of fading.
  float v = (cell.y + 0.5) * uCell / uRes.y;
  float keep = (uFade.x > 0.0 ? smoothstep(0.0, uFade.x, v) : 1.0) * (uFade.y > 0.0 ? 1.0 - smoothstep(1.0 - uFade.y, 1.0, v) : 1.0);
  float order = bayer8(cell);
  if (keep <= order) size = 0.0;
  // The first appearance: dots pop in by dither order, the top a little first.
  float start = order * 0.7 + v * 0.3;
  size *= smoothstep(start, start + 0.12, uReveal * 1.12);

  vec2 p = px - (cell + 0.5) * uCell;
  float hs = size * uCell * 0.5;
  float cover;
  if (uRound > 0.5) {
    cover = clamp(hs * 1.12 - length(p) + 0.5, 0.0, 1.0);
  } else {
    vec2 c2 = clamp(min(p + 0.5, vec2(hs)) - max(p - 0.5, vec2(-hs)), 0.0, 1.0);
    cover = c2.x * c2.y;
  }
  outColor = vec4(mix(uGround, col, cover), 1.0);
}`;

  const UNIFORMS = [
    "uImage",
    "uRes",
    "uCell",
    "uOrigin",
    "uScale",
    "uLod",
    "uGround",
    "uDark",
    "uNight",
    "uRound",
    "uMin",
    "uMax",
    "uGamma",
    "uSat",
    "uExposure",
    "uFade",
    "uReveal",
    "uTime",
    "uMotion",
    "uSkyline",
    "uWind",
  ];

  class WebGLRenderer {
    constructor(canvas) {
      const gl = canvas.getContext("webgl2", {
        alpha: false,
        antialias: false,
        // Keeps the frame available for the theme switch's snapshot.
        preserveDrawingBuffer: true,
        // Software-rendered WebGL would draw every frame on the CPU and
        // block the page; such devices get the still Canvas 2D frame.
        failIfMajorPerformanceCaveat: true,
      });
      if (!gl) throw new Error("Hardware-accelerated WebGL2 unavailable");
      const compile = (type, source) => {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
          throw new Error(gl.getShaderInfoLog(shader));
        return shader;
      };
      const program = gl.createProgram();
      gl.attachShader(program, compile(gl.VERTEX_SHADER, VERTEX));
      gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAGMENT));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS))
        throw new Error(gl.getProgramInfoLog(program));
      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 3, -1, -1, 3]),
        gl.STATIC_DRAW,
      );
      const position = gl.getAttribLocation(program, "aPos");
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
      this.u = Object.fromEntries(
        UNIFORMS.map((name) => [name, gl.getUniformLocation(program, name)]),
      );
      this.gl = gl;
      this.canvas = canvas;
    }

    upload(image) {
      const gl = this.gl;
      gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        image,
      );
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(
        gl.TEXTURE_2D,
        gl.TEXTURE_MIN_FILTER,
        gl.LINEAR_MIPMAP_LINEAR,
      );
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }

    draw(s) {
      const { gl, u, canvas } = this;
      const look = s.look;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform1i(u.uImage, 0);
      gl.uniform2f(u.uRes, canvas.width, canvas.height);
      gl.uniform1f(u.uCell, s.cell);
      gl.uniform2f(u.uOrigin, ...s.frame.origin);
      gl.uniform2f(u.uScale, ...s.frame.scale);
      gl.uniform1f(u.uLod, Math.log2(Math.max(s.frame.texelsPerCell, 1)));
      gl.uniform3f(u.uGround, ...look.ground.map((value) => value / 255));
      gl.uniform1f(u.uDark, look.night);
      gl.uniform1f(u.uNight, look.night);
      gl.uniform1f(u.uRound, look.round);
      gl.uniform1f(u.uMin, look.min);
      gl.uniform1f(u.uMax, look.max);
      gl.uniform1f(u.uGamma, look.gamma);
      gl.uniform1f(u.uSat, look.sat);
      gl.uniform1f(u.uExposure, look.exposure);
      gl.uniform2f(u.uFade, ...s.fade);
      gl.uniform1f(u.uReveal, s.reveal);
      gl.uniform1f(u.uTime, s.time);
      gl.uniform1f(u.uMotion, s.motion ? 1 : 0);
      gl.uniform1f(u.uSkyline, s.skyline);
      gl.uniform1f(u.uWind, s.wind);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
  }

  // Without WebGL2: the same dots as one still frame, drawn with Canvas 2D.
  class CanvasRenderer {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.sample = document.createElement("canvas");
    }

    upload(image) {
      this.image = image;
    }

    draw(s) {
      const { canvas, ctx, sample, image } = this;
      const look = s.look;
      const cols = Math.ceil(canvas.width / s.cell);
      const rows = Math.ceil(canvas.height / s.cell);
      sample.width = cols;
      sample.height = rows;
      const sctx = sample.getContext("2d", { willReadFrequently: true });
      const { origin, scale } = s.frame;
      const iw = image.naturalWidth;
      const ih = image.naturalHeight;
      sctx.save();
      if (scale[0] < 0) {
        sctx.translate(cols, 0);
        sctx.scale(-1, 1);
      }
      const sx = (scale[0] < 0 ? origin[0] + scale[0] : origin[0]) * iw;
      sctx.imageSmoothingQuality = "high";
      sctx.drawImage(
        image,
        sx,
        origin[1] * ih,
        Math.abs(scale[0]) * iw,
        scale[1] * ih,
        0,
        0,
        cols,
        rows,
      );
      sctx.restore();
      const pixels = sctx.getImageData(0, 0, cols, rows).data;
      ctx.fillStyle = `rgb(${look.ground})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      for (let y = 0; y < rows; y++) {
        const v = (y + 0.5) / rows;
        const keep =
          (s.fade[0] ? smooth(0, s.fade[0], v) : 1) *
          (s.fade[1] ? 1 - smooth(1 - s.fade[1], 1, v) : 1);
        for (let x = 0; x < cols; x++) {
          if (keep <= bayer8(x, y)) continue;
          const i = (y * cols + x) * 4;
          let rgb = [pixels[i], pixels[i + 1], pixels[i + 2]].map(
            (value) => value / 255,
          );
          if (look.night)
            rgb = [0.55, 0.66, 0.98].map(
              (k, j) => Math.min(1, rgb[j] * k) ** 1.15,
            );
          const lum = 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
          const size =
            look.min +
            (look.max - look.min) *
              Math.max(0, look.night ? lum : 1 - lum) ** look.gamma;
          const color = rgb.map((value) =>
            Math.round(
              Math.min(
                1,
                Math.max(0, (lum + (value - lum) * look.sat) * look.exposure),
              ) * 255,
            ),
          );
          const half = (size * s.cell) / 2;
          const cx = (x + 0.5) * s.cell;
          const cy = (y + 0.5) * s.cell;
          ctx.fillStyle = `rgb(${color})`;
          if (look.round) {
            ctx.beginPath();
            ctx.arc(cx, cy, half * 1.12, 0, Math.PI * 2);
            ctx.fill();
          } else ctx.fillRect(cx - half, cy - half, half * 2, half * 2);
        }
      }
    }
  }

  function smooth(a, b, x) {
    const k = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return k * k * (3 - 2 * k);
  }
  function bayer8(x, y) {
    let value = 0;
    for (let bit = 0, size = 1; bit < 3; bit++, size *= 2) {
      const bx = Math.floor(x / size) % 2;
      const by = Math.floor(y / size) % 2;
      value += ((bx * 2 + by * 3) % 4) / (4 * size * size);
    }
    return value;
  }
  const numbers = (value) => (value ? value.split(" ").map(Number) : null);

  // Cover-fit the (optionally mirrored and cropped) picture to the canvas,
  // with a slow zoom and pan so it breathes under the fixed grid.
  function framing(scene, time, motion) {
    const { width: w, height: h } = scene.canvas;
    const iw = scene.image.naturalWidth;
    const ih = scene.image.naturalHeight;
    const crop = (h > w && scene.cropPortrait) || [0, 0, 1, 1];
    const regionW = (crop[2] - crop[0]) * iw;
    const regionH = (crop[3] - crop[1]) * ih;
    let sw = regionW;
    let sh = (regionW * h) / w;
    if (sh > regionH) {
      sh = regionH;
      sw = (regionH * w) / h;
    }
    const zoom = 1.04 + (motion ? 0.015 * Math.sin(time * 0.045) : 0);
    sw /= zoom;
    sh /= zoom;
    const panX = motion ? 0.012 * Math.sin(time * 0.06) * sw : 0;
    const panY = motion ? 0.008 * Math.cos(time * 0.05) * sh : 0;
    const x0 = crop[0] * iw;
    const y0 = crop[1] * ih;
    const clamp = (value, low, high) => Math.min(Math.max(value, low), high);
    const sx = clamp(
      x0 + (regionW - sw) * scene.focus[0] + panX,
      x0,
      x0 + regionW - sw,
    );
    const sy = clamp(
      y0 + (regionH - sh) * scene.focus[1] + panY,
      y0,
      y0 + regionH - sh,
    );
    const origin = [sx / iw, sy / ih];
    const scale = [sw / iw, sh / ih];
    // Crops are written for the mirrored picture; map back to the texture.
    if (scene.flip) {
      origin[0] = 1 - origin[0];
      scale[0] = -scale[0];
    }
    return { origin, scale, texelsPerCell: sw / (w / scene.cell) };
  }

  const scenes = stages.map((stage) => {
    const canvas = stage.querySelector("canvas");
    let renderer;
    try {
      renderer = new WebGLRenderer(canvas);
    } catch {
      renderer = new CanvasRenderer(canvas);
    }
    return {
      stage,
      canvas,
      renderer,
      animated: renderer instanceof WebGLRenderer,
      flip: stage.dataset.flip === "true",
      cropPortrait: numbers(stage.dataset.cropPortrait),
      focus: numbers(stage.dataset.focus) || [0.5, 0.5],
      fade: numbers(stage.dataset.fade) || [0, 0],
      skyline: Number(stage.dataset.skyline) || 0,
      wind: Number(stage.dataset.wind) || 0,
      image: null,
      visible: false,
      revealFrom: null,
      // The hero only dissolves in on the first visit of a session.
      mayReveal:
        stage.closest(".home-hero") === null || root.dataset.arrive === "true",
    };
  });

  const motion = () => !reduceMotion.matches;

  function draw(scene, now = performance.now()) {
    if (!scene.image || !scene.canvas.width) return;
    const moving = motion() && scene.animated;
    const time = now / 1000;
    let reveal = 1;
    // Infinity marks a reveal that waits for the scene to come into view.
    if (scene.revealFrom !== null)
      reveal = Math.min(1, Math.max(0, (now - scene.revealFrom) / REVEAL_MS));
    if (reveal >= 1) scene.revealFrom = null;
    scene.renderer.draw({
      look: LOOKS[isDark() ? "dark" : "light"],
      cell: scene.cell,
      frame: framing(scene, time, moving),
      fade: scene.fade,
      reveal: 1 - (1 - reveal) ** 3,
      time,
      motion: moving,
      skyline: scene.skyline,
      wind: scene.wind,
    });
  }

  function resize(scene) {
    const rect = scene.stage.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    scene.canvas.width = Math.max(1, Math.round(rect.width * dpr));
    scene.canvas.height = Math.max(1, Math.round(rect.height * dpr));
    scene.cell = Math.max(2, Math.round(CELL * dpr));
    draw(scene);
  }

  function maybeReveal(scene) {
    if (!scene.image || !scene.visible || !scene.mayReveal) return;
    scene.mayReveal = false;
    if (motion() && scene.animated) scene.revealFrom = performance.now();
    draw(scene);
  }

  const visibility = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const scene = scenes.find((item) => item.stage === entry.target);
      scene.visible = entry.isIntersecting;
      maybeReveal(scene);
    }
  });
  const sizes = new ResizeObserver((entries) => {
    for (const entry of entries)
      resize(scenes.find((item) => item.stage === entry.target));
  });

  for (const scene of scenes) {
    resize(scene);
    visibility.observe(scene.stage);
    sizes.observe(scene.stage);
    const image = new Image();
    image.decoding = "async";
    image.src = scene.stage.dataset.src;
    image
      .decode()
      .then(() => {
        scene.image = image;
        scene.renderer.upload(image);
        // Until it is seen, a revealing scene stays an empty field.
        if (scene.mayReveal && motion() && scene.animated)
          scene.revealFrom = Infinity;
        maybeReveal(scene);
        draw(scene);
      })
      .catch(() => {});
  }

  let last = 0;
  function tick(now) {
    requestAnimationFrame(tick);
    if (document.hidden || !motion()) return;
    const revealing = scenes.some(
      (scene) => scene.revealFrom !== null && scene.revealFrom <= now,
    );
    if (!revealing && now - last < 1000 / FPS) return;
    last = now;
    for (const scene of scenes)
      if (scene.visible && scene.animated) draw(scene, now);
  }
  requestAnimationFrame(tick);

  const redraw = () => scenes.forEach((scene) => draw(scene));
  document.addEventListener("portfolio:themechange", redraw);
  systemDark.addEventListener("change", redraw);
  reduceMotion.addEventListener("change", redraw);
})();
