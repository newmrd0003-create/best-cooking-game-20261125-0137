[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/newmrd0003-create/best-cooking-game-20261125-0137/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/newmrd0003-create/best-cooking-game-20261125-0137/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)

# Ember & Order — a cozy open-fire cooking game

A complete, original cooking game for make.fun's **Make the best cooking game** bounty. It runs offline in a desktop browser from static files — no network, no build step, all art drawn in code on canvas, all sounds synthesized with WebAudio.

## The game

You are the cook at a cozy open-fire kitchen. Orders land on the board with a countdown timer. Grab ingredients from the counter, chop them on the board, cook them on the fire, build the dish on the plate, and click the matching ticket to serve before its timer dies.

- **5 original recipes** from 2–3 ingredients each — Garden Salad, Ember Tomato Soup, Fire Sate Skewer, Hearth Sandwich, Ember Burger — each with its own chop/cook steps, so every order is a small route plan through the kitchen.
- **Real kitchen pressure:** tickets tick down in plain sight (green → amber → red), the stove burns food left too long, and the board fills up as days pass — more simultaneous orders, shorter timers.
- **Day progression:** serve the day's target to level up; 3 failed orders and the kitchen closes for the night. Score, coins and tips (serve early for up to +50%) track the shift.
- **Feel and polish:** chopping answers at once (3 clicks, progress bar), cooking sizzles, serving dings, the plate tells you when it already matches a ticket, and the fire flickers under the pots.
- **Full game flow:** title screen, live kitchen, day-complete banners, game-over screen, restart — mouse and keyboard (1–6 grab, C chop, T trash, M mute, R restart).

## Play it

Serve the game folder with any static server and open `game/index.html`:

```sh
node serve.ts   # then open http://localhost:8080
```

## Files

- `game/index.html` — the page
- `game/style.css` — page chrome around the canvas
- `game/main.js` — boot, game loop, state, and input
- `game/kitchen.js` — the kitchen: layout, all canvas drawing, hit-testing
- `game/orders.js` — the order board: spawning, countdowns, serving, day ramp
- `game/recipes.js` — the ingredient catalogue and the recipe book
- `game/audio.js` — synthesized WebAudio sounds, no files
- `game/shots.js` — deterministic demo states for screenshots
- `main.ts` — hands the game in (copies `game/` + `screenshots/`, writes `dossier.json`)
