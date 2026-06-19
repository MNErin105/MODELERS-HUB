"use client";

import Image from "next/image";
import Link from "next/link";
import { AuthUser } from "@/lib/context/AuthContext";

type Props = {
  user: AuthUser;
  size?: number;
  // Future: onMenuOpen?: () => void  (for dropdown)
};

/**
 * Circular profile avatar in the header.
 * Currently navigates directly to /mypage on click.
 * Structured for future dropdown expansion (wrap in relative div, add dropdown sibling).
 */
export default function ProfileAvatarButton({ user, size = 34 }: Props) {
  const avatarSrc = user.avatarUrl || `https://picsum.photos/seed/${encodeURIComponent(user.id)}/68/68`;

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
      <Image
        src={avatarSrc}
        alt={user.name}
        width={size}
        height={size}
        className="object-cover w-full h-full"
        unoptimized
      />
    </Link>
  );
}
