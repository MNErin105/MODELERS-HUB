"use client";

import { Suspense } from "react";
import SearchBar from "@/components/ui/SearchBar";
import LocaleToggle from "./LocaleToggle";

// Mobile-only row under the header: search on the left, locale on the right.
// Lives in the layout rather than on the home page so search and language
// stay reachable on every page — on home it lands directly above the genre
// tabs, which is where it was asked for.
function MobileSearchRowInner() {
  return (
    <div
      className="md:hidden w-full px-6 py-3 flex items-center gap-3"
      style={{ borderBottom: "1px solid var(--border-subtle)" }}
    >
      <div className="flex-1 min-w-0">
        <SearchBar />
      </div>
      <LocaleToggle />
    </div>
  );
}

// SearchBar reads useSearchParams(), which needs a suspense boundary to
// avoid bailing out of static prerendering — same wrapper Header uses.
export default function MobileSearchRow() {
  return (
    <Suspense>
      <MobileSearchRowInner />
    </Suspense>
  );
}
