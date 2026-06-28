import { Category } from "./types";

const POOL: Record<Category, string[]> = {
  "Gunpla":          [1, 2, 3, 4, 5].map((n) => `/images/gunpla/0${n}.jpg`),
  "Military":        [1, 2, 3, 4, 5].map((n) => `/images/military/0${n}.jpg`),
  "Car":             [1, 2, 3, 4, 5].map((n) => `/images/car/0${n}.jpg`),
  "Character Model": [1, 2, 3, 4, 5].map((n) => `/images/character/0${n}.jpg`),
  "Diorama":         [1, 2, 3, 4, 5].map((n) => `/images/diorama/0${n}.jpg`),
  "Aircraft":        [1, 2, 3, 4, 5].map((n) => `/images/military/0${n}.jpg`),
  "Ship":            [1, 2, 3, 4, 5].map((n) => `/images/military/0${n}.jpg`),
  "Figure":          [1, 2, 3, 4, 5].map((n) => `/images/character/0${n}.jpg`),
  "Other":           [1, 2, 3, 4, 5].map((n) => `/images/gunpla/0${n}.jpg`),
};

export function getImage(category: Category, index: number): string {
  const pool = POOL[category] ?? POOL["Gunpla"];
  return pool[Math.abs(index) % pool.length];
}

export function getImages(category: Category, start: number, count: number): string[] {
  const pool = POOL[category] ?? POOL["Gunpla"];
  return Array.from({ length: count }, (_, i) => pool[(start + i) % pool.length]);
}
