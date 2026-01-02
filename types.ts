export interface Macros {
  calories: number;
  protein: number; // grams
  fiber: number; // grams
  carbs: number; // grams
  fat: number; // grams
  sugar?: number; // grams
}

export interface FoodEntry extends Macros {
  id: string;
  name: string;
  timestamp: number; // Unix timestamp
  date: string; // YYYY-MM-DD
  isFavorite?: boolean;
}

export interface DailyLog {
  date: string;
  totals: Macros;
  entries: FoodEntry[];
}

export enum Tab {
  DASHBOARD = 'DASHBOARD',
  LOG = 'LOG',
  FAVORITES = 'FAVORITES'
}

export type MacroKey = keyof Macros;

export const AVAILABLE_MACROS: { key: MacroKey; label: string; color: string }[] = [
  { key: 'calories', label: 'Calories', color: '#f59e0b' },
  { key: 'protein', label: 'Protein (g)', color: '#10b981' },
  { key: 'fiber', label: 'Fiber (g)', color: '#3b82f6' },
  { key: 'carbs', label: 'Carbs (g)', color: '#8b5cf6' },
  { key: 'fat', label: 'Fat (g)', color: '#ef4444' },
  { key: 'sugar', label: 'Sugar (g)', color: '#ec4899' },
];