# pixel-tamagotchi 🥚

A tiny virtual pet that lives in your browser tab. Feed it, play with it, let it sleep. Ignore it and it'll get grumpy, just like the real ones did in the 90s.

![status](https://img.shields.io/badge/status-active-brightgreen) ![license](https://img.shields.io/badge/license-MIT-blue)

I wanted to see how small I could make a "real" tamagotchi feel. No sprite sheets, no images, everything drawn pixel by pixel on a canvas from plain arrays in the code. The whole game is two files and zero dependencies.

## Play it

Open `index.html` in any browser. That's it, no install and no server needed, though `npx serve .` works fine if you'd rather have one.

Your pet:
- **Hatches** from an egg into a baby, then a teen, then an adult, the longer you keep its stats healthy
- **Gets hungry, bored, and tired** over real time. The stat bars drain slowly whether the tab is open or not
- **Remembers you.** Progress saves to `localStorage`, so closing the tab and coming back later picks up right where you left off (though it will have gotten hungrier while you were gone)

### Controls

| Button | Effect |
|---|---|
| Feed | Refills hunger |
| Play | Refills joy, costs a little energy |
| Sleep | Pet stops aging its needs and slowly recovers energy until you wake it |

## Why this is fun to fork

Everything about how the pet looks and behaves is just data at the top of `script.js`.

- **Sprites** are ASCII grids (`.` for empty, letters for palette colors), so you can draw a new pose by editing a 16x14 grid of characters, no art tools required
- **Decay rate, evolution timing, and stat effects** are all constants near the top of the file, so tuning the game's pacing is a one line change
- **Palette** is a simple lookup table, so re-skinning the whole pet to a different color scheme only takes a few hex swaps

Some ideas for extending it: add a "sick" state if a stat hits zero for too long, add sound effects on interactions, or swap the device shell CSS for a totally different look. I went with a candy colored handheld, but a retro CRT or a plush toy shell would work just as well with the same game logic underneath.

## Notes

- State is stored per browser via `localStorage`, so it won't sync across devices. This isn't a hosted service, just a fun front end toy.
- No frameworks and no build step. Just HTML, CSS, and vanilla JS on purpose, so it's easy to read start to finish in one sitting.

## License

MIT. Hatch as many as you want.
