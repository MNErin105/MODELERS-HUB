import { Post } from "@/lib/types";
import WorkGrid from "@/components/ui/WorkGrid";

type Props = { posts: Post[] };

export default function PopularSection({ posts }: Props) {
  const sorted = [...posts].sort((a, b) => b.saveCount - a.saveCount).slice(0, 8);

  return (
    <section className="w-full py-10 px-6 max-w-[1440px] mx-auto">
      <div className="flex items-baseline gap-4 mb-6">
        <h2 className="text-2xl font-bold tracking-wider"
          style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>
          POPULAR WORKS
        </h2>
        <span className="text-xs" style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
          sorted by saves
        </span>
      </div>
      <WorkGrid posts={sorted} />
    </section>
  );
}
