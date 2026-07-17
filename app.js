const CANVAS = document.getElementById('canvas');
const CTX = CANVAS.getContext('2d');

const LIMITS = {
  particles: { min: 100, max: 5000, step: 100 },
  gravity: { min: -0.5, max: 1.5, step: 0.05 },
  startSize: { min: 0.5, max: 3, step: 0.1 },
  life: { min: 30, max: 300, step: 10 },
  speed: { min: 1, max: 15, step: 0.5 },
  emitterRadius: { min: 0, max: 150, step: 5 },
  dispersion: { min: 0, max: 360, step: 10 },
  trailLength: { min: 0, max: 8, step: 0.2 },
  angleStep: 5,
  offscreenMargin: 150,
  emitterHintIdleMs: 1200,
  rocketSpawnInterval: 60,
  autoPaletteInterval: 32
};

const STATE = {
  activeParticlesCount: 1000,
  maxParticlesPool: 6000,
  gravity: 0.15,
  angle: 90,
  manualAngle: 90,
  lifespan: 120,
  speed: 5,
  startSize: 1,
  paletteIndex: 0,
  presetIndex: 1,
  paused: false,
  panelVisible: true,
  hintsVisible: true,
  onlyClick: true,
  bounce: true,
  emitterRadius: 0,
  dispersion: 360,
  trailLength: 2.0,
  autoPalette: false,
  autoPaletteTick: 0
};

const PALETTES = [
  {
    name: 'Oro',
    colors: [
      { h: 30, s: 100, l: 50 },
      { h: 45, s: 100, l: 60 },
      { h: 60, s: 100, l: 75 },
      { h: 60, s: 100, l: 95 }
    ],
    accent: '#ff8800'
  },
  {
    name: 'Océano',
    colors: [
      { h: 220, s: 100, l: 40 },
      { h: 200, s: 100, l: 55 },
      { h: 180, s: 100, l: 60 },
      { h: 160, s: 100, l: 70 }
    ],
    accent: '#00c3ff'
  },
  {
    name: 'Lava',
    colors: [
      { h: 0, s: 100, l: 45 },
      { h: 15, s: 100, l: 50 },
      { h: 35, s: 100, l: 60 },
      { h: 50, s: 100, l: 70 }
    ],
    accent: '#ff3700'
  },
  {
    name: 'Matriz',
    colors: [
      { h: 120, s: 100, l: 40 },
      { h: 145, s: 100, l: 50 },
      { h: 170, s: 100, l: 60 },
      { h: 180, s: 100, l: 75 }
    ],
    accent: '#00ff77'
  },
  {
    name: 'Fantasía',
    colors: [
      { h: 0, s: 100, l: 60 },
      { h: 72, s: 100, l: 60 },
      { h: 144, s: 100, l: 60 },
      { h: 216, s: 100, l: 60 },
      { h: 288, s: 100, l: 60 }
    ],
    accent: '#ff00aa'
  }
];

const PRESET_DEFAULTS = {
  1: { gravity: 0.15, angle: 90, speed: 5, lifespan: 120, dispersion: 360, emitter: 'center' },
  2: { gravity: 0.08, angle: 90, speed: 4, lifespan: 100, dispersion: 360, emitter: 'center' },
  3: { gravity: 0.25, angle: 90, speed: 8, lifespan: 160, dispersion: 40, emitter: 'bottomOffset' },
  4: { gravity: 0.2, angle: 90, speed: 7, lifespan: 140, dispersion: 70, emitter: 'bottomEdge' },
  5: { gravity: 0.12, angle: 90, speed: 4.5, lifespan: 130, dispersion: 360, emitter: 'center', autoRotateGravity: true },
  6: { gravity: 0.2, angle: 90, speed: 6.5, lifespan: 150, dispersion: 360, emitter: 'center', centerGravity: true }
};

const EMITTER = {
  x: window.innerWidth / 2,
  y: window.innerHeight / 2,
  isDragging: false,
  pointerActive: false,
  pointerDown: false,
  fireworksTimer: 0,
  visibleUntil: 0
};

let width = window.innerWidth;
let height = window.innerHeight;
const ELASTICITY = 0.72;

class Particle {
  constructor(index) {
    this.index = index;
    this.reset();
  }

  reset() {
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.life = 0;
    this.maxLife = 0;
    this.size = 0;
    this.hue = 0;
    this.saturation = 100;
    this.lightness = 50;
    this.active = false;
  }

  spawn(config) {
    const palette = PALETTES[STATE.paletteIndex];
    const color = palette.colors[Math.floor(Math.random() * palette.colors.length)];

    this.x = config.x;
    this.y = config.y;
    this.vx = config.vx;
    this.vy = config.vy;
    this.maxLife = config.life;
    this.life = config.life;
    this.size = config.size;
    this.hue = STATE.paletteIndex === 4 ? Math.random() * 360 : color.h + (Math.random() * 20 - 10);
    this.saturation = color.s;
    this.lightness = color.l + (Math.random() * 16 - 8);
    this.active = true;
  }

  deactivate() {
    this.active = false;
  }

  update(gx, gy) {
    if (STATE.presetIndex === 6) {
      const dx = width * 0.5 - this.x;
      const dy = height * 0.5 - this.y;
      const distance = Math.max(20, Math.hypot(dx, dy));
      const pull = STATE.gravity * (1.4 - Math.min(distance / Math.max(width, height), 0.85));

      this.vx += (dx / distance) * pull;
      this.vy += (dy / distance) * pull;
    } else {
      this.vx += gx;
      this.vy += gy;
    }

    this.vx *= 0.985;
    this.vy *= 0.985;

    this.x += this.vx;
    this.y += this.vy;

    this.life -= 1;
    if (this.life <= 0) {
      return false;
    }

    const outOfBounds = (
      this.x < -LIMITS.offscreenMargin ||
      this.x > width + LIMITS.offscreenMargin ||
      this.y < -LIMITS.offscreenMargin ||
      this.y > height + LIMITS.offscreenMargin
    );
    if (outOfBounds) {
      return false;
    }

    if (STATE.bounce) {
      if (this.x < this.size) {
        this.x = this.size;
        this.vx = -this.vx * ELASTICITY;
      } else if (this.x > width - this.size) {
        this.x = width - this.size;
        this.vx = -this.vx * ELASTICITY;
      }

      if (this.y < this.size) {
        this.y = this.size;
        this.vy = -this.vy * ELASTICITY;
      } else if (this.y > height - this.size) {
        this.y = height - this.size;
        this.vy = -this.vy * ELASTICITY;
      }
    }

    return true;
  }

  draw() {
    const ageRatio = this.life / this.maxLife;
    const opacity = ageRatio;
    const color = `hsla(${this.hue}, ${this.saturation}%, ${this.lightness}%, ${opacity})`;

    if (STATE.trailLength === 0) {
      CTX.beginPath();
      CTX.arc(this.x, this.y, (this.size * ageRatio) / 2, 0, Math.PI * 2);
      CTX.fillStyle = color;
      CTX.fill();
      return;
    }

    const px = this.x - this.vx * STATE.trailLength;
    const py = this.y - this.vy * STATE.trailLength;

    CTX.beginPath();
    CTX.moveTo(px, py);
    CTX.lineTo(this.x, this.y);
    CTX.strokeStyle = color;
    CTX.lineWidth = this.size * ageRatio;
    CTX.lineCap = 'round';
    CTX.stroke();
  }
}

class ParticleSystem {
  constructor(maxParticles) {
    this.pool = Array.from({ length: maxParticles }, (_, index) => new Particle(index));
    this.activeIndices = [];
    this.freeIndices = Array.from({ length: maxParticles }, (_, index) => maxParticles - index - 1);
  }

  spawn(config) {
    const nextIndex = this.freeIndices.pop();
    if (nextIndex === undefined) {
      return false;
    }

    const particle = this.pool[nextIndex];
    particle.spawn(config);
    this.activeIndices.push(nextIndex);
    return true;
  }

  update(gx, gy) {
    for (let i = this.activeIndices.length - 1; i >= 0; i -= 1) {
      const particleIndex = this.activeIndices[i];
      const particle = this.pool[particleIndex];

      if (particle.update(gx, gy)) {
        continue;
      }

      particle.deactivate();
      this.freeIndices.push(particleIndex);
      this.activeIndices[i] = this.activeIndices[this.activeIndices.length - 1];
      this.activeIndices.pop();
    }
  }

  draw() {
    for (let i = 0; i < this.activeIndices.length; i += 1) {
      this.pool[this.activeIndices[i]].draw();
    }
  }

  clear() {
    while (this.activeIndices.length > 0) {
      const particleIndex = this.activeIndices.pop();
      const particle = this.pool[particleIndex];
      particle.deactivate();
      this.freeIndices.push(particleIndex);
    }
  }
}

const PARTICLES = new ParticleSystem(STATE.maxParticlesPool);
let automaticFireworks = [];
let stormAngle = 0;

const UI = {
  controlPanel: document.getElementById('controlPanel'),
  keyboardHints: document.getElementById('keyboardHints'),
  togglePanelBtn: document.getElementById('togglePanelBtn'),
  toggleHintsBtn: document.getElementById('toggleHintsBtn'),
  toggleAutoPaletteBtn: document.getElementById('toggleAutoPaletteBtn'),
  presetButtons: document.querySelectorAll('.btn-preset[data-preset]'),
  colorOptions: document.querySelectorAll('.color-option'),
  toggles: {
    onlyClick: document.getElementById('toggleOnlyClick'),
    bounce: document.getElementById('toggleBounce')
  },
  sliders: {
    particles: { el: document.getElementById('sliderParticles'), val: document.getElementById('valParticles'), format: (value) => `${value}` },
    gravity: { el: document.getElementById('sliderGravity'), val: document.getElementById('valGravity'), format: (value) => `${value}` },
    angle: { el: document.getElementById('sliderAngle'), val: document.getElementById('valAngle'), format: (value) => `${value}°` },
    life: { el: document.getElementById('sliderLife'), val: document.getElementById('valLife'), format: (value) => `${value}` },
    speed: { el: document.getElementById('sliderSpeed'), val: document.getElementById('valSpeed'), format: (value) => `${value}` },
    startSize: { el: document.getElementById('sliderStartSize'), val: document.getElementById('valStartSize'), format: (value) => `${Number.parseFloat(value).toFixed(1)}x` },
    emitterRadius: { el: document.getElementById('sliderEmitterRadius'), val: document.getElementById('valEmitterRadius'), format: (value) => `${value}px` },
    dispersion: { el: document.getElementById('sliderDispersion'), val: document.getElementById('valDispersion'), format: (value) => `${value}°` },
    trailLength: { el: document.getElementById('sliderTrailLength'), val: document.getElementById('valTrailLength'), format: (value) => Number.parseFloat(value).toFixed(1) }
  }
};

const sliderBindings = {
  particles: {
    get: () => STATE.activeParticlesCount,
    set: (value) => { STATE.activeParticlesCount = Number.parseInt(value, 10); }
  },
  gravity: {
    get: () => STATE.gravity,
    set: (value) => { STATE.gravity = Number.parseFloat(value); }
  },
  angle: {
    get: () => STATE.angle,
    set: (value) => {
      const angle = Number.parseInt(value, 10);
      STATE.manualAngle = angle;
      STATE.angle = angle;
    }
  },
  life: {
    get: () => STATE.lifespan,
    set: (value) => { STATE.lifespan = Number.parseInt(value, 10); }
  },
  speed: {
    get: () => STATE.speed,
    set: (value) => { STATE.speed = Number.parseFloat(value); }
  },
  startSize: {
    get: () => STATE.startSize,
    set: (value) => { STATE.startSize = Number.parseFloat(value); }
  },
  emitterRadius: {
    get: () => STATE.emitterRadius,
    set: (value) => { STATE.emitterRadius = Number.parseInt(value, 10); }
  },
  dispersion: {
    get: () => STATE.dispersion,
    set: (value) => { STATE.dispersion = Number.parseInt(value, 10); }
  },
  trailLength: {
    get: () => STATE.trailLength,
    set: (value) => { STATE.trailLength = Number.parseFloat(value); }
  }
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function markEmitterVisible(duration = LIMITS.emitterHintIdleMs) {
  EMITTER.visibleUntil = performance.now() + duration;
}

function getSpawnCoords(baseX, baseY) {
  if (STATE.emitterRadius <= 0) {
    return { x: baseX, y: baseY };
  }

  const angle = Math.random() * Math.PI * 2;
  const radius = Math.sqrt(Math.random()) * STATE.emitterRadius;
  return {
    x: baseX + Math.cos(angle) * radius,
    y: baseY + Math.sin(angle) * radius
  };
}

function emitParticle(x, y, vx, vy, life, size) {
  PARTICLES.spawn({ x, y, vx, vy, life, size });
}

function scaleParticleSize(size) {
  return Math.max(0.2, size * STATE.startSize);
}

function getGravityVector() {
  if (STATE.presetIndex === 6) {
    return {
      gx: 0,
      gy: 0
    };
  }

  const radians = (STATE.angle * Math.PI) / 180;
  return {
    gx: Math.cos(radians) * STATE.gravity,
    gy: Math.sin(radians) * STATE.gravity
  };
}

function shouldEmitParticles() {
  return !STATE.onlyClick || EMITTER.pointerDown || EMITTER.isDragging;
}

function setEmitterPosition(mode) {
  if (EMITTER.isDragging || EMITTER.pointerActive) {
    return;
  }

  if (mode === 'bottomOffset') {
    EMITTER.x = width / 2;
    EMITTER.y = height - 100;
    return;
  }

  if (mode === 'bottomEdge') {
    EMITTER.x = width / 2;
    EMITTER.y = height - 20;
    return;
  }

  EMITTER.x = width / 2;
  EMITTER.y = height / 2;
}

function spawnDirectionalBurst(rate, baseAngle, spreadRad, speedRange, sizeRange, lifeRange, verticalBias = 0) {
  for (let i = 0; i < rate; i += 1) {
    const angle = STATE.dispersion === 360
      ? Math.random() * Math.PI * 2
      : baseAngle + (Math.random() - 0.5) * spreadRad;
    const speed = (speedRange.min + Math.random() * (speedRange.max - speedRange.min)) * STATE.speed;
    const coords = getSpawnCoords(EMITTER.x, EMITTER.y);
    emitParticle(
      coords.x,
      coords.y,
      Math.cos(angle) * speed,
      Math.sin(angle) * speed + verticalBias,
      STATE.lifespan * (lifeRange.min + Math.random() * (lifeRange.max - lifeRange.min)),
      scaleParticleSize(sizeRange.min + Math.random() * (sizeRange.max - sizeRange.min))
    );
  }
}

function spawnSparks() {
  const rate = Math.min(25, Math.ceil(STATE.activeParticlesCount / 80));
  const spreadRad = (STATE.dispersion * Math.PI) / 180;
  const baseAngle = ((STATE.angle + 180) % 360) * Math.PI / 180;
  spawnDirectionalBurst(rate, baseAngle, spreadRad, { min: 0.2, max: 1.0 }, { min: 1.5, max: 4.0 }, { min: 0.6, max: 1.2 }, -1);
}

function launchAutomaticRocket() {
  const startX = Math.random() * width;
  const startY = height;
  const targetX = Math.random() * (width - 200) + 100;

  automaticFireworks.push({
    x: startX,
    y: startY,
    vx: (targetX - startX) / 80,
    vy: -12 - Math.random() * 5,
    fuse: 70 + Math.random() * 20,
    active: true
  });
}

function spawnFireworks() {
  EMITTER.fireworksTimer += 1;
  if (!STATE.onlyClick && EMITTER.fireworksTimer % LIMITS.rocketSpawnInterval === 0) {
    launchAutomaticRocket();
  }

  for (let i = automaticFireworks.length - 1; i >= 0; i -= 1) {
    const rocket = automaticFireworks[i];
    rocket.x += rocket.vx;
    rocket.y += rocket.vy;
    rocket.vy += 0.15;
    rocket.fuse -= 1;

    emitParticle(rocket.x, rocket.y, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, 20, scaleParticleSize(2));

    if (rocket.fuse <= 0 || rocket.y < 50) {
      explodeFirework(rocket.x, rocket.y);
      automaticFireworks.splice(i, 1);
    }
  }
}

function explodeFirework(x, y) {
  const particleCount = Math.min(180, Math.ceil(STATE.activeParticlesCount / 6));
  for (let i = 0; i < particleCount; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = (1 + Math.random() * 2.5) * STATE.speed;
    emitParticle(
      x,
      y,
      Math.cos(angle) * speed,
      Math.sin(angle) * speed,
      STATE.lifespan * (0.5 + Math.random() * 0.5),
      scaleParticleSize(1.2 + Math.random() * 2)
    );
  }
}

function spawnWaterfall() {
  const rate = Math.min(30, Math.ceil(STATE.activeParticlesCount / 60));
  const spreadRad = (STATE.dispersion * Math.PI) / 180;
  spawnDirectionalBurst(rate, -Math.PI / 2, spreadRad, { min: 1.2, max: 1.8 }, { min: 2, max: 5 }, { min: 0.8, max: 1.2 });
}

function spawnVolcano() {
  setEmitterPosition('bottomEdge');
  const rate = Math.min(25, Math.ceil(STATE.activeParticlesCount / 85));
  const spreadRad = (STATE.dispersion * Math.PI) / 180;
  spawnDirectionalBurst(rate, -Math.PI / 2, spreadRad, { min: 0.8, max: 1.4 }, { min: 2, max: 6 }, { min: 0.7, max: 1.3 });
}

function updateStormForces() {
  stormAngle += 0.03;
  if (!EMITTER.isDragging && !EMITTER.pointerActive) {
    EMITTER.x = width / 2 + Math.cos(stormAngle) * (width * 0.2);
    EMITTER.y = height / 2 + Math.sin(stormAngle * 1.5) * (height * 0.2);
  }

  STATE.angle = (STATE.manualAngle + stormAngle * 57.2958) % 360;
  if (STATE.angle < 0) {
    STATE.angle += 360;
  }
  syncSlider('angle');
}

function spawnStorm() {
  updateStormForces();
  const rate = Math.min(20, Math.ceil(STATE.activeParticlesCount / 100));
  const spreadRad = (STATE.dispersion * Math.PI) / 180;
  const baseAngle = ((STATE.angle + 180) % 360) * Math.PI / 180;
  spawnDirectionalBurst(rate, baseAngle, spreadRad, { min: 0.2, max: 1.0 }, { min: 1.5, max: 4 }, { min: 0.8, max: 1.3 });
}

function spawnWarp() {
  const rate = Math.min(28, Math.ceil(STATE.activeParticlesCount / 75));
  const spreadRad = (STATE.dispersion * Math.PI) / 180;
  const angleToCenter = Math.atan2((height * 0.5) - EMITTER.y, (width * 0.5) - EMITTER.x);

  for (let i = 0; i < rate; i += 1) {
    const angle = STATE.dispersion === 360
      ? Math.random() * Math.PI * 2
      : angleToCenter + (Math.random() - 0.5) * spreadRad;
    const speed = (0.6 + Math.random() * 1.2) * STATE.speed;
    const coords = getSpawnCoords(EMITTER.x, EMITTER.y);
    emitParticle(
      coords.x,
      coords.y,
      Math.cos(angle) * speed,
      Math.sin(angle) * speed,
      STATE.lifespan * (0.8 + Math.random() * 0.45),
      scaleParticleSize(1.4 + Math.random() * 2.8)
    );
  }
}

const PRESET_BEHAVIORS = {
  1: spawnSparks,
  2: spawnFireworks,
  3: spawnWaterfall,
  4: spawnVolcano,
  5: spawnStorm,
  6: spawnWarp
};

function applyPresetDefaults(presetNum) {
  const preset = PRESET_DEFAULTS[presetNum];
  if (!preset) {
    return;
  }

  STATE.gravity = preset.gravity;
  STATE.angle = preset.angle;
  STATE.manualAngle = preset.angle;
  STATE.speed = preset.speed;
  STATE.lifespan = preset.lifespan;
  STATE.dispersion = preset.dispersion;
  setEmitterPosition(preset.emitter);

  if (presetNum !== 5) {
    stormAngle = 0;
  }
}

function renderBackground() {
  CTX.fillStyle = '#000000';
  CTX.fillRect(0, 0, width, height);
}

function shouldShowEmitter() {
  return EMITTER.isDragging || EMITTER.pointerActive || performance.now() < EMITTER.visibleUntil;
}

function renderEmitter() {
  if (!shouldShowEmitter()) {
    return;
  }

  const accent = PALETTES[STATE.paletteIndex].accent;
  CTX.beginPath();
  CTX.arc(EMITTER.x, EMITTER.y, 4, 0, Math.PI * 2);
  CTX.fillStyle = accent;
  CTX.shadowBlur = 10;
  CTX.shadowColor = accent;
  CTX.fill();
  CTX.shadowBlur = 0;
}

function updateSimulation() {
  if (STATE.paused) {
    return;
  }

  if (STATE.autoPalette) {
    STATE.autoPaletteTick += 1;
    if (STATE.autoPaletteTick >= LIMITS.autoPaletteInterval) {
      randomizePalette();
      STATE.autoPaletteTick = 0;
    }
  }

  if (STATE.presetIndex === 4) {
    setEmitterPosition('bottomEdge');
  } else if (STATE.presetIndex === 3) {
    setEmitterPosition('bottomOffset');
  } else if (STATE.presetIndex !== 5) {
    setEmitterPosition(PRESET_DEFAULTS[STATE.presetIndex]?.emitter || 'center');
  }

  if (shouldEmitParticles()) {
    const presetHandler = PRESET_BEHAVIORS[STATE.presetIndex];
    if (presetHandler) {
      presetHandler();
    }
  } else if (STATE.presetIndex === 5) {
    updateStormForces();
  }

  const { gx, gy } = getGravityVector();
  PARTICLES.update(gx, gy);
}

function renderSimulation() {
  renderBackground();
  CTX.globalCompositeOperation = 'lighter';
  PARTICLES.draw();
  CTX.globalCompositeOperation = 'source-over';
  renderEmitter();
}

function frame() {
  updateSimulation();
  renderSimulation();
  requestAnimationFrame(frame);
}

function resize() {
  width = window.innerWidth;
  height = window.innerHeight;
  CANVAS.width = width;
  CANVAS.height = height;
  setEmitterPosition(PRESET_DEFAULTS[STATE.presetIndex]?.emitter || 'center');
}

function getPointerCoords(event) {
  if (event.touches && event.touches[0]) {
    return {
      x: event.touches[0].clientX,
      y: event.touches[0].clientY
    };
  }

  if (event.clientX === undefined || event.clientY === undefined) {
    return null;
  }

  return {
    x: event.clientX,
    y: event.clientY
  };
}

function handlePointerDown(event) {
  const pointer = getPointerCoords(event);
  if (!pointer) {
    return;
  }

  if (event.button !== undefined && event.button !== 0) {
    return;
  }

  EMITTER.x = pointer.x;
  EMITTER.y = pointer.y;
  EMITTER.isDragging = true;
  EMITTER.pointerActive = true;
  EMITTER.pointerDown = true;
  markEmitterVisible();

  if (STATE.presetIndex === 2) {
    explodeFirework(pointer.x, pointer.y);
  }
}

function handlePointerMove(event) {
  if (!EMITTER.pointerDown && !EMITTER.isDragging) {
    return;
  }

  const pointer = getPointerCoords(event);
  if (!pointer) {
    return;
  }

  EMITTER.x = pointer.x;
  EMITTER.y = pointer.y;
  EMITTER.isDragging = true;
  markEmitterVisible();
}

function handlePointerUp() {
  EMITTER.isDragging = false;
  EMITTER.pointerActive = false;
  EMITTER.pointerDown = false;
  EMITTER.visibleUntil = 0;
}

function formatSliderValue(key, value) {
  return UI.sliders[key].format(value);
}

function syncSlider(key) {
  const binding = sliderBindings[key];
  if (!binding) {
    return;
  }

  const value = binding.get();
  UI.sliders[key].el.value = value;
  UI.sliders[key].val.innerText = formatSliderValue(key, value);
}

function syncAllSliders() {
  Object.keys(UI.sliders).forEach(syncSlider);
}

function changePalette(index) {
  STATE.paletteIndex = index;
  STATE.autoPaletteTick = 0;
  UI.colorOptions.forEach((option) => {
    option.classList.toggle('active', Number.parseInt(option.dataset.palette, 10) === index);
  });

  document.documentElement.style.setProperty('--accent-color', PALETTES[index].accent);
  document.documentElement.style.setProperty('--accent-glow', `${PALETTES[index].accent}55`);
}

function randomizePalette() {
  let nextIndex = STATE.paletteIndex;
  while (nextIndex === STATE.paletteIndex && PALETTES.length > 1) {
    nextIndex = Math.floor(Math.random() * PALETTES.length);
  }
  changePalette(nextIndex);
}

function changePreset(presetNum) {
  STATE.presetIndex = presetNum;
  automaticFireworks = [];
  UI.presetButtons.forEach((button) => {
    button.classList.toggle('active', Number.parseInt(button.dataset.preset, 10) === presetNum);
  });

  applyPresetDefaults(presetNum);
  syncAllSliders();
  markEmitterVisible(500);
}

function togglePanel() {
  STATE.panelVisible = !STATE.panelVisible;
  UI.controlPanel.classList.toggle('hidden', !STATE.panelVisible);
  UI.togglePanelBtn.classList.toggle('active', STATE.panelVisible);
}

function syncHintsButton() {
  UI.toggleHintsBtn.innerHTML = `${STATE.hintsVisible ? 'Ocultar atajos' : 'Mostrar atajos'} <span class="kbd-hint">M</span>`;
}

function toggleHints() {
  STATE.hintsVisible = !STATE.hintsVisible;
  UI.keyboardHints.classList.toggle('hidden', !STATE.hintsVisible);
  syncHintsButton();
}

function syncAutoPaletteButton() {
  UI.toggleAutoPaletteBtn.classList.toggle('active', STATE.autoPalette);
  UI.toggleAutoPaletteBtn.innerHTML = `Colores auto: ${STATE.autoPalette ? 'On' : 'Off'} <span class="kbd-hint">V</span>`;
}

function toggleAutoPalette() {
  STATE.autoPalette = !STATE.autoPalette;
  STATE.autoPaletteTick = 0;
  if (STATE.autoPalette) {
    randomizePalette();
  }
  syncAutoPaletteButton();
}

function bindSliders() {
  Object.entries(UI.sliders).forEach(([key, slider]) => {
    slider.el.addEventListener('input', (event) => {
      sliderBindings[key].set(event.target.value);
      syncSlider(key);
    });
    syncSlider(key);
  });
}

function bindPresets() {
  UI.presetButtons.forEach((button) => {
    button.addEventListener('click', () => {
      changePreset(Number.parseInt(button.dataset.preset, 10));
    });
  });
}

function bindPalettePicker() {
  UI.colorOptions.forEach((option) => {
    option.addEventListener('click', () => {
      STATE.autoPalette = false;
      changePalette(Number.parseInt(option.dataset.palette, 10));
      syncAutoPaletteButton();
    });
  });
}

function bindToggles() {
  UI.toggles.onlyClick.checked = STATE.onlyClick;
  UI.toggles.bounce.checked = STATE.bounce;

  UI.toggles.onlyClick.addEventListener('change', (event) => {
    STATE.onlyClick = event.target.checked;
    markEmitterVisible(500);
  });

  UI.toggles.bounce.addEventListener('change', (event) => {
    STATE.bounce = event.target.checked;
  });
}

function cyclePalette() {
  STATE.autoPalette = false;
  changePalette((STATE.paletteIndex + 1) % PALETTES.length);
  syncAutoPaletteButton();
}

function adjustParticleCount(delta) {
  STATE.activeParticlesCount = clamp(
    STATE.activeParticlesCount + delta,
    LIMITS.particles.min,
    LIMITS.particles.max
  );
  syncSlider('particles');
}

function adjustGravity(delta) {
  STATE.gravity = clamp(
    Number.parseFloat((STATE.gravity + delta).toFixed(2)),
    LIMITS.gravity.min,
    LIMITS.gravity.max
  );
  syncSlider('gravity');
}

function adjustManualAngle(delta) {
  STATE.manualAngle = (STATE.manualAngle + delta + 360) % 360;
  STATE.angle = STATE.manualAngle;
  syncSlider('angle');
}

function adjustSliderValue(key, delta, decimals = 0) {
  const binding = sliderBindings[key];
  const limits = LIMITS[key];
  if (!binding || !limits) {
    return;
  }

  const current = Number(binding.get());
  const next = clamp(current + delta, limits.min, limits.max);
  const value = decimals > 0 ? next.toFixed(decimals) : `${Math.round(next)}`;
  binding.set(value);
  syncSlider(key);
}

function bindKeyboard() {
  window.addEventListener('keydown', (event) => {
    switch (event.key.toLowerCase()) {
      case 'h':
        togglePanel();
        break;
      case ' ':
        event.preventDefault();
        STATE.paused = !STATE.paused;
        break;
      case 'm':
        toggleHints();
        break;
      case 'arrowup':
        event.preventDefault();
        adjustParticleCount(LIMITS.particles.step);
        break;
      case 'arrowdown':
        event.preventDefault();
        adjustParticleCount(-LIMITS.particles.step);
        break;
      case 'arrowleft':
        event.preventDefault();
        adjustManualAngle(-LIMITS.angleStep);
        break;
      case 'arrowright':
        event.preventDefault();
        adjustManualAngle(LIMITS.angleStep);
        break;
      case 'g':
        adjustGravity(event.shiftKey ? -LIMITS.gravity.step : LIMITS.gravity.step);
        break;
      case 'q':
        adjustSliderValue('life', LIMITS.life.step);
        break;
      case 'a':
        adjustSliderValue('life', -LIMITS.life.step);
        break;
      case 'w':
        adjustSliderValue('speed', LIMITS.speed.step, 1);
        break;
      case 's':
        adjustSliderValue('speed', -LIMITS.speed.step, 1);
        break;
      case 'e':
        adjustSliderValue('startSize', LIMITS.startSize.step, 1);
        break;
      case 'd':
        adjustSliderValue('startSize', -LIMITS.startSize.step, 1);
        break;
      case 'r':
        adjustSliderValue('emitterRadius', LIMITS.emitterRadius.step);
        break;
      case 'f':
        adjustSliderValue('emitterRadius', -LIMITS.emitterRadius.step);
        break;
      case 't':
        adjustSliderValue('dispersion', LIMITS.dispersion.step);
        break;
      case 'y':
        adjustSliderValue('dispersion', -LIMITS.dispersion.step);
        break;
      case 'u':
        adjustSliderValue('trailLength', LIMITS.trailLength.step, 1);
        break;
      case 'j':
        adjustSliderValue('trailLength', -LIMITS.trailLength.step, 1);
        break;
      case 'c':
        cyclePalette();
        break;
      case 'v':
        toggleAutoPalette();
        break;
      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
      case '6':
        changePreset(Number.parseInt(event.key, 10));
        break;
    }
  });
}

function bindPointerEvents() {
  CANVAS.addEventListener('pointerdown', handlePointerDown);
  window.addEventListener('pointermove', handlePointerMove);
  window.addEventListener('pointerup', handlePointerUp);
  window.addEventListener('pointercancel', handlePointerUp);
  window.addEventListener('blur', handlePointerUp);
}

function bindUI() {
  UI.togglePanelBtn.addEventListener('click', togglePanel);
  UI.toggleHintsBtn.addEventListener('click', toggleHints);
  UI.toggleAutoPaletteBtn.addEventListener('click', toggleAutoPalette);
  bindSliders();
  bindPresets();
  bindPalettePicker();
  bindToggles();
  bindKeyboard();
  bindPointerEvents();
}

function init() {
  resize();
  bindUI();
  changePalette(STATE.paletteIndex);
  changePreset(1);
  syncAutoPaletteButton();
  syncHintsButton();
  window.addEventListener('resize', resize);
  frame();
}

init();
