// Draws the home page's scene art as a grid of colored dots, like a halftone
// screen: each dot takes the color of the area it covers and its size follows
// brightness. Day draws ink-sized dots on the light canvas; night grades the
// same picture toward blue and draws light on dark.
//
// Each stage rotates through a playlist of scenes. Every scene has its own
// idle animation, built from a small set of effects (wind, clouds, sunlight,
// flickering lamps, and particles drawn on the dot grid). To change scenes,
// a ripple runs across the dots from the top right: each dot shrinks, swaps
// to the new picture, and pops back. The new scene's idle animation starts
// once the ripple has passed.
//
// Motion stays light: dots dissolve in the first time a stage appears (the
// hero only on the first visit of a session), frames run at 30 fps, stages
// pause offscreen and in background tabs, and only the current and next
// pictures are loaded. Reduced motion gets one still frame and no rotation.
// Without hardware WebGL the first scene is drawn in CSS, at no cost; the
// hardware check runs in a worker, off the main thread.
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
  const DWELL_MS = 8000; // time each scene holds
  const RIPPLE_MS = 1900;
  const IDLE_IN_MS = 1200; // the new scene's idle animation fades in
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

  // Per-scene framing and idle animation. `subject` is where the scene's
  // focus sits in the (mirrored, if `flip`) picture; each stage places it at
  // its own anchor. Effects:
  //   wind    sways regions whose hue is near windHue (grass, wheat, hair)
  //   clouds  billows and drifts bright, pale sky above the skyline
  //   sun     passes a soft band of warm light over bright areas
  //   lamps   flickers bright, saturated lights
  //   motes   particles on the dot grid: snow falls, petals and paper are
  //           blown, dust rises; density is a share of all dots
  // `contrast` below 1 calms busy pictures toward a light middle tone, so the
  // copy over them stays easy to read.
  const PARTICLES = { none: 0, snow: 1, blown: 2, dust: 3 };
  const SCENES = {
    hillside: {
      flip: true,
      subject: [0.68, 0.55],
      wind: 1,
      windHue: 0.22,
      windWidth: 0.12,
      clouds: 1,
      skyline: 0.42,
    },
    "open-skies": {
      subject: [0.75, 0.5],
      contrast: 0.9,
      wind: 0.9,
      windHue: 0.96,
      windWidth: 0.06,
      clouds: 1.2,
      skyline: 0.72,
      motes: { kind: "blown", density: 0.004, speed: 4, color: [1, 1, 1] },
    },
    "golden-hour": {
      flip: true,
      subject: [0.6, 0.45],
      wind: 1.2,
      windHue: 0.09,
      windWidth: 0.06,
      sun: 1,
      skyline: 0.35,
      motes: {
        kind: "blown",
        density: 0.0025,
        speed: 2.5,
        color: [1, 0.93, 0.78],
      },
    },
    "snowy-crossing": {
      subject: [0.85, 0.82],
      clouds: 0.7,
      skyline: 0.35,
      motes: { kind: "snow", density: 0.009, speed: 5, color: [1, 1, 1] },
    },
    "arcane-city": {
      subject: [0.52, 0.45],
      contrast: 0.8,
      clouds: 0.3,
      skyline: 0.4,
      sun: 0.4,
      lamps: 1,
      motes: {
        kind: "dust",
        density: 0.004,
        speed: 1.2,
        color: [1, 0.9, 0.68],
      },
    },
    "sunlit-study": {
      subject: [0.55, 0.55],
      contrast: 0.85,
      wind: 0.6,
      windHue: 0.27,
      windWidth: 0.1,
      clouds: 0.4,
      skyline: 0.35,
      sun: 0.7,
      lamps: 0.4,
      motes: {
        kind: "dust",
        density: 0.005,
        speed: 1,
        color: [1, 0.94, 0.78],
      },
    },
    "sleepy-cats": {
      subject: [0.72, 0.4],
      wind: 0.7,
      windHue: 0.3,
      windWidth: 0.1,
      sun: 0.45,
      motes: {
        kind: "dust",
        density: 0.003,
        speed: 0.8,
        color: [1, 0.95, 0.82],
      },
    },
  };

  // Packs a scene's effects into the shader's three vec4s and a color.
  function effects(config) {
    const motes = config.motes || {};
    return {
      fx: [
        config.wind || 0,
        config.windHue ?? 0.22,
        config.windWidth ?? 0.1,
        config.clouds || 0,
        config.skyline ?? 0.4,
        config.sun || 0,
        config.lamps || 0,
        PARTICLES[motes.kind || "none"],
        motes.density || 0,
        motes.speed || 0,
        config.contrast ?? 1,
        0,
      ],
      motes: motes.color || [1, 1, 1],
    };
  }

  const VERTEX = `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`;

  const FRAGMENT = `#version 300 es
precision highp float;
uniform sampler2D uImageA;
uniform sampler2D uImageB;
uniform vec4 uFrameA;
uniform vec4 uFrameB;
uniform vec2 uLod;
uniform vec4 uFxA[3];
uniform vec4 uFxB[3];
uniform vec3 uMotesA;
uniform vec3 uMotesB;
uniform vec2 uIdle;
uniform float uRipple;
uniform float uHasB;
uniform vec2 uRes;
uniform float uCell;
uniform vec3 uGround;
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
float hueDistance(float a, float b) { return abs(fract(a - b + 0.5) - 0.5); }

// One scene's color for a dot, with its idle animation. f0 = wind, wind hue,
// wind hue width, clouds; f1 = skyline, sun, lamps, particle kind;
// f2 = particle density, particle speed, contrast.
vec3 scene(sampler2D image, vec4 frame, float lod, vec4 f0, vec4 f1, vec4 f2, vec3 moteColor, float idle, vec2 cell) {
  vec2 uv = frame.xy + (cell + 0.5) * uCell / uRes * frame.zw;
  float t = uTime;
  float m = uMotion * idle;

  // Classify the dot from a softer sample so the masks do not flicker.
  vec3 soft = textureLod(image, uv, lod + 1.5).rgb;
  float hi = max(soft.r, max(soft.g, soft.b));
  float sat = hi > 0.0 ? (hi - min(soft.r, min(soft.g, soft.b))) / hi : 0.0;
  float softLum = dot(soft, vec3(0.2126, 0.7152, 0.0722));

  // Wind: a slow wave sways the windblown hue from side to side, stronger in
  // passing gusts and toward the bottom, where things are nearest.
  float blown = smoothstep(0.15, 0.3, sat) * (1.0 - smoothstep(f0.z * 0.7, f0.z, hueDistance(hue(soft), f0.y)));
  float gust = 0.5 + 0.5 * noise(vec2(uv.x * 2.5 - t * 0.22, uv.y * 3.0));
  float sway = sin(uv.x * 22.0 + uv.y * 9.0 - t * 1.4) * gust * blown * f0.x * m;
  // Clouds: bright, pale sky above the skyline billows and drifts.
  float sky = smoothstep(0.6, 0.8, softLum) * (1.0 - smoothstep(0.35, 0.5, sat))
    * (1.0 - smoothstep(f1.x - 0.06, f1.x, uv.y)) * f0.w * m;
  vec2 billow = vec2(noise(uv * 4.0 + t * 0.09), noise(uv * 4.0 + 17.0 - t * 0.075)) - 0.5;
  vec2 shift = vec2(sway * 0.013 * mix(0.4, 1.0, smoothstep(0.3, 1.0, uv.y)), 0.0)
    + (billow * 0.03 + vec2(0.035 * sin(t * 0.06), 0.0)) * sky;

  vec3 c = textureLod(image, uv + shift, lod).rgb + max(sway, 0.0) * 0.05;
  float lum = dot(c, vec3(0.2126, 0.7152, 0.0722));
  // Sun: a soft band of warm light passes slowly over the bright areas.
  float band = smoothstep(0.7, 1.0, sin((uv.x * 1.3 - uv.y) * 6.0 - t * 0.7));
  c += vec3(0.16, 0.11, 0.05) * band * smoothstep(0.5, 0.85, lum) * f1.y * m;
  // Lamps: bright, saturated lights flicker.
  float lamps = smoothstep(0.6, 0.85, lum) * smoothstep(0.25, 0.45, sat);
  c *= 1.0 + (noise(cell * 0.8 + t * 1.6) - 0.5) * 0.9 * lamps * f1.z * m;
  c = mix(vec3(0.62), c, f2.z);

  // Particles live on the dot grid itself, a dot each.
  if (f1.w > 0.5 && m > 0.0) {
    vec2 q = cell;
    if (f1.w < 1.5) {
      // Snow falls, weaving a little.
      q.y -= t * f2.y;
      q.x += floor(sin(t * 0.6 + q.y * 0.35) * 1.5);
    } else if (f1.w < 2.5) {
      // Petals and paper are blown to the left, rising and dipping.
      q.x += t * f2.y;
      q.y -= t * f2.y * 0.3 + floor(sin(t * 0.8 + cell.x * 0.2) * 1.2);
    } else {
      // Dust rises slowly and drifts.
      q.y += t * f2.y;
      q.x += floor(sin(t * 0.5 + cell.y * 0.25) * 1.5);
    }
    float h = hash(floor(q));
    float shine = step(h, f2.x) * (0.6 + 0.4 * sin(t * 2.0 + h * 900.0));
    c = mix(c, moteColor, clamp(shine, 0.0, 1.0) * m);
  }
  return c;
}

void main() {
  vec2 px = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  vec2 cell = floor(px / uCell);
  float order = bayer8(cell);

  // The ripple spreads from the top right corner to the bottom left. Each
  // dot shrinks as it arrives, swaps pictures at its smallest, then pops back.
  float wave = 0.0;
  if (uHasB > 0.5) {
    vec2 aspect = vec2(uRes.x / uRes.y, 1.0);
    vec2 center = (cell + 0.5) * uCell / uRes;
    float d = length(vec2(1.0 - center.x, center.y) * aspect) / length(aspect);
    float width = 0.28;
    wave = clamp((uRipple * (1.0 + width + 0.06) - d - order * 0.06) / width, 0.0, 1.0);
  }
  vec3 c = wave >= 0.5
    ? scene(uImageB, uFrameB, uLod.y, uFxB[0], uFxB[1], uFxB[2], uMotesB, uIdle.y, cell)
    : scene(uImageA, uFrameA, uLod.x, uFxA[0], uFxA[1], uFxA[2], uMotesA, uIdle.x, cell);

  if (uNight > 0.5) c = pow(clamp(c * vec3(0.55, 0.66, 0.98), 0.0, 1.0), vec3(1.15));
  float lum = dot(c, vec3(0.2126, 0.7152, 0.0722));
  vec3 col = clamp((vec3(lum) + (c - lum) * uSat) * uExposure, 0.0, 1.0);
  float size = uMin + (uMax - uMin) * pow(clamp(uNight > 0.5 ? lum : 1.0 - lum, 0.0, 1.0), uGamma);
  // Light drifting across the field.
  size *= 1.0 + 0.1 * uMotion * (noise(cell * 0.07 + vec2(uTime * 0.11, uTime * 0.04)) - 0.5);
  if (uHasB > 0.5)
    size *= wave < 0.5
      ? 1.0 - 0.95 * smoothstep(0.0, 0.5, wave)
      : 0.05 + 1.05 * smoothstep(0.5, 0.85, wave) - 0.1 * smoothstep(0.85, 1.0, wave);

  // Edges dissolve in an ordered pattern instead of fading.
  float v = (cell.y + 0.5) * uCell / uRes.y;
  float keep = (uFade.x > 0.0 ? smoothstep(0.0, uFade.x, v) : 1.0) * (uFade.y > 0.0 ? 1.0 - smoothstep(1.0 - uFade.y, 1.0, v) : 1.0);
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
    "uImageA",
    "uImageB",
    "uFrameA",
    "uFrameB",
    "uLod",
    "uFxA",
    "uFxB",
    "uMotesA",
    "uMotesB",
    "uIdle",
    "uRipple",
    "uHasB",
    "uRes",
    "uCell",
    "uGround",
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
  ];

  class WebGLRenderer {
    constructor(canvas) {
      const gl = canvas.getContext("webgl2", {
        alpha: false,
        antialias: false,
        // Keeps the frame available for the theme switch's snapshot.
        preserveDrawingBuffer: true,
        // Software-rendered WebGL would draw every frame on the CPU and
        // block the page; such devices get the CSS still scene.
        failIfMajorPerformanceCaveat: true,
      });
      if (!gl) throw new Error("Hardware-accelerated WebGL2 unavailable");
      // Some browsers hand out software WebGL without the caveat.
      const info = gl.getExtension("WEBGL_debug_renderer_info");
      const name = `${gl.getParameter(gl.RENDERER)} ${info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : ""}`;
      if (/swiftshader|llvmpipe|softpipe|software|basic render/i.test(name)) {
        gl.getExtension("WEBGL_lose_context")?.loseContext();
        throw new Error("WebGL2 is software-rendered");
      }
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
      this.textures = new Map();
      this.gl = gl;
      this.canvas = canvas;
    }

    upload(image) {
      if (this.textures.has(image)) return;
      const gl = this.gl;
      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
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
      this.textures.set(image, texture);
    }

    // Only the current and next pictures stay on the GPU.
    release(keep) {
      for (const [image, texture] of this.textures)
        if (!keep.includes(image)) {
          this.gl.deleteTexture(texture);
          this.textures.delete(image);
        }
    }

    draw(s) {
      const { gl, u, canvas } = this;
      const look = s.look;
      const slots = [s.a, s.b || s.a];
      slots.forEach((slot, unit) => {
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(gl.TEXTURE_2D, this.textures.get(slot.image));
      });
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform1i(u.uImageA, 0);
      gl.uniform1i(u.uImageB, 1);
      gl.uniform4f(
        u.uFrameA,
        ...slots[0].frame.origin,
        ...slots[0].frame.scale,
      );
      gl.uniform4f(
        u.uFrameB,
        ...slots[1].frame.origin,
        ...slots[1].frame.scale,
      );
      gl.uniform2f(u.uLod, slots[0].frame.lod, slots[1].frame.lod);
      gl.uniform4fv(u.uFxA, slots[0].effects.fx);
      gl.uniform4fv(u.uFxB, slots[1].effects.fx);
      gl.uniform3f(u.uMotesA, ...slots[0].effects.motes);
      gl.uniform3f(u.uMotesB, ...slots[1].effects.motes);
      gl.uniform2f(u.uIdle, slots[0].idle, slots[1].idle);
      gl.uniform1f(u.uRipple, s.ripple);
      gl.uniform1f(u.uHasB, s.b ? 1 : 0);
      gl.uniform2f(u.uRes, canvas.width, canvas.height);
      gl.uniform1f(u.uCell, s.cell);
      gl.uniform3f(u.uGround, ...look.ground.map((value) => value / 255));
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
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
  }

  function smooth(a, b, x) {
    const k = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return k * k * (3 - 2 * k);
  }
  const numbers = (value) => (value ? value.split(" ").map(Number) : null);
  const clamp = (value, low, high) => Math.min(Math.max(value, low), high);

  // Cover-fit the picture to the canvas with the scene's subject at the
  // stage's anchor, plus a slow zoom and pan so it breathes under the grid.
  function framing(player, config, image, time, motion) {
    const { width: w, height: h } = player.canvas;
    const iw = image.naturalWidth;
    const ih = image.naturalHeight;
    let sw = iw;
    let sh = (iw * h) / w;
    if (sh > ih) {
      sh = ih;
      sw = (ih * w) / h;
    }
    const zoom = 1.04 + (motion ? 0.015 * Math.sin(time * 0.045) : 0);
    sw /= zoom;
    sh /= zoom;
    const anchor = (h > w && player.anchorPortrait) || player.anchor;
    const panX = motion ? 0.012 * Math.sin(time * 0.06) * sw : 0;
    const panY = motion ? 0.008 * Math.cos(time * 0.05) * sh : 0;
    const sx = clamp(
      config.subject[0] * iw - anchor[0] * sw + panX,
      0,
      iw - sw,
    );
    const sy = clamp(
      config.subject[1] * ih - anchor[1] * sh + panY,
      0,
      ih - sh,
    );
    const origin = [sx / iw, sy / ih];
    const scale = [sw / iw, sh / ih];
    // The subject is given for the mirrored picture; map back to the texture.
    if (config.flip) {
      origin[0] = 1 - origin[0];
      scale[0] = -scale[0];
    }
    return {
      origin,
      scale,
      lod: Math.log2(Math.max(sw / (w / player.cell), 1)),
    };
  }

  // Without hardware WebGL2 the first scene is drawn in CSS instead: the
  // picture under a repeating dot pattern of the page color, mirrored and
  // placed like the animated scene. The browser paints it off the main
  // thread, so slow devices pay nothing for it.
  function stillScene(stage, canvas, playlist) {
    const first = playlist[0];
    const config = SCENES[first.key];
    const [top, bottom] = numbers(stage.dataset.fade) || [0, 0];
    stage.dataset.still = "";
    if (config.flip) stage.dataset.flip = "";
    // The canvas is mirrored as a whole, so position by the unmirrored subject.
    const x = config.flip ? 1 - config.subject[0] : config.subject[0];
    canvas.style.setProperty("--scene-image", `url("${first.src}")`);
    canvas.style.setProperty(
      "--scene-position",
      `${x * 100}% ${config.subject[1] * 100}%`,
    );
    const mask = `linear-gradient(transparent, #000 ${top * 100}%, #000 ${(1 - bottom) * 100}%, transparent)`;
    canvas.style.webkitMaskImage = mask;
    canvas.style.maskImage = mask;
  }

  // Whether the device has hardware-accelerated WebGL2. Creating a context
  // where WebGL is emulated in software can block for a long time, so the
  // check runs on an offscreen canvas in a worker where the browser allows
  // it. The answer is true, false, or null when the worker could not tell.
  const PROBE = `
    const gl = new OffscreenCanvas(1, 1).getContext("webgl2", {
      failIfMajorPerformanceCaveat: true,
    });
    let hardware = Boolean(gl);
    if (gl) {
      const info = gl.getExtension("WEBGL_debug_renderer_info");
      const name = gl.getParameter(gl.RENDERER) + " " +
        (info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : "");
      hardware = !/swiftshader|llvmpipe|softpipe|software|basic render/i.test(name);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    }
    postMessage(hardware);`;
  function probeHardware() {
    return new Promise((resolve) => {
      if (!window.Worker || !window.OffscreenCanvas) return resolve(null);
      let worker;
      const url = URL.createObjectURL(
        new Blob([PROBE], { type: "text/javascript" }),
      );
      const done = (answer) => {
        worker?.terminate();
        URL.revokeObjectURL(url);
        resolve(typeof answer === "boolean" ? answer : null);
      };
      try {
        worker = new Worker(url);
      } catch {
        return done(null);
      }
      worker.onmessage = (event) => done(event.data);
      worker.onerror = () => done(null);
      setTimeout(() => done(null), 4000);
    });
  }

  function start(hardware) {
    if (hardware === false) {
      for (const stage of stages)
        stillScene(
          stage,
          stage.querySelector("canvas"),
          JSON.parse(stage.dataset.scenes).filter((entry) => SCENES[entry.key]),
        );
      return;
    }
    const players = stages
      .map((stage) => {
        const canvas = stage.querySelector("canvas");
        const playlist = JSON.parse(stage.dataset.scenes).filter(
          (entry) => SCENES[entry.key],
        );
        let renderer;
        try {
          renderer = new WebGLRenderer(canvas);
        } catch {
          // A canvas that handed out a rejected context keeps its blank frame,
          // so the still scene gets a fresh one.
          const fresh = canvas.cloneNode(false);
          canvas.replaceWith(fresh);
          stillScene(stage, fresh, playlist);
          return null;
        }
        return {
          stage,
          canvas,
          renderer,
          animated: true,
          playlist,
          index: 0,
          anchor: numbers(stage.dataset.anchor) || [0.5, 0.5],
          anchorPortrait: numbers(stage.dataset.anchorPortrait),
          fade: numbers(stage.dataset.fade) || [0, 0],
          images: new Map(), // key -> decoded image
          current: null, // { key, image, idleFrom }
          next: null, // { key, image, rippleFrom }
          dwell: 0,
          visible: false,
          revealFrom: null,
          // The hero only dissolves in on the first visit of a session.
          mayReveal:
            stage.closest(".home-hero") === null ||
            root.dataset.arrive === "true",
        };
      })
      .filter(Boolean);
    if (!players.length) return;

    const motion = () => !reduceMotion.matches;

    function load(player, entry) {
      if (player.images.has(entry.key)) return player.images.get(entry.key);
      const image = new Image();
      image.decoding = "async";
      image.src = entry.src;
      const ready = image.decode().then(() => image);
      player.images.set(entry.key, ready);
      // A failed load is forgotten, so the next attempt fetches it again.
      ready.catch(() => player.images.delete(entry.key));
      return ready;
    }

    function slot(player, entry, now, moving) {
      const config = SCENES[entry.key];
      const idle = entry.idleFrom
        ? smooth(0, 1, (now - entry.idleFrom) / IDLE_IN_MS)
        : entry.rippleFrom !== undefined
          ? 0
          : 1;
      return {
        image: entry.image,
        frame: framing(player, config, entry.image, now / 1000, moving),
        effects: effects(config),
        idle,
      };
    }

    function draw(player, now = performance.now()) {
      if (!player.current || !player.canvas.width) return;
      const moving = motion() && player.animated;
      let reveal = 1;
      // Infinity marks a reveal that waits for the stage to come into view.
      if (player.revealFrom !== null)
        reveal = Math.min(
          1,
          Math.max(0, (now - player.revealFrom) / REVEAL_MS),
        );
      if (reveal >= 1) player.revealFrom = null;
      const ripple = player.next
        ? Math.min(1, (now - player.next.rippleFrom) / RIPPLE_MS)
        : 0;
      player.renderer.draw({
        look: LOOKS[isDark() ? "dark" : "light"],
        cell: player.cell,
        a: slot(player, player.current, now, moving),
        b: player.next ? slot(player, player.next, now, moving) : null,
        ripple: player.next ? smooth(0, 1, ripple) : 0,
        fade: player.fade,
        reveal: 1 - (1 - reveal) ** 3,
        time: now / 1000,
        motion: moving,
      });
    }

    function resize(player) {
      const rect = player.stage.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      player.canvas.width = Math.max(1, Math.round(rect.width * dpr));
      player.canvas.height = Math.max(1, Math.round(rect.height * dpr));
      player.cell = Math.max(2, Math.round(CELL * dpr));
      draw(player);
    }

    function maybeReveal(player) {
      if (!player.current || !player.visible || !player.mayReveal) return;
      player.mayReveal = false;
      if (motion() && player.animated) player.revealFrom = performance.now();
      draw(player);
    }

    // Advances a stage's rotation: count visible time on the current scene,
    // preload the next one, run the ripple, then hand over.
    function advance(player, now, elapsed) {
      if (player.playlist.length < 2 || player.revealFrom !== null) return;
      if (player.next) {
        if (now - player.next.rippleFrom < RIPPLE_MS) return;
        player.current = { ...player.next, idleFrom: now };
        player.next = null;
        player.dwell = 0;
        player.renderer.release([player.current.image]);
        return;
      }
      player.dwell += elapsed;
      const upcoming =
        player.playlist[(player.index + 1) % player.playlist.length];
      // Start fetching the next picture a few seconds ahead.
      if (player.dwell > DWELL_MS - 5000) load(player, upcoming);
      if (player.dwell < DWELL_MS || player.pending) return;
      player.pending = true;
      load(player, upcoming)
        .then((image) => {
          player.pending = false;
          player.renderer.upload(image);
          player.index = (player.index + 1) % player.playlist.length;
          player.next = {
            key: upcoming.key,
            image,
            rippleFrom: performance.now(),
          };
        })
        .catch(() => {
          player.pending = false;
          player.dwell = 0;
        });
    }

    const visibility = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const player = players.find((item) => item.stage === entry.target);
        player.visible = entry.isIntersecting;
        maybeReveal(player);
      }
    });
    const sizes = new ResizeObserver((entries) => {
      for (const entry of entries)
        resize(players.find((item) => item.stage === entry.target));
    });

    for (const player of players) {
      resize(player);
      visibility.observe(player.stage);
      sizes.observe(player.stage);
      const first = player.playlist[0];
      load(player, first)
        .then((image) => {
          player.renderer.upload(image);
          player.current = { key: first.key, image };
          // Until it is seen, a revealing stage stays an empty field.
          if (player.mayReveal && motion() && player.animated)
            player.revealFrom = Infinity;
          maybeReveal(player);
          draw(player);
        })
        .catch(() => {});
    }

    // If the device cannot keep frames coming while a scene animates, the
    // scenes settle on a still frame rather than slow the page down.
    const SLOW_FRAME_MS = 45;
    let frameAverage = 1000 / 60;
    let frameSamples = 0;
    let previous = 0;
    let last = 0;
    function tick(now) {
      requestAnimationFrame(tick);
      const interval = now - previous;
      previous = now;
      if (document.hidden || !motion()) {
        last = now;
        return;
      }
      const active = players.filter(
        (player) => player.visible && player.animated && player.current,
      );
      if (active.length && interval < 1000) {
        frameAverage += (interval - frameAverage) * 0.1;
        frameSamples += 1;
        if (frameSamples > 30 && frameAverage > SLOW_FRAME_MS) {
          for (const player of players) {
            player.animated = false;
            player.revealFrom = null;
            player.next = null;
            draw(player, now);
          }
          return;
        }
      }
      const busy = active.some(
        (player) =>
          (player.revealFrom !== null && player.revealFrom <= now) ||
          player.next,
      );
      if (!busy && now - last < 1000 / FPS) return;
      const elapsed = Math.min(now - last, 250);
      last = now;
      for (const player of active) {
        advance(player, now, elapsed);
        draw(player, now);
      }
    }
    requestAnimationFrame(tick);

    const redraw = () => players.forEach((player) => draw(player));
    document.addEventListener("portfolio:themechange", redraw);
    systemDark.addEventListener("change", redraw);
    reduceMotion.addEventListener("change", redraw);
  }

  probeHardware().then(start);
})();
