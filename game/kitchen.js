// kitchen.js — the kitchen itself: layout, all canvas drawing, and hit-testing
// for mouse clicks. Every visual is drawn in code (no images): the open-fire
// hearth, the wooden counters, and each ingredient drawn so it reads at a glance.

import { INGREDIENTS, INGREDIENT_ORDER, RECIPES, recipeById, stepLabel, ingredientStateLabel } from './recipes.js';

export const W = 1280;
export const H = 800;

// Station rectangles, in canvas pixels. main.js asks stationAt() what a click hit.
export const LAYOUT = {
  hud: { x: 0, y: 0, w: 1280, h: 58 },
  board: { x: 20, y: 68, w: 1240, h: 140 },
  chop: { x: 30, y: 216, w: 270, h: 252 },
  stove: { x: 330, y: 216, w: 320, h: 252 },
  stoveSlots: [
    { x: 352, y: 300, w: 120, h: 120 },
    { x: 500, y: 300, w: 120, h: 120 },
  ],
  plate: { x: 680, y: 216, w: 300, h: 252 },
  serve: { x: 1010, y: 216, w: 240, h: 252 },
  trash: { x: 1120, y: 400, w: 110, h: 56 },
  bins: INGREDIENT_ORDER.map((_, i) => ({ x: 30 + i * 208, y: 500, w: 188, h: 150 })),
  hand: { x: 30, y: 678, w: 300, h: 96 },
};

export function stationAt(x, y, G) {
  const inRect = (r) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;
  if (G.screen === 'title' || G.screen === 'over') return { type: 'screen' };
  // Order tickets first: they sit on the board and are the serve targets.
  const b = LAYOUT.board;
  if (inRect(b)) {
    const n = G.board.orders.length;
    if (n) {
      const tw = Math.min(300, (b.w - 24 - (n - 1) * 12) / n);
      for (let i = 0; i < n; i++) {
        const tx = b.x + 14 + i * (tw + 12);
        if (x >= tx && x < tx + tw && y >= b.y + 30 && y < b.y + b.h - 10) {
          return { type: 'ticket', orderId: G.board.orders[i].id };
        }
      }
    }
    return { type: 'board' };
  }
  if (inRect(LAYOUT.chop)) return { type: 'chop' };
  for (let i = 0; i < 2; i++) if (inRect(LAYOUT.stoveSlots[i])) return { type: 'stove', slot: i };
  if (inRect(LAYOUT.stove)) return { type: 'stove', slot: -1 };
  if (inRect(LAYOUT.plate)) return { type: 'plate' };
  if (inRect(LAYOUT.trash)) return { type: 'trash' };
  if (inRect(LAYOUT.serve)) return { type: 'serve' };
  for (let i = 0; i < 6; i++) if (inRect(LAYOUT.bins[i])) return { type: 'bin', ingredient: INGREDIENT_ORDER[i] };
  if (inRect(LAYOUT.hand)) return { type: 'hand' };
  return null;
}

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, s, x, y, size, color, weight = 700, align = 'left') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px system-ui, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
}

// ---- ingredient drawing -------------------------------------------------
// Each ingredient has a distinct silhouette AND colour, so the counter reads
// at a glance. Chopped = sliced pieces; cooked = darker + steam wisp.

export function drawIngredient(ctx, item, cx, cy, r, t = 0) {
  const def = INGREDIENTS[item.id];
  ctx.save();
  ctx.translate(cx, cy);
  if (item.burnt) {
    ctx.fillStyle = '#241d18';
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#555'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-r * 0.5, -r * 0.4); ctx.lineTo(r * 0.5, r * 0.4); ctx.moveTo(r * 0.5, -r * 0.4); ctx.lineTo(-r * 0.5, r * 0.4); ctx.stroke();
    ctx.restore();
    return;
  }
  const col = item.cooked ? def.dark : def.color;
  switch (item.id) {
    case 'tomato': {
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#2f7d3e';
      ctx.beginPath(); ctx.moveTo(0, -r); ctx.lineTo(-r * 0.4, -r * 1.35); ctx.lineTo(0, -r * 1.05); ctx.lineTo(r * 0.4, -r * 1.35); ctx.closePath(); ctx.fill();
      if (item.chopped) { ctx.strokeStyle = '#ffd9d9'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-r * 0.6, -r * 0.2); ctx.lineTo(r * 0.6, -r * 0.2); ctx.moveTo(-r * 0.6, r * 0.35); ctx.lineTo(r * 0.6, r * 0.35); ctx.stroke(); }
      break;
    }
    case 'lettuce': {
      ctx.fillStyle = col;
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        ctx.beginPath(); ctx.arc(Math.cos(a) * r * 0.45, Math.sin(a) * r * 0.45, r * 0.62, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = '#8fd6a0';
      ctx.beginPath(); ctx.arc(0, 0, r * 0.5, 0, Math.PI * 2); ctx.fill();
      if (item.chopped) { ctx.strokeStyle = '#1d5c2a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-r * 0.7, 0); ctx.lineTo(r * 0.7, 0); ctx.stroke(); }
      break;
    }
    case 'onion': {
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = def.dark; ctx.lineWidth = 2;
      for (const rr2 of [0.65, 0.35]) { ctx.beginPath(); ctx.arc(0, 0, r * rr2, 0, Math.PI * 2); ctx.stroke(); }
      ctx.fillStyle = '#7fb069';
      ctx.beginPath(); ctx.moveTo(0, -r); ctx.lineTo(-r * 0.25, -r * 1.4); ctx.lineTo(r * 0.25, -r * 1.4); ctx.closePath(); ctx.fill();
      if (item.chopped) {
        ctx.fillStyle = '#fff';
        for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.arc(i * r * 0.45, r * 0.2, r * 0.28, 0, Math.PI * 2); ctx.fill(); }
      }
      break;
    }
    case 'meat': {
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.ellipse(0, 0, r * 1.1, r * 0.75, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = item.cooked ? '#5e2413' : '#e8a583';
      ctx.beginPath(); ctx.ellipse(0, 0, r * 0.6, r * 0.4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f3e2c7';
      ctx.beginPath(); ctx.ellipse(r * 0.75, -r * 0.35, r * 0.35, r * 0.2, 0.6, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'bread': {
      ctx.fillStyle = col;
      rr(ctx, -r, -r * 0.75, r * 2, r * 1.5, r * 0.5); ctx.fill();
      ctx.fillStyle = '#f7dc9e';
      rr(ctx, -r * 0.8, -r * 0.55, r * 1.6, r * 1.1, r * 0.4); ctx.fill();
      break;
    }
    case 'cheese': {
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.moveTo(-r, r * 0.7); ctx.lineTo(0, -r); ctx.lineTo(r, r * 0.7); ctx.closePath(); ctx.fill();
      ctx.fillStyle = def.dark;
      for (const [hx, hy] of [[-0.3, 0.25], [0.25, 0.35], [0.05, -0.2]]) {
        ctx.beginPath(); ctx.arc(hx * r, hy * r, r * 0.16, 0, Math.PI * 2); ctx.fill();
      }
      break;
    }
    default: break;
  }
  if (item.cooked && !item.burnt) {
    // Steam wisp rising off hot food.
    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.lineWidth = 2;
    const wob = Math.sin(t * 3 + cx) * 3;
    ctx.beginPath(); ctx.moveTo(wob - 4, -r - 4); ctx.quadraticCurveTo(wob + 4, -r - 14, wob - 2, -r - 22); ctx.stroke();
  }
  ctx.restore();
}

// ---- full scene ----------------------------------------------------------

function drawHud(ctx, G) {
  ctx.fillStyle = '#2b1a12';
  ctx.fillRect(0, 0, W, 58);
  ctx.fillStyle = '#f5c542';
  ctx.fillRect(0, 58, W, 3);
  text(ctx, '🔥 EMBER & ORDER', 24, 30, 24, '#ffd98a', 800);
  text(ctx, `Day ${G.day}`, 330, 30, 20, '#fff');
  text(ctx, `Score ${G.score}`, 450, 30, 20, '#fff');
  text(ctx, `Coins ${G.coins}¢`, 600, 30, 20, '#ffd98a');
  text(ctx, `Served ${G.board.servedToday}/${G.dayTarget}`, 760, 30, 18, '#bfe8c6');
  const fails = '✖'.repeat(G.board.failed) + '·'.repeat(Math.max(0, 3 - G.board.failed));
  text(ctx, `Failed ${fails}`, 960, 30, 18, G.board.failed ? '#ff9a8a' : '#fff');
  text(ctx, G.muted ? '🔇 M' : '🔊 M', 1180, 30, 18, '#ffd98a', 700, 'center');
}

function drawOrderBoard(ctx, G) {
  const b = LAYOUT.board;
  ctx.fillStyle = '#5a3a22';
  rr(ctx, b.x, b.y, b.w, b.h, 12); ctx.fill();
  ctx.fillStyle = '#7a5230';
  rr(ctx, b.x + 6, b.y + 6, b.w - 12, b.h - 12, 9); ctx.fill();
  text(ctx, 'ORDER BOARD', b.x + 16, b.y + 18, 13, '#ffd98a', 800);
  text(ctx, 'click a ticket with the matching plate to serve', b.x + 150, b.y + 18, 13, '#e8c9a0', 400);
  const orders = G.board.orders;
  if (!orders.length) {
    text(ctx, 'No orders yet — grab an ingredient below while you wait…', b.x + 16, b.y + 74, 18, '#f3e2c7', 400);
    return;
  }
  const n = orders.length;
  const tw = Math.min(300, (b.w - 24 - (n - 1) * 12) / n);
  orders.forEach((order, i) => {
    const x = b.x + 14 + i * (tw + 12);
    const y = b.y + 30;
    const h = b.h - 40;
    const urgent = order.timeLeft < 12;
    const frac = Math.max(0, order.timeLeft / order.total);
    ctx.fillStyle = '#fdf6e3';
    rr(ctx, x, y, tw, h, 8); ctx.fill();
    ctx.fillStyle = urgent && Math.floor(G.time * 4) % 2 === 0 ? '#c0392b' : '#2b1a12';
    rr(ctx, x, y, tw, 6, 3); ctx.fill();
    const recipe = recipeById(order.recipeId);
    text(ctx, recipe.name, x + 10, y + 16, 16, '#2b1a12', 800);
    text(ctx, `${recipe.price}¢`, x + tw - 10, y + 16, 15, '#8a5a00', 800, 'right');
    recipe.steps.forEach((s, j) => text(ctx, '• ' + stepLabel(s), x + 10, y + 38 + j * 16, 12.5, '#4a3220', 400));
    // Timer bar + seconds on one row — the timer you can feel.
    const barY = y + h - 18;
    ctx.fillStyle = '#e5d9c0';
    rr(ctx, x + 10, barY, tw - 68, 10, 5); ctx.fill();
    ctx.fillStyle = frac > 0.5 ? '#58b368' : frac > 0.25 ? '#f5a623' : '#e5484d';
    rr(ctx, x + 10, barY, (tw - 68) * frac, 10, 5); ctx.fill();
    text(ctx, `${Math.ceil(order.timeLeft)}s`, x + tw - 10, barY + 5, 14, urgent ? '#c0392b' : '#2b1a12', 800, 'right');
  });
}

function drawChopStation(ctx, G) {
  const r = LAYOUT.chop;
  ctx.fillStyle = '#8a5a2e'; rr(ctx, r.x, r.y, r.w, r.h, 12); ctx.fill();
  ctx.fillStyle = '#a9743f'; rr(ctx, r.x + 8, r.y + 8, r.w - 16, r.h - 16, 9); ctx.fill();
  text(ctx, '🪓 CHOPPING BOARD', r.x + 16, r.y + 24, 15, '#fff', 800);
  text(ctx, 'click 3× to chop', r.x + 16, r.y + 46, 12.5, '#f3e2c7', 400);
  // Wooden board
  ctx.fillStyle = '#d9a05b'; rr(ctx, r.x + 40, r.y + 80, r.w - 80, 130, 10); ctx.fill();
  ctx.strokeStyle = '#8a5a2e'; ctx.lineWidth = 3; rr(ctx, r.x + 40, r.y + 80, r.w - 80, 130, 10); ctx.stroke();
  const item = G.chop.item;
  if (item) {
    drawIngredient(ctx, item, r.x + r.w / 2, r.y + 145, 42, G.time);
    if (G.chop.hits > 0) {
      ctx.fillStyle = '#2b1a12'; rr(ctx, r.x + 30, r.y + 220, r.w - 60, 12, 6); ctx.fill();
      ctx.fillStyle = '#58b368'; rr(ctx, r.x + 30, r.y + 220, (r.w - 60) * (G.chop.hits / 3), 12, 6); ctx.fill();
    }
    text(ctx, ingredientStateLabel(item), r.x + r.w / 2, r.y + 240, 12, '#fff', 600, 'center');
  } else {
    text(ctx, 'empty — bring a raw ingredient', r.x + r.w / 2, r.y + 145, 13, '#f3e2c7', 400, 'center');
  }
}

function drawStove(ctx, G) {
  const r = LAYOUT.stove;
  ctx.fillStyle = '#3d3d3d'; rr(ctx, r.x, r.y, r.w, r.h, 12); ctx.fill();
  ctx.fillStyle = '#555'; rr(ctx, r.x + 8, r.y + 8, r.w - 16, r.h - 16, 9); ctx.fill();
  text(ctx, '🔥 OPEN-FIRE STOVE', r.x + 16, r.y + 24, 15, '#ffd98a', 800);
  text(ctx, 'cooks in 4s — grab it before it burns!', r.x + 16, r.y + 46, 12.5, '#e8e8e8', 400);
  G.stove.forEach((slot, i) => {
    const s = LAYOUT.stoveSlots[i];
    // Fire glow under the pot.
    const flick = 0.75 + Math.sin(G.time * 7 + i * 2) * 0.15;
    ctx.fillStyle = `rgba(255,${Math.floor(120 + 60 * flick)},40,${0.55 * flick})`;
    ctx.beginPath(); ctx.ellipse(s.x + s.w / 2, s.y + s.h - 6, 52, 16, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#222';
    ctx.beginPath(); ctx.ellipse(s.x + s.w / 2, s.y + s.h - 22, 54, 18, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#6b6b6b';
    ctx.beginPath(); ctx.ellipse(s.x + s.w / 2, s.y + s.h - 26, 54, 16, 0, 0, Math.PI * 2); ctx.fill();
    if (slot && slot.item) {
      drawIngredient(ctx, slot.item, s.x + s.w / 2, s.y + s.h - 40, 30, G.time);
      const frac = Math.min(1, slot.progress / 4);
      ctx.fillStyle = '#222'; rr(ctx, s.x + 8, s.y + 4, s.w - 16, 9, 4); ctx.fill();
      ctx.fillStyle = slot.item.burnt ? '#e5484d' : frac >= 1 ? '#58b368' : '#f5a623';
      rr(ctx, s.x + 8, s.y + 4, (s.w - 16) * frac, 9, 4); ctx.fill();
      if (slot.item.burnt) text(ctx, 'BURNT!', s.x + s.w / 2, s.y - 6, 13, '#ff9a8a', 800, 'center');
      else if (frac >= 1) text(ctx, 'READY!', s.x + s.w / 2, s.y - 6, 13, '#8fe8a8', 800, 'center');
    } else {
      text(ctx, 'empty pot', s.x + s.w / 2, s.y + s.h / 2, 12.5, '#cfcfcf', 400, 'center');
    }
  });
}

function drawPlateStation(ctx, G) {
  const r = LAYOUT.plate;
  ctx.fillStyle = '#7a5230'; rr(ctx, r.x, r.y, r.w, r.h, 12); ctx.fill();
  ctx.fillStyle = '#a9743f'; rr(ctx, r.x + 8, r.y + 8, r.w - 16, r.h - 16, 9); ctx.fill();
  text(ctx, '🍽️ ASSEMBLY PLATE', r.x + 16, r.y + 24, 15, '#fff', 800);
  text(ctx, 'click with food in hand to add it', r.x + 16, r.y + 46, 12.5, '#f3e2c7', 400);
  // Big white plate.
  ctx.fillStyle = '#fdf6e3';
  ctx.beginPath(); ctx.ellipse(r.x + r.w / 2, r.y + 150, 105, 62, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#d9c9a8'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.ellipse(r.x + r.w / 2, r.y + 150, 88, 50, 0, 0, Math.PI * 2); ctx.stroke();
  if (!G.plate.length) {
    text(ctx, 'plate is empty', r.x + r.w / 2, r.y + 150, 13, '#8a7a5a', 400, 'center');
  } else {
    G.plate.forEach((item, i) => {
      const cx = r.x + r.w / 2 + (i - (G.plate.length - 1) / 2) * 62;
      drawIngredient(ctx, item, cx, r.y + 150, 26, G.time);
    });
  }
  // Which open order does this plate match right now?
  const match = G.board.orders.find((o) => {
    const recipe = recipeById(o.recipeId);
    if (!recipe || G.plate.length !== recipe.steps.length) return false;
    const used = new Array(G.plate.length).fill(false);
    return recipe.steps.every((step) => G.plate.some((item, i) => {
      if (used[i]) return false;
      const ok = item.id === step.id && item.chopped === step.chopped && item.cooked === step.cooked && !item.burnt;
      if (ok) used[i] = true;
      return ok;
    }));
  });
  if (match) {
    text(ctx, `✓ matches ${recipeById(match.recipeId).name} — click its ticket!`, r.x + r.w / 2, r.y + 232, 14, '#8fe8a8', 800, 'center');
  } else if (G.plate.length) {
    text(ctx, `${G.plate.length}/3 on plate — keep building`, r.x + r.w / 2, r.y + 232, 13, '#f3e2c7', 600, 'center');
  }
}

function drawServeStation(ctx, G) {
  const r = LAYOUT.serve;
  ctx.fillStyle = '#2f4a2f'; rr(ctx, r.x, r.y, r.w, r.h, 12); ctx.fill();
  ctx.fillStyle = '#3f6b3f'; rr(ctx, r.x + 8, r.y + 8, r.w - 16, r.h - 16, 9); ctx.fill();
  text(ctx, '🛎️ SERVE WINDOW', r.x + 16, r.y + 24, 15, '#fff', 800);
  text(ctx, 'serve by clicking', r.x + 16, r.y + 46, 12.5, '#d8ecd8', 400);
  text(ctx, 'the order ticket', r.x + 16, r.y + 64, 12.5, '#d8ecd8', 400);
  // Little bell + happy customer face.
  ctx.fillStyle = '#f5c542';
  ctx.beginPath(); ctx.arc(r.x + r.w / 2, r.y + 130, 34, Math.PI, 0); ctx.fill();
  ctx.fillRect(r.x + r.w / 2 - 40, r.y + 130, 80, 8);
  ctx.fillStyle = '#ffe9b0';
  ctx.beginPath(); ctx.arc(r.x + r.w / 2, r.y + 185, 30, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#2b1a12';
  ctx.beginPath(); ctx.arc(r.x + r.w / 2 - 11, r.y + 180, 3.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(r.x + r.w / 2 + 11, r.y + 180, 3.5, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#2b1a12'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.arc(r.x + r.w / 2, r.y + 190, 12, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
  // Trash bin.
  const t = LAYOUT.trash;
  ctx.fillStyle = '#5a2e2e'; rr(ctx, t.x, t.y, t.w, t.h, 8); ctx.fill();
  text(ctx, '🗑 TRASH', t.x + t.w / 2, t.y + t.h / 2, 13, '#fff', 700, 'center');
}

function drawBins(ctx, G) {
  INGREDIENT_ORDER.forEach((id, i) => {
    const b = LAYOUT.bins[i];
    const def = INGREDIENTS[id];
    ctx.fillStyle = '#6b4423'; rr(ctx, b.x, b.y, b.w, b.h, 12); ctx.fill();
    ctx.fillStyle = '#8a5a2e'; rr(ctx, b.x + 6, b.y + 6, b.w - 12, b.h - 6, 9); ctx.fill();
    drawIngredient(ctx, { id, chopped: false, cooked: false, burnt: false }, b.x + b.w / 2, b.y + 58, 34, G.time);
    text(ctx, def.name, b.x + b.w / 2, b.y + 108, 15, '#fff', 700, 'center');
    const hint = def.canChop && def.canCook ? 'chop + cook' : def.canChop ? 'chop it' : def.canCook ? 'cook it' : 'ready as-is';
    text(ctx, hint, b.x + b.w / 2, b.y + 130, 12, '#ffd98a', 400, 'center');
    text(ctx, `[${def.key}]`, b.x + b.w - 12, b.y + 16, 12, '#e8c9a0', 600, 'right');
  });
  text(ctx, 'INGREDIENT COUNTER — click a bin (or press 1–6) to grab it', 30, 490, 14, '#ffd98a', 700);
}

function drawFooter(ctx, G) {
  const h = LAYOUT.hand;
  ctx.fillStyle = '#2b1a12'; rr(ctx, h.x, h.y, h.w, h.h, 12); ctx.fill();
  text(ctx, 'IN HAND', h.x + 14, h.y + 18, 12, '#ffd98a', 800);
  if (G.hand) {
    drawIngredient(ctx, G.hand, h.x + 70, h.y + 56, 28, G.time);
    text(ctx, `${INGREDIENTS[G.hand.id].name} — ${ingredientStateLabel(G.hand)}`, h.x + 112, h.y + 56, 15, '#fff', 700);
  } else {
    text(ctx, 'empty hands', h.x + h.w / 2, h.y + 56, 14, '#b9a98f', 400, 'center');
  }
  text(ctx, 'Keys: 1–6 grab · C chop · T trash · M mute · R restart · click stations to work', 360, h.y + 40, 14, '#e8c9a0', 400);
  if (G.message && G.messageT > 0) {
    text(ctx, G.message, 360, h.y + 66, 14, G.messageGood ? '#8fe8a8' : '#ff9a8a', 700);
  } else {
    text(ctx, 'Tip: chop first, cook the meat, build the plate, then click the matching ticket before its timer dies.', 360, h.y + 66, 13, '#b9a98f', 400);
  }
}

function drawTitle(ctx, G) {
  ctx.fillStyle = 'rgba(20,10,5,0.82)';
  ctx.fillRect(0, 0, W, H);
  text(ctx, '🔥 EMBER & ORDER 🔥', W / 2, 210, 64, '#ffd98a', 800, 'center');
  text(ctx, 'a cozy open-fire kitchen — cook fast, serve faster', W / 2, 268, 22, '#f3e2c7', 400, 'center');
  text(ctx, 'Orders land on the board with a countdown. Grab ingredients, chop them,', W / 2, 340, 18, '#fff', 400, 'center');
  text(ctx, 'cook them on the fire, build the plate, and click the matching ticket.', W / 2, 368, 18, '#fff', 400, 'center');
  text(ctx, '5 dishes · 3 strikes and the night is over · finish the day target to level up', W / 2, 396, 18, '#ffd98a', 600, 'center');
  ctx.fillStyle = '#f5c542';
  rr(ctx, W / 2 - 150, 450, 300, 64, 14); ctx.fill();
  text(ctx, '▶  START COOKING', W / 2, 483, 24, '#2b1a12', 800, 'center');
  text(ctx, 'click anywhere or press Enter', W / 2, 550, 15, '#b9a98f', 400, 'center');
  text(ctx, 'Mouse + keyboard · all art drawn in code · all sounds synthesized · fully offline', W / 2, 610, 13, '#8a7a5a', 400, 'center');
}

function drawGameOver(ctx, G) {
  ctx.fillStyle = 'rgba(20,10,5,0.85)';
  ctx.fillRect(0, 0, W, H);
  text(ctx, '🌙 THE KITCHEN CLOSES', W / 2, 250, 52, '#ff9a8a', 800, 'center');
  text(ctx, 'Too many orders went cold. The fire dims for tonight.', W / 2, 310, 20, '#f3e2c7', 400, 'center');
  text(ctx, `Day ${G.day}  ·  Score ${G.score}  ·  Coins ${G.coins}¢  ·  Dishes served ${G.served}`, W / 2, 380, 22, '#fff', 700, 'center');
  ctx.fillStyle = '#f5c542';
  rr(ctx, W / 2 - 150, 440, 300, 64, 14); ctx.fill();
  text(ctx, '↻  COOK AGAIN  (R)', W / 2, 473, 22, '#2b1a12', 800, 'center');
  text(ctx, 'click anywhere or press R to restart', W / 2, 540, 15, '#b9a98f', 400, 'center');
}

export function drawGame(ctx, G) {
  // Warm kitchen backdrop: brick wall, wooden floor, hearth glow.
  ctx.fillStyle = '#4a2c1a';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#5d3a24';
  for (let y = 60; y < 500; y += 46) {
    ctx.fillRect(0, y, W, 3);
    for (let x = (y % 92 ? 40 : 0); x < W; x += 90) ctx.fillRect(x, y, 3, 46);
  }
  ctx.fillStyle = '#6b4423';
  ctx.fillRect(0, 660, W, 140);
  ctx.fillStyle = '#7a5230';
  for (let x = 0; x < W; x += 120) ctx.fillRect(x, 660, 4, 140);
  // Hearth glow behind the stove.
  const glow = ctx.createRadialGradient(490, 340, 20, 490, 340, 260);
  glow.addColorStop(0, 'rgba(255,140,40,0.28)');
  glow.addColorStop(1, 'rgba(255,140,40,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(200, 180, 600, 340);

  drawHud(ctx, G);
  drawOrderBoard(ctx, G);
  drawChopStation(ctx, G);
  drawStove(ctx, G);
  drawPlateStation(ctx, G);
  drawServeStation(ctx, G);
  drawBins(ctx, G);
  drawFooter(ctx, G);

  if (G.banner && G.bannerT > 0) {
    ctx.fillStyle = 'rgba(43,26,18,0.94)';
    rr(ctx, W / 2 - 260, 330, 520, 90, 14); ctx.fill();
    ctx.strokeStyle = '#f5c542'; ctx.lineWidth = 3; rr(ctx, W / 2 - 260, 330, 520, 90, 14); ctx.stroke();
    text(ctx, G.banner, W / 2, 362, 30, '#ffd98a', 800, 'center');
    text(ctx, G.bannerSub || '', W / 2, 394, 16, '#fff', 400, 'center');
  }
  if (G.screen === 'title') drawTitle(ctx, G);
  if (G.screen === 'over') drawGameOver(ctx, G);
}
