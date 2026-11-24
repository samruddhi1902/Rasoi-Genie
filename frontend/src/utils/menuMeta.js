export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const MEAL_ORDER = ['breakfast', 'lunch', 'snacks', 'dinner'];

export const MEAL_META = {
  breakfast: { label: 'Breakfast', emoji: '🌅', chip: 'bg-amber-50 text-amber-800 border-amber-200' },
  lunch: { label: 'Lunch', emoji: '☀️', chip: 'bg-orange-50 text-orange-800 border-orange-200' },
  snacks: { label: 'Snacks', emoji: '🍿', chip: 'bg-rose-50 text-rose-800 border-rose-200' },
  dinner: { label: 'Dinner', emoji: '🌙', chip: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
};

export const DIET_LABELS = { veg: 'Vegetarian', 'non-veg': 'Non-veg', vegan: 'Vegan' };

export const TIME_LABELS = {
  '<15min': 'Under 15 min',
  '<30min': 'Under 30 min',
  '<45min': 'Under 45 min',
};

export const sortMeals = (meals) =>
  [...meals].sort((a, b) => {
    const ia = MEAL_ORDER.indexOf(a);
    const ib = MEAL_ORDER.indexOf(b);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });

export const prettyCuisine = (c) =>
  c.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

export const menuToText = (menu) => {
  const lines = ['My weekly menu (Rasoi Genie)', ''];
  DAYS.forEach((day) => {
    const meals = menu[day];
    if (!meals) return;
    lines.push(day);
    sortMeals(Object.keys(meals)).forEach((meal) => {
      const label = MEAL_META[meal]?.label || meal;
      lines.push(`  ${label}: ${meals[meal]}`);
    });
    lines.push('');
  });
  return lines.join('\n').trim();
};

export const store = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v === null ? fallback : JSON.parse(v);
    } catch (e) {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      // storage unavailable: ignore
    }
  },
};
