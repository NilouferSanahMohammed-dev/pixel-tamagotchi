# pixel-tamagotchi 🌱

A tiny plant buddy that lives in your browser tab. Water it, give it sunlight, let it rest, and watch it grow from a bare sprout into a full little bloom, with a cute face right on the pot that reacts as it grows. Ignore it and it'll let you know about it, just like a real plant would.

![status](https://img.shields.io/badge/status-active-brightgreen) ![license](https://img.shields.io/badge/license-MIT-blue)

I wanted to see how small I could make a "real" tamagotchi feel. No sprite sheets, no images, everything drawn pixel by pixel on a canvas from plain arrays in the code. The whole game is two files and zero dependencies.

## Play it

Open `index.html` in any browser. That's it, no install and no server needed, though `npx serve .` works fine if you'd rather have one.

Your plant buddy:
- **Grows** from a bare sprout into a leafy plant, then into a full bloom with a little flower, the longer you keep its stats healthy
- **Gets thirsty, sun-starved, and tired** over real time. The stat bars drain slowly whether the tab is open or not
- **Has a face on the pot**, not the plant, two little eyes and blush cheeks that stay put as the plant above it grows and changes
- **Remembers you.** Progress saves to `localStorage`, so closing the tab and coming back later picks up right where you left off (though it'll have gotten thirstier while you were gone)

### Controls

| Button | Effect |
|---|---|
| 💧 Water | Refills water |
| ☀️ Sun | Refills sunlight, costs a little energy |
| 🌙 Rest | Plant stops aging its needs and slowly recovers energy until you wake it |

## Why this is fun to fork

Everything about how the plant looks and behaves is just data at the top of `script.js`.

- **Sprites** are ASCII grids (`.` for empty, letters for palette colors), so you can draw a new pose by editing a 16x14 grid of characters, no art tools required. The pot's face (eyes and blush) stays in the same spot across every stage on purpose, only the plant growing out of it changes, that consistency is what sells the "same little guy, just growing" feeling.
- **Decay rate, evolution timing, and stat effects** are all constants near the top of the file, so tuning the game's pacing is a one line change
- **Palette** is a simple lookup table, so re-skinning the whole thing, pot color, leaf color, flower color, only takes a few hex swaps

Some ideas for extending it: add a wilted state if a stat hits zero for too long, add more bloom variations with different flower colors, or swap the device shell CSS for a totally different look, a greenhouse window, a windowsill scene, a terracotta shelf.

## Notes

- State is stored per browser via `localStorage`, so it won't sync across devices. This isn't a hosted service, just a fun front end toy.
- No frameworks and no build step. Just HTML, CSS, and vanilla JS on purpose, so it's easy to read start to finish in one sitting.

## License

MIT. Grow as many as you want.
