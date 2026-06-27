"use client";

import { useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import UserAvatar from "@/components/ui/UserAvatar";
import { Story } from "@/lib/types";
import { getActiveStories } from "@/lib/supabase/storiesQueries";
import { useAuth } from "@/lib/context/AuthContext";

type Props = {
  onStoryClick: (stories: Story[], startIndex: number) => void;
  onAddStory: () => void;
  refreshKey?: number;
};

export default function StoryBar({ onStoryClick, onAddStory, refreshKey = 0 }: Props) {
  const t = useTranslations("story");
  const { user } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getActiveStories().then((fetched) => {
      console.log(
        `[StoryBar] ${fetched.length} active stories:`,
        fetched.map((s) => ({ id: s.id, userId: s.userId, author: s.author.name })),
      );
      setStories(fetched);
    });
  }, [refreshKey]);

  // Group stories: current user first, then others grouped by user
  const myStory = user ? stories.find((s) => s.userId === user.id) ?? null : null;
  const othersMap = new Map<string, Story>();
  for (const s of stories) {
    if (s.userId === user?.id) continue;
    if (!othersMap.has(s.userId)) othersMap.set(s.userId, s);
  }
  const otherStories = Array.from(othersMap.values());

  return (
    <div
      className="w-full overflow-x-auto"
      style={{ borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-primary)" }}
    >
      <div
        ref={scrollRef}
        className="flex gap-4 px-4 py-3"
        style={{ width: "max-content" }}
      >
        {/* Add / My Story slot */}
        <StorySlot
          label={myStory ? t("myStory") : t("addStory")}
          avatarUrl={user?.avatarUrl ?? null}
          userName={user?.name ?? ""}
          hasStory={!!myStory}
          isOwn
          onClick={() => {
            if (myStory) {
              const myAll = stories.filter((s) => s.userId === user?.id);
              onStoryClick(myAll, 0);
            } else {
              onAddStory();
            }
          }}
          showAdd={!myStory}
        />

        {/* Other users */}
        {otherStories.map((s) => {
          const userStories = stories.filter((st) => st.userId === s.userId);
          return (
            <StorySlot
              key={s.userId}
              label={s.author.name}
              avatarUrl={s.author.avatarUrl}
              userName={s.author.name}
              hasStory
              isOwn={false}
              onClick={() => onStoryClick(userStories, 0)}
              showAdd={false}
            />
          );
        })}
      </div>
    </div>
  );
}

type SlotProps = {
  label: string;
  avatarUrl: string | null;
  userName: string;
  hasStory: boolean;
  isOwn: boolean;
  onClick: () => void;
  showAdd: boolean;
};

function StorySlot({ label, avatarUrl, hasStory, onClick, showAdd }: SlotProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 shrink-0"
      style={{ width: 64 }}
    >
      <div className="relative">
        <div
          className="w-14 h-14 rounded-full overflow-hidden"
          style={{
            padding: hasStory ? 2 : 0,
            background: hasStory
              ? "linear-gradient(135deg, var(--accent-primary), #a855f7)"
              : "var(--bg-tertiary)",
          }}
        >
          <div
            className="w-full h-full rounded-full overflow-hidden"
            style={{ border: "2px solid var(--bg-primary)" }}
          >
            <UserAvatar src={avatarUrl ?? ""} alt={label} fill />
          </div>
        </div>

        {showAdd && (
          <span
            className="absolute bottom-0 right-0 w-5 h-5 rounded-full flex items-center justify-center"
            style={{ background: "var(--accent-primary)", border: "2px solid var(--bg-primary)" }}
          >
            <Plus size={11} color="var(--bg-primary)" strokeWidth={3} />
          </span>
        )}
      </div>

      <span
        className="text-[10px] text-center leading-tight line-clamp-2"
        style={{ color: "var(--text-secondary)", maxWidth: 60 }}
      >
        {label}
      </span>
    </button>
  );
}
