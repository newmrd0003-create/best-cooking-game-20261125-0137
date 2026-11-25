// recipes.js — the ingredient catalogue and the recipe book for Ember & Order.
// Every dish is a combination of 2-3 processed ingredients. An ingredient is
// "ready" only when it has had every step its recipe asks for: chopped, cooked,
// or served as-is (bread and cheese need no work at all).

export const INGREDIENTS = {
  tomato: { id: 'tomato', name: 'Tomato', color: '#e5484d', dark: '#b3272e', canChop: true, canCook: true, key: '1' },
  lettuce: { id: 'lettuce', name: 'Lettuce', color: '#58b368', dark: '#2f7d3e', canChop: true, canCook: false, key: '2' },
  onion: { id: 'onion', name: 'Onion', color: '#e8dff5', dark: '#9b7ec4', canChop: true, canCook: false, key: '3' },
  meat: { id: 'meat', name: 'Meat', color: '#c96f4a', dark: '#8a3b22', canChop: false, canCook: true, key: '4' },
  bread: { id: 'bread', name: 'Bread', color: '#e8b96a', dark: '#a97a2e', canChop: false, canCook: false, key: '5' },
  cheese: { id: 'cheese', name: 'Cheese', color: '#f5c542', dark: '#c78f0a', canChop: false, canCook: false, key: '6' },
};

export const INGREDIENT_ORDER = ['tomato', 'lettuce', 'onion', 'meat', 'bread', 'cheese'];

// A processed ingredient: { id, chopped, cooked, burnt }.
// A recipe step: { id, chopped, cooked } — the exact state the plate must hold.
export const RECIPES = [
  {
    id: 'salad', name: 'Garden Salad', price: 12, color: '#58b368',
    steps: [
      { id: 'tomato', chopped: true, cooked: false },
      { id: 'lettuce', chopped: true, cooked: false },
    ],
  },
  {
    id: 'soup', name: 'Ember Tomato Soup', price: 16, color: '#e5484d',
    steps: [
      { id: 'tomato', chopped: true, cooked: true },
      { id: 'onion', chopped: true, cooked: false },
    ],
  },
  {
    id: 'sate', name: 'Fire Sate Skewer', price: 18, color: '#c96f4a',
    steps: [
      { id: 'meat', chopped: false, cooked: true },
      { id: 'onion', chopped: true, cooked: false },
    ],
  },
  {
    id: 'sandwich', name: 'Hearth Sandwich', price: 15, color: '#e8b96a',
    steps: [
      { id: 'bread', chopped: false, cooked: false },
      { id: 'lettuce', chopped: true, cooked: false },
      { id: 'tomato', chopped: true, cooked: false },
    ],
  },
  {
    id: 'burger', name: 'Ember Burger', price: 22, color: '#f5c542',
    steps: [
      { id: 'bread', chopped: false, cooked: false },
      { id: 'meat', chopped: false, cooked: true },
      { id: 'cheese', chopped: false, cooked: false },
    ],
  },
];

export function recipeById(id) {
  return RECIPES.find((r) => r.id === id) || null;
}

export function freshIngredient(id) {
  return { id, chopped: false, cooked: false, burnt: false };
}

// The exact state a recipe step wants, as a short label for the ticket.
export function stepLabel(step) {
  const base = INGREDIENTS[step.id].name;
  const bits = [];
  if (step.chopped) bits.push('chopped');
  if (step.cooked) bits.push('cooked');
  return bits.length ? `${base} (${bits.join(' + ')})` : base;
}

// Does the plate (array of processed ingredients) match this recipe exactly,
// order-insensitive, one plate item per recipe step?
export function plateMatchesRecipe(plate, recipe) {
  if (plate.length !== recipe.steps.length) return false;
  const used = new Array(plate.length).fill(false);
  return recipe.steps.every((step) =>
    plate.some((item, i) => {
      if (used[i]) return false;
      const ok = item.id === step.id && item.chopped === step.chopped &&
        item.cooked === step.cooked && !item.burnt;
      if (ok) used[i] = true;
      return ok;
    }),
  );
}

// Short state tag drawn under an ingredient: raw / chopped / cooked / burnt.
export function ingredientStateLabel(item) {
  if (item.burnt) return 'burnt!';
  if (item.cooked) return item.chopped ? 'chopped + cooked' : 'cooked';
  if (item.chopped) return 'chopped';
  return 'raw';
}
