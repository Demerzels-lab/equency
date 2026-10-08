import Link from "next/link";
import clsx from "clsx";
import type { Accent } from "@/lib/site";

type Props = {
  href: string;
  children: React.ReactNode;
  accent?: Accent | "ink";
  variant?: "solid" | "outline";
  size?: "sm" | "md";
  className?: string;
};

const SOLID: Record<NonNullable<Props["accent"]>, string> = {
  core: "bg-core text-white ring-core hover:bg-core/85 hover:shadow-[0_10px_30px_-10px_var(--color-core)]",
  strategy: "bg-strategy text-white ring-strategy hover:bg-strategy/85 hover:shadow-[0_10px_30px_-10px_var(--color-strategy)]",
  ink: "bg-ink text-paper ring-ink hover:bg-white",
};

const OUTLINE: Record<NonNullable<Props["accent"]>, string> = {
  core: "text-ink ring-core hover:bg-core/10",
  strategy: "text-ink ring-strategy hover:bg-strategy/10",
  ink: "text-ink ring-line-2 hover:bg-ink/5",
};

/** Reference-style CTA: 4px radius, 1px ring, accent-coded per product. */
export function Btn({ href, children, accent = "core", variant = "outline", size = "md", className }: Props) {
  return (
    <Link
      href={href}
      className={clsx(
        "inline-flex items-center justify-center whitespace-nowrap rounded text-center ring-1 ring-inset transition-[background-color,box-shadow,transform] duration-200 active:scale-[0.98]",
        size === "md" ? "px-6 py-3 text-base" : "px-4 py-2 text-sm",
        variant === "solid" ? SOLID[accent] : OUTLINE[accent],
        className,
      )}
    >
      {children}
    </Link>
  );
}
