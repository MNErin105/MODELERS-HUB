import { Suspense } from "react";
import HomeContent from "@/components/sections/HomeContent";

export default function Home() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  );
}
