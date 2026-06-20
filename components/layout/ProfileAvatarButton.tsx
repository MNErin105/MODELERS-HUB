"use client";

import Link from "next/link";
import UserAvatar from "@/components/ui/UserAvatar";
import { AuthUser } from "@/lib/context/AuthContext";

type Props = {
  user: AuthUser;
  size?: number;
  // Future: onMenuOpen?: () => void  (for dropdown)
};

export default function ProfileAvatarButton({ user, size = 34 }: Props) {
  return (
    <Link
      href="/mypage"
      aria-label="My Page"
      className="block rounded-full overflow-hidden shrink-0 transition-all hover:opacity-80 hover:scale-105 active:scale-95"
      style={{
        width:  size,
        height: size,
        border: "2px solid var(--accent-muted)",
      }}
    >
      <UserAvatar src={user.avatarUrl} alt={user.name} fill />
    </Link>
  );
}
