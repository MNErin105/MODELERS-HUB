"use client";

import { useEffect, useState } from "react";
import { CATEGORIES, Category } from "@/lib/types";

const LS_KEY = "mh_cat_order";

export function useCategoryOrder() {
  const [order, setOrder] = useState<Category[]>(CATEGORIES);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return;
      const saved: unknown = JSON.parse(raw);
      if (!Array.isArray(saved)) return;
      const valid = (saved as string[]).filter((c): c is Category =>
        (CATEGORIES as string[]).includes(c),
      );
      const missing = CATEGORIES.filter((c) => !valid.includes(c));
      if (valid.length > 0) setOrder([...valid, ...missing]);
    } catch {
      // fall back to default
    }
  }, []);

  function saveOrder(newOrder: Category[]) {
    setOrder(newOrder);
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(newOrder));
    } catch {
      // ignore
    }
  }

  function resetOrder() {
    setOrder(CATEGORIES);
    try {
      localStorage.removeItem(LS_KEY);
    } catch {
      // ignore
    }
  }

  return { order, saveOrder, resetOrder };
}
