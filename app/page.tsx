import { Suspense } from "react";
import HomeContent from "@/components/sections/HomeContent";
import { getPostsForHome } from "@/lib/supabase/queries";
import type { Post } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Home() {
  let initialPosts: Post[] = [];
  try {
    initialPosts = await getPostsForHome(200);
  } catch {
    // server fetch failed; client renders with empty list
  }
  return (
    <Suspense>
      <HomeContent initialPosts={initialPosts} />
    </Suspense>
  );
}
