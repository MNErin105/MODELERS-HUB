type Props = {
  label: string;
  onClick?: () => void;
  size?: "sm" | "md";
};

export default function TagBadge({ label, onClick, size = "sm" }: Props) {
  const base =
    "inline-block rounded font-medium transition-opacity hover:opacity-80";
  const sm = "px-2 py-0.5 text-xs";
  const md = "px-3 py-1 text-sm";

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={`${base} ${size === "md" ? md : sm} cursor-pointer`}
        style={{ background: "var(--color-tag)", color: "var(--color-tag-text)" }}
        aria-label={`Filter by ${label}`}
      >
        {label}
      </button>
    );
  }

  return (
    <span
      className={`${base} ${size === "md" ? md : sm}`}
      style={{ background: "var(--color-tag)", color: "var(--color-tag-text)" }}
    >
      {label}
    </span>
  );
}
