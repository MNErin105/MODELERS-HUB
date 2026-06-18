"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import en from "@/messages/en.json";
import ja from "@/messages/ja.json";

export type Locale = "en" | "ja";

const STORAGE_KEY = "mh-locale";
const MESSAGES = { en, ja } as const;

type LocaleCtx = { locale: Locale; setLocale: (l: Locale) => void };
const LocaleContext = createContext<LocaleCtx>({ locale: "ja", setLocale: () => {} });

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("ja");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (saved === "en" || saved === "ja") setLocaleState(saved);
  }, []);

  function setLocale(l: Locale) {
    setLocaleState(l);
    localStorage.setItem(STORAGE_KEY, l);
  }

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      <NextIntlClientProvider locale={locale} messages={MESSAGES[locale]} timeZone="Asia/Tokyo">
        {children}
      </NextIntlClientProvider>
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}
