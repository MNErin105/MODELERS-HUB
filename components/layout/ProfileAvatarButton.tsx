"use client";

import UserAvatar from "@/components/ui/UserAvatar";
import { AuthUser } from "@/lib/context/AuthContext";

type Props = {
  user: AuthUser;
  size?: number;
  onClick: () => void;
};

// Opens the account dropdown (My Page / Sign out) instead of navigating —
// the header renders AvatarDropdown alongside it.
export default function ProfileAvatarButton({ user, size = 34, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Account menu"
      aria-haspopup="menu"
      className="block rounded-full overflow-hidden shrink-0 transition-all hover:opacity-80 hover:scale-105 active:scale-95"
      style={{
        width:  size,
        height: size,
        border: "2px solid var(--accent-muted)",
      }}
    >
      <UserAvatar src={user.avatarUrl} alt={user.name} fill />
    </button>
  );
}
