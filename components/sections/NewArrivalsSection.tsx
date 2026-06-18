import { Post } from "@/lib/types";
import WorkGrid from "@/components/ui/WorkGrid";

type Props = { posts: Post[] };

export default function NewArrivalsSection({ posts }: Props) {
  const sorted = [...posts]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8);

  return (
    <section
      className="w-full py-10 px-6 max-w-[1440px] mx-auto"
      style={{ borderTop: "1px solid var(--border-subtle)" }}
    >
      <div className="flex items-baseline gap-4 mb-6">
        <h2 className="text-2xl font-bold tracking-wider"
          style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>
          NEW ARRIVALS
        </h2>
        <span className="text-xs" style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
          latest posts
        </span>
      </div>
      <WorkGrid posts={sorted} />
    </section>
  );
}
