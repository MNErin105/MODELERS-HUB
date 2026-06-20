"use client";

import { useState } from "react";
import { User } from "lucide-react";

type Props = {
  src: string;
  alt: string;
  /** Fixed pixel size — omit when using fill mode */
  size?: number;
  /** Stretch to fill parent container (parent must be relative + overflow-hidden) */
  fill?: boolean;
  className?: string;
};

/**
 * User avatar with a graceful fallback to a User icon.
 * Uses a plain <img> (not next/image) to avoid remotePatterns restrictions
 * and to support onError for missing Supabase Storage objects.
 */
export default function UserAvatar({ src, alt, size, fill = false, className = "" }: Props) {
  const [error, setError] = useState(false);

  const sizeStyle = size ? { width: size, height: size } : undefined;
  const fillClass = fill ? "w-full h-full" : "";

  if (!src || error) {
    const iconSize = size ? Math.round(size * 0.45) : 20;
    return (
      <span
        className={`flex items-center justify-center ${fillClass} ${className}`}
        style={{ background: "var(--bg-tertiary)", ...sizeStyle }}
        aria-label={alt}
      >
        <User size={iconSize} style={{ color: "var(--text-muted)" }} />
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={`object-cover ${fillClass} ${className}`}
      style={sizeStyle}
      onError={() => setError(true)}
    />
  );
}
