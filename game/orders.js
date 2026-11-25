// orders.js — the order board: spawning tickets, ticking their countdowns,
// serving a matching plate, and the day / difficulty ramp. The board owns no
// drawing; kitchen.js renders whatever this module reports.

import { RECIPES, plateMatchesRecipe } from './recipes.js';

let nextOrderId = 1;

export function makeOrder(day, rng = Math.random) {
  const recipe = RECIPES[Math.floor(rng() * RECIPES.length)];
  // Day 1 is gentle; later days shave seconds off every ticket.
  const total = Math.max(22, 48 - day * 3 - Math.floor(rng() * 6));
  return { id: nextOrderId++, recipeId: recipe.id, timeLeft: total, total, fresh: true };
}

// How many tickets may sit on the board at once on this day.
export function maxOrdersForDay(day) {
  return Math.min(5, 2 + Math.floor((day - 1) / 1) + (day >= 3 ? 1 : 0));
}

// Seconds between new tickets: faster as days pass.
export function spawnIntervalForDay(day) {
  return Math.max(7, 14 - day);
}

// How many dishes finish a day (day 1: 5, then one more each day).
export function dayTarget(day) {
  return 4 + day;
}

export function createOrderBoard() {
  return { orders: [], spawnIn: 6, servedToday: 0, failed: 0 };
}

// Tick the board one frame. Returns events the game loop should react to:
// { expired: [order...], spawned: order|null }.
export function tickOrders(board, day, dt, rng = Math.random) {
  const events = { expired: [], spawned: null };
  for (const order of board.orders) order.timeLeft -= dt;
  const expired = board.orders.filter((o) => o.timeLeft <= 0);
  if (expired.length) {
    board.orders = board.orders.filter((o) => o.timeLeft > 0);
    board.failed += expired.length;
    events.expired = expired;
  }
  board.spawnIn -= dt;
  if (board.spawnIn <= 0 && board.orders.length < maxOrdersForDay(day)) {
    const order = makeOrder(day, rng);
    board.orders.push(order);
    board.spawnIn = spawnIntervalForDay(day);
    events.spawned = order;
  } else if (board.spawnIn <= 0) {
    board.spawnIn = 2; // board full: check again soon instead of stalling.
  }
  return events;
}

// Try to serve the plate to the ticket with this id. Returns
// { ok, order, tip } on a match, { ok:false } otherwise.
export function serveOrder(board, orderId, plate) {
  const order = board.orders.find((o) => o.id === orderId);
  if (!order) return { ok: false };
  const recipe = RECIPES.find((r) => r.id === order.recipeId);
  if (!plateMatchesRecipe(plate, recipe)) return { ok: false };
  board.orders = board.orders.filter((o) => o.id !== orderId);
  board.servedToday += 1;
  // Tip: up to +50% of the price for serving with most of the timer left.
  const tip = Math.round(recipe.price * 0.5 * Math.max(0, order.timeLeft / order.total));
  return { ok: true, order, tip, earned: recipe.price + tip };
}

export function resetBoardForDay(board) {
  board.orders = [];
  board.spawnIn = 5;
  board.servedToday = 0;
}
