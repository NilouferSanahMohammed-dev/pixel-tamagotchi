/**
 * pixel-tamagotchi
 * ----------------
 * A tiny virtual pet that lives entirely in the browser. No backend,
 * no build step — state is saved to localStorage so your pet survives
 * a page refresh (but not a different browser or device).
 *
 * Stats decay slowly over real time. Feed, play, and put your pet to
 * sleep to keep it happy. Let it go too long and it'll let you know.
 */

const STORAGE_KEY = "pixel-tamagotchi-save-v1";
const TICK_MS = 1000;
const DECAY_PER_TICK = 0.06; // stat points lost per second, per stat
const EVOLUTION_HOURS = [0, 0.02, 0.06]; // kit -> bunny -> rabbit (hours of care)

const canvas = document.getElementById("screen");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

const CELL = 8; // px per pixel-art cell (canvas is 128x112 -> 16x14 grid)

const PALETTE = {
  ".": null,
  "k": "#33422a",
  "w": "#fdf6ec",
  "p": "#f2a9c8",
  "d": "#8b6fb5",
  "s": "#e8e0f5",
  "e": "#2b2b2b",
  "g": "#cfc6e0",
};

/* ---------------- Sprites (16 wide x 14 tall grids) ---------------- */

const SPRITES = {
  kit: [
    "................",
    "................",
    "................",
    "......ww.ww.....",
    ".....wwwwwww....",
    "....wwwwwwwww...",
    "....wwgw.gwww...",
    "....wwwwpwww....",
    ".....wwwwwww....",
    "......wwwww.....",
    "................",
    "................",
    "................",
    "................",
  ],
  bunny: [
    "................",
    ".....ww..ww.....",
    ".....ww..ww.....",
    ".....ww..ww.....",
    "....wwwwwwww....",
    "...wwwwwwwwww...",
    "...wgewwwewgw...",
    "...wwwwpwwwww...",
    "...wwwwwwwwww...",
    "....wwwwwwww....",
    ".....w....w.....",
    ".....w....w.....",
    "................",
    "................",
  ],
  bunny_blink: [
    "................",
    ".....ww..ww.....",
    ".....ww..ww.....",
    ".....ww..ww.....",
    "....wwwwwwww....",
    "...wwwwwwwwww...",
    "...wg....gwgw...",
    "...wwwwpwwwww...",
    "...wwwwwwwwww...",
    "....wwwwwwww....",
    ".....w....w.....",
    ".....w....w.....",
    "................",
    "................",
  ],
  rabbit: [
    "....ww....ww....",
    "....ww....ww....",
    "....wp....pw....",
    "....ww....ww....",
    "...wwwwwwwwww...",
    "..wwwwwwwwwwww..",
    "..wgewww.wewgw..",
    "..wwwwwwpwwwww..",
    "..wwwwwwwwwwww..",
    "...wwwwwwwwww...",
    "....ww....ww....",
    "....ww....ww....",
    ".....w.ww.w.....",
    "......www.......",
  ],
  sleeping: [
    "................",
    "................",
    "....ww....ww....",
    "...wwww..wwww...",
    "..wwwwwwwwwwww..",
    "..wwwwwwwwwwww..",
    "..wg.wwwwwg.w...",
    "..wwwwwwpwwwww..",
    "...wwwwwwwwww...",
    "....wwwwwwww....",
    "................",
    "........z.......",
    ".........z......",
    "................",
  ],
};

function drawSprite(gridName) {
  const grid = SPRITES[gridName] || SPRITES.kit;
  ctx.fillStyle = "#b9d191";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row].length; col++) {
      const ch = grid[row][col];
      const color = PALETTE[ch];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(col * CELL, row * CELL, CELL, CELL);
    }
  }
}

/* ---------------- State ---------------- */

function defaultState() {
  return {
    hunger: 80,
    joy: 80,
    energy: 80,
    careHours: 0,
    stage: "kit",
    sleeping: false,
    bornAt: Date.now(),
    lastTick: Date.now(),
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    return { ...defaultState(), ...parsed };
  } catch {
    return defaultState();
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

let state = loadState();
let blinkOn = false;

/* ---------------- Evolution ---------------- */

function stageForCareHours(hours) {
  if (hours >= EVOLUTION_HOURS[2]) return "rabbit";
  if (hours >= EVOLUTION_HOURS[1]) return "bunny";
  return "kit";
}

/* ---------------- Rendering ---------------- */

const hungerFill = document.getElementById("hungerFill");
const joyFill = document.getElementById("joyFill");
const energyFill = document.getElementById("energyFill");
const nameplate = document.getElementById("nameplate");
const hint = document.getElementById("hint");

function clamp(n) {
  return Math.max(0, Math.min(100, n));
}

function currentSprite() {
  if (state.sleeping) return "sleeping";
  if (state.stage === "kit") return "kit";
  if (state.stage === "bunny") return blinkOn ? "bunny_blink" : "bunny";
  return state.stage; // rabbit
}

function render() {
  drawSprite(currentSprite());

  hungerFill.style.width = `${clamp(state.hunger)}%`;
  joyFill.style.width = `${clamp(state.joy)}%`;
  energyFill.style.width = `${clamp(state.energy)}%`;

  const dayNum = Math.max(1, Math.floor((Date.now() - state.bornAt) / (1000 * 60 * 60 * 24)) + 1);
  nameplate.textContent = `${state.stage} · day ${dayNum}`;

  if (state.sleeping) {
    hint.textContent = "shh, sleeping — wake it by clicking sleep again";
  } else if (state.hunger < 25) {
    hint.textContent = "getting hungry — try feeding it";
  } else if (state.joy < 25) {
    hint.textContent = "a little bored — maybe play?";
  } else if (state.energy < 20) {
    hint.textContent = "running low on energy — let it rest";
  } else if (state.stage === "kit") {
    hint.textContent = "still tiny, keep taking good care of it";
  } else {
    hint.textContent = "content and cozy";
  }
}

/* ---------------- Game loop ---------------- */

function tick() {
  const now = Date.now();
  const elapsedSec = (now - state.lastTick) / 1000;
  state.lastTick = now;

  if (!state.sleeping) {
    state.hunger = clamp(state.hunger - DECAY_PER_TICK * elapsedSec);
    state.joy = clamp(state.joy - DECAY_PER_TICK * 0.8 * elapsedSec);
    state.energy = clamp(state.energy - DECAY_PER_TICK * 0.5 * elapsedSec);
    if (state.hunger > 40 && state.joy > 40) {
      state.careHours += elapsedSec / 3600;
    }
  } else {
    state.energy = clamp(state.energy + DECAY_PER_TICK * 3 * elapsedSec);
    if (state.energy >= 100) state.sleeping = false;
  }

  state.stage = stageForCareHours(state.careHours);

  blinkOn = Math.floor(now / 2200) % 5 === 0;

  render();
  saveState();
}

/* ---------------- Interactions ---------------- */

document.getElementById("feedBtn").addEventListener("click", () => {
  if (state.sleeping) return;
  state.hunger = clamp(state.hunger + 22);
  bump("feedBtn");
});

document.getElementById("playBtn").addEventListener("click", () => {
  if (state.sleeping) return;
  state.joy = clamp(state.joy + 20);
  state.energy = clamp(state.energy - 8);
  bump("playBtn");
});

document.getElementById("sleepBtn").addEventListener("click", () => {
  state.sleeping = !state.sleeping;
  bump("sleepBtn");
});

function bump(id) {
  const el = document.getElementById(id);
  el.style.transform = "scale(0.85)";
  setTimeout(() => (el.style.transform = ""), 120);
}

/* ---------------- Boot ---------------- */

render();
setInterval(tick, TICK_MS);
