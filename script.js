/**
 * pixel-tamagotchi
 * ----------------
 * A tiny plant buddy that lives entirely in the browser. No backend,
 * no build step, state is saved to localStorage so it survives a page
 * refresh (but not a different browser or device).
 *
 * Stats decay slowly over real time. Water it, give it sunlight, and
 * let it rest to keep it healthy. Let it go too long and it'll let
 * you know. The pot has a little face that reacts as it grows.
 */

const STORAGE_KEY = "pixel-tamagotchi-save-v1";
const TICK_MS = 1000;
const DECAY_PER_TICK = 0.06; // stat points lost per second, per stat
const EVOLUTION_HOURS = [0, 0.02, 0.06]; // sprout -> plant -> bloom (hours of care)

const canvas = document.getElementById("screen");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

const CELL = 8; // px per pixel-art cell (canvas is 128x112 -> 16x14 grid)

const PALETTE = {
  ".": null,
  "w": "#fdf6ec", // pot rim highlight
  "o": "#c9772f", // pot body (terracotta)
  "p": "#f2a9c8", // blush cheeks
  "e": "#2b2b2b", // eyes
  "g": "#6fa85c", // leaves
  "f": "#e8a4c9", // flower petals
  "y": "#f2d24a", // flower center
  "z": "#9ab08a", // sleepy zzz marks
};

/* ---------------- Sprites (16 wide x 14 tall grids) ---------------- */

const SPRITES = {
  sprout: [
    "................",
    "................",
    "................",
    "................",
    "................",
    ".......g........",
    ".......gg.......",
    ".....wwwwww.....",
    "....wwwwwwww....",
    "...ooeooooeoo...",
    "...ooopoopooo...",
    "...oooooooooo...",
    "....oooooooo....",
    ".....wwwwww.....",
  ],
  plant: [
    "................",
    "................",
    ".......gg.......",
    "......g..g......",
    "......g..g......",
    ".......gg.......",
    ".....wwwwww.....",
    "....wwwwwwww....",
    "...ooeooooeoo...",
    "...ooopoopooo...",
    "...oooooooooo...",
    "....oooooooo....",
    ".....wwwwww.....",
    "................",
  ],
  plant_blink: [
    "................",
    "................",
    ".......gg.......",
    "......g..g......",
    "......g..g......",
    ".......gg.......",
    ".....wwwwww.....",
    "....wwwwwwww....",
    "...oogoooogoo...",
    "...ooopoopooo...",
    "...oooooooooo...",
    "....oooooooo....",
    ".....wwwwww.....",
    "................",
  ],
  bloom: [
    "................",
    "......fyyf......",
    ".......ff.......",
    "......g..g......",
    "......g..g......",
    ".......gg.......",
    ".....wwwwww.....",
    "....wwwwwwww....",
    "...ooeooooeoo...",
    "...ooopoopooo...",
    "...oooooooooo...",
    "....oooooooo....",
    ".....wwwwww.....",
    "................",
  ],
  sleeping: [
    "................",
    "...........z....",
    "............z...",
    "................",
    "................",
    ".......g........",
    ".......gg.......",
    ".....wwwwww.....",
    "....wwwwwwww....",
    "...oogoooogoo...",
    "...ooopoopooo...",
    "...oooooooooo...",
    "....oooooooo....",
    ".....wwwwww.....",
  ],
};

function drawSprite(gridName) {
  const grid = SPRITES[gridName] || SPRITES.sprout;
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
    water: 80,
    sunlight: 80,
    energy: 80,
    careHours: 0,
    stage: "sprout",
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
  if (hours >= EVOLUTION_HOURS[2]) return "bloom";
  if (hours >= EVOLUTION_HOURS[1]) return "plant";
  return "sprout";
}

/* ---------------- Rendering ---------------- */

const waterFill = document.getElementById("waterFill");
const sunlightFill = document.getElementById("sunlightFill");
const energyFill = document.getElementById("energyFill");
const nameplate = document.getElementById("nameplate");
const hint = document.getElementById("hint");

function clamp(n) {
  return Math.max(0, Math.min(100, n));
}

function currentSprite() {
  if (state.sleeping) return "sleeping";
  if (state.stage === "sprout") return "sprout";
  if (state.stage === "plant") return blinkOn ? "plant_blink" : "plant";
  return state.stage; // bloom
}

function render() {
  drawSprite(currentSprite());

  waterFill.style.width = `${clamp(state.water)}%`;
  sunlightFill.style.width = `${clamp(state.sunlight)}%`;
  energyFill.style.width = `${clamp(state.energy)}%`;

  const dayNum = Math.max(1, Math.floor((Date.now() - state.bornAt) / (1000 * 60 * 60 * 24)) + 1);
  nameplate.textContent = `${state.stage} · day ${dayNum}`;

  if (state.sleeping) {
    hint.textContent = "shh, resting — wake it by clicking rest again";
  } else if (state.water < 25) {
    hint.textContent = "getting thirsty — try watering it";
  } else if (state.sunlight < 25) {
    hint.textContent = "could use some sun";
  } else if (state.energy < 20) {
    hint.textContent = "running low on energy — let it rest";
  } else if (state.stage === "sprout") {
    hint.textContent = "just starting out, keep taking good care of it";
  } else {
    hint.textContent = "happy and thriving";
  }
}

/* ---------------- Game loop ---------------- */

function tick() {
  const now = Date.now();
  const elapsedSec = (now - state.lastTick) / 1000;
  state.lastTick = now;

  if (!state.sleeping) {
    state.water = clamp(state.water - DECAY_PER_TICK * elapsedSec);
    state.sunlight = clamp(state.sunlight - DECAY_PER_TICK * 0.8 * elapsedSec);
    state.energy = clamp(state.energy - DECAY_PER_TICK * 0.5 * elapsedSec);
    if (state.water > 40 && state.sunlight > 40) {
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

document.getElementById("waterBtn").addEventListener("click", () => {
  if (state.sleeping) return;
  state.water = clamp(state.water + 22);
  bump("waterBtn");
});

document.getElementById("sunBtn").addEventListener("click", () => {
  if (state.sleeping) return;
  state.sunlight = clamp(state.sunlight + 20);
  state.energy = clamp(state.energy - 8);
  bump("sunBtn");
});

document.getElementById("restBtn").addEventListener("click", () => {
  state.sleeping = !state.sleeping;
  bump("restBtn");
});

function bump(id) {
  const el = document.getElementById(id);
  el.style.transform = "scale(0.85)";
  setTimeout(() => (el.style.transform = ""), 120);
}

/* ---------------- Boot ---------------- */

render();
setInterval(tick, TICK_MS);
