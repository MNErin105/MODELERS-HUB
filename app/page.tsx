import { Suspense } from "react";
import HomeContent from "@/components/sections/HomeContent";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  );
}
