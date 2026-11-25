// main.js — boot, the game loop, and all input for Ember & Order.
// Owns the game state (screen, day, score, hand, chopping board, stove pots,
// assembly plate) and wires the modules together: orders.js runs the board,
// kitchen.js draws and hit-tests, recipes.js knows the dishes, audio.js the sounds.

import { INGREDIENTS, INGREDIENT_ORDER, freshIngredient, recipeById, plateMatchesRecipe } from './recipes.js';
import { createOrderBoard, tickOrders, serveOrder, resetBoardForDay, dayTarget } from './orders.js';
import { drawGame, stationAt, W, H } from './kitchen.js';
import { sfx, toggleMute, isMuted } from './audio.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = W;
canvas.height = H;

function freshState() {
  return {
    screen: 'title', // title | play | over
    day: 1,
    score: 0,
    coins: 0,
    served: 0,
    time: 0,
    muted: false,
    hand: null, // processed ingredient in hand, or null
    chop: { item: null, hits: 0 }, // chopping board: one item, 3 clicks to chop
    stove: [{ item: null, progress: 0 }, { item: null, progress: 0 }],
    plate: [], // up to 3 processed ingredients being assembled
    board: createOrderBoard(),
    dayTarget: dayTarget(1),
    message: '',
    messageGood: true,
    messageT: 0,
    banner: '',
    bannerSub: '',
    bannerT: 0,
  };
}

let G = freshState();

function say(msg, good = true, secs = 2.5) {
  G.message = msg;
  G.messageGood = good;
  G.messageT = secs;
}

function startGame() {
  G = freshState();
  G.screen = 'play';
  G.board.spawnIn = 4;
  say('Day 1 — grab an ingredient to start!', true, 3);
  sfx.dayUp();
}

function gameOver() {
  G.screen = 'over';
  sfx.gameOver();
}

function advanceDay() {
  G.day += 1;
  G.dayTarget = dayTarget(G.day);
  resetBoardForDay(G.board);
  G.banner = `🎉 DAY ${G.day - 1} COMPLETE!`;
  G.bannerSub = `Day ${G.day}: more tickets, shorter timers — the fire burns brighter`;
  G.bannerT = 3;
  sfx.dayUp();
}

// ---- actions ---------------------------------------------------------------

function grabIngredient(id) {
  if (G.screen !== 'play') return;
  if (G.hand) { say('Hands full — place or trash what you hold first', false); return; }
  G.hand = freshIngredient(id);
  sfx.pickup();
}

function chopAction() {
  if (G.screen !== 'play') return;
  const board = G.chop;
  if (!board.item) {
    if (G.hand && INGREDIENTS[G.hand.id].canChop && !G.hand.chopped) {
      board.item = G.hand;
      board.hits = 0;
      G.hand = null;
      sfx.click();
    } else if (G.hand) {
      say(`${INGREDIENTS[G.hand.id].name} needs no chopping`, false);
    }
    return;
  }
  board.hits += 1;
  sfx.chop();
  if (board.hits >= 3) {
    board.item.chopped = true;
    G.hand = board.item;
    board.item = null;
    board.hits = 0;
    sfx.cooked();
    say(`${INGREDIENTS[G.hand.id].name} chopped!`, true, 1.5);
  }
}

function stoveAction(slot) {
  if (G.screen !== 'play') return;
  const pot = G.stove[slot];
  if (pot.item) {
    if (G.hand) { say('That pot is busy — pick the food up first', false); return; }
    G.hand = pot.item;
    pot.item = null;
    pot.progress = 0;
    if (G.hand.burnt) { say('Burnt! Trash it.', false); sfx.burn(); }
    else if (G.hand.cooked) say(`${INGREDIENTS[G.hand.id].name} cooked and ready!`, true, 1.5);
    else say('Taken off the fire early — still raw', false);
    sfx.pickup();
    return;
  }
  if (G.hand && INGREDIENTS[G.hand.id].canCook && !G.hand.cooked && !G.hand.burnt) {
    pot.item = G.hand;
    pot.progress = 0;
    G.hand = null;
    sfx.sizzle();
  } else if (G.hand) {
    say(`${INGREDIENTS[G.hand.id].name} can't go on the fire`, false);
  }
}

function plateAction() {
  if (G.screen !== 'play') return;
  if (!G.hand) {
    if (G.plate.length) { // empty hand + click plate: take the last item back.
      G.hand = G.plate.pop();
      sfx.pickup();
    }
    return;
  }
  if (G.plate.length >= 3) { say('Plate is full — serve it or trash it', false); return; }
  G.plate.push(G.hand);
  G.hand = null;
  sfx.plate();
}

function trashAction() {
  if (G.hand) { G.hand = null; sfx.click(); say('Trashed', false, 1); return; }
  if (G.plate.length) { G.plate = []; sfx.click(); say('Plate cleared', false, 1); return; }
  if (G.chop.item) { G.chop.item = null; G.chop.hits = 0; sfx.click(); return; }
}

function serveTicket(orderId) {
  if (G.screen !== 'play') return;
  if (!G.plate.length) { say('Plate is empty — build a dish first', false); return; }
  const result = serveOrder(G.board, orderId, G.plate);
  if (!result.ok) {
    say('That plate does not match this ticket!', false);
    sfx.fail();
    return;
  }
  const recipe = recipeById(result.order.recipeId);
  G.plate = [];
  G.score += result.earned;
  G.coins += result.earned;
  G.served += 1;
  sfx.serve();
  setTimeout(() => sfx.coin(), 180);
  say(`Served ${recipe.name}! +${result.earned}¢${result.tip ? ` (incl. ${result.tip}¢ tip)` : ''}`, true, 3);
  if (G.board.servedToday >= G.dayTarget) advanceDay();
}

// ---- input -----------------------------------------------------------------

function handleStation(hit) {
  if (!hit) return;
  if (G.screen === 'title') { startGame(); return; }
  if (G.screen === 'over') { startGame(); return; }
  switch (hit.type) {
    case 'bin': grabIngredient(hit.ingredient); break;
    case 'chop': chopAction(); break;
    case 'stove': if (hit.slot >= 0) stoveAction(hit.slot); else say('Click a pot, not the stove top', false, 1.2); break;
    case 'plate': plateAction(); break;
    case 'trash': trashAction(); break;
    case 'ticket': serveTicket(hit.orderId); break;
    case 'serve': say('Serve by clicking the matching order ticket', true, 1.5); break;
    case 'hand': if (G.hand) say('Click the plate, board, stove or trash with it', true, 1.5); break;
    default: break;
  }
}

canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) * (W / rect.width);
  const y = (e.clientY - rect.top) * (H / rect.height);
  handleStation(stationAt(x, y, G));
});

window.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && G.screen !== 'play') { startGame(); return; }
  if (e.key === 'r' || e.key === 'R') { startGame(); return; }
  if (e.key === 'm' || e.key === 'M') { G.muted = toggleMute(); say(G.muted ? 'Sound off' : 'Sound on', true, 1); return; }
  if (G.screen !== 'play') return;
  const idx = INGREDIENT_ORDER.findIndex((id) => INGREDIENTS[id].key === e.key);
  if (idx >= 0) { grabIngredient(INGREDIENT_ORDER[idx]); return; }
  if (e.key === 'c' || e.key === 'C') chopAction();
  if (e.key === 't' || e.key === 'T') trashAction();
  if (e.key === 'Escape') { G.hand = null; }
});

// ---- loop ------------------------------------------------------------------

let last = performance.now();

function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  G.time += dt;
  if (G.messageT > 0) G.messageT -= dt;
  if (G.bannerT > 0) G.bannerT -= dt;

  if (G.screen === 'play') {
    // Stove pots cook in real time; food left too long after done burns.
    for (const pot of G.stove) {
      if (pot.item && !pot.item.cooked) {
        pot.progress += dt;
        if (pot.progress >= 4) {
          pot.item.cooked = true;
          pot.item.burnt = false;
          sfx.cooked();
        }
      } else if (pot.item && pot.item.cooked && !pot.item.burnt) {
        pot.progress += dt;
        if (pot.progress >= 14) {
          pot.item.burnt = true;
          sfx.burn();
          say('Something burnt on the stove!', false, 2.5);
        }
      }
    }
    const events = tickOrders(G.board, G.day, dt);
    for (const order of events.expired) {
      const recipe = recipeById(order.recipeId);
      say(`Too slow — ${recipe.name} walked out!`, false, 3);
      sfx.fail();
    }
    if (events.spawned) sfx.newOrder();
    if (G.board.failed >= 3) gameOver();
  }

  drawGame(ctx, G);
  requestAnimationFrame(frame);
}

// A ?shot= parameter stages a fixed moment for screenshots; otherwise the
// title screen waits for the player.
const shot = new URLSearchParams(location.search).get('shot');
if (shot) {
  G.screen = 'play';
  applyShot(G, shot);
  // Freeze the staged moment: timers keep their values in the screenshot.
  G.time = 1.2;
}
requestAnimationFrame(frame);
