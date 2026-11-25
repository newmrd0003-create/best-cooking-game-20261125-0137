// shots.js — deterministic demo states for screenshots. A ?shot= URL parameter
// puts the kitchen into a fixed, lively moment so a screenshot shows the real
// game (not a random frame): cover = busy mid-game with a plate mid-assembly,
// rush = five tickets at once, win = a day cleared, over = the closing screen.
// These states are only entered from the URL; normal play never uses them.

import { freshIngredient } from './recipes.js';

function order(id, recipeId, timeLeft, total) {
  return { id, recipeId, timeLeft, total };
}

export function applyShot(G, shot) {
  if (shot === 'cover') {
    G.screen = 'play';
    G.day = 2; G.dayTarget = 6; G.score = 86; G.coins = 54; G.served = 4;
    G.board.orders = [
      order(1, 'burger', 26, 42),
      order(2, 'salad', 14, 38),
      order(3, 'soup', 33, 45),
    ];
    G.board.servedToday = 4;
    G.chop.item = freshIngredient('tomato');
    G.chop.item.chopped = false;
    G.chop.hits = 2;
    G.stove = [
      { item: freshIngredient('meat'), progress: 3.1, done: false },
      { item: null, progress: 0, done: false },
    ];
    G.stove[0].item.cooked = false;
    G.plate = [
      { ...freshIngredient('bread') },
      { ...freshIngredient('tomato'), chopped: true },
    ];
    G.hand = { ...freshIngredient('lettuce'), chopped: true };
    G.message = 'Add the chopped lettuce — the Sandwich is almost done!';
    G.messageGood = true;
    G.messageT = 99;
  } else if (shot === 'rush') {
    G.screen = 'play';
    G.day = 3; G.dayTarget = 7; G.score = 214; G.coins = 132; G.served = 11;
    G.board.orders = [
      order(1, 'burger', 9, 36),
      order(2, 'sate', 18, 39),
      order(3, 'soup', 24, 42),
      order(4, 'sandwich', 31, 45),
      order(5, 'salad', 12, 33),
    ];
    G.board.servedToday = 6;
    G.chop.item = freshIngredient('onion');
    G.chop.hits = 1;
    G.stove = [
      { item: { ...freshIngredient('meat'), cooked: true }, progress: 4, done: true },
      { item: { ...freshIngredient('tomato'), chopped: true }, progress: 2.2, done: false },
    ];
    G.plate = [{ ...freshIngredient('bread') }];
    G.hand = freshIngredient('cheese');
    G.message = 'Rush hour! 5 tickets on the board';
    G.messageGood = true;
    G.messageT = 99;
  } else if (shot === 'win') {
    G.screen = 'play';
    G.day = 2; G.dayTarget = 6; G.score = 148; G.coins = 96; G.served = 9;
    G.board.orders = [];
    G.board.servedToday = 5;
    G.banner = '🎉 DAY 1 COMPLETE!';
    G.bannerSub = '5 dishes served · the fire burns brighter tomorrow';
    G.bannerT = 99;
    G.plate = [
      { ...freshIngredient('bread') },
      { ...freshIngredient('meat'), cooked: true },
      { ...freshIngredient('cheese') },
    ];
    G.hand = null;
  } else if (shot === 'over') {
    G.screen = 'over';
    G.day = 2; G.dayTarget = 6; G.score = 96; G.coins = 61; G.served = 6;
    G.board.failed = 3;
    G.board.servedToday = 6;
  }
}
