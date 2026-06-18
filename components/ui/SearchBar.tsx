"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";

export default function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("q") ?? "");
  const mounted = useRef(false);
  const t = useTranslations("search");

  const push = useCallback(
    (q: string) => {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      router.push(q ? `/?${params.toString()}` : "/");
    },
    [router]
  );

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    const timer = setTimeout(() => push(value), 300);
    return () => clearTimeout(timer);
  }, [value, push]);

  return (
    <div
      className="relative flex items-center w-full rounded-lg overflow-hidden"
      style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-subtle)" }}
    >
      <Search
        className="absolute left-3 shrink-0"
        size={16}
        style={{ color: "var(--text-muted)" }}
        aria-hidden="true"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={t("placeholder")}
        className="w-full bg-transparent py-2 pl-9 pr-4 text-sm outline-none"
        style={{ color: "var(--text-primary)" }}
        aria-label={t("ariaLabel")}
      />
    </div>
  );
}
