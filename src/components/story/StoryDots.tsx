"use client";

export interface ChapterDef {
  id: string;
  label: string;
}

const CHAPTERS: ChapterDef[] = [
  { id: "top", label: "Start" },
  { id: "observe", label: "Observe" },
  { id: "strategies", label: "Strategies" },
  { id: "vault", label: "Vault" },
  { id: "honesty", label: "Honesty" },
  { id: "build", label: "Build" },
];

export function StoryDots({
  activeIndex = 0,
  onSelect,
}: {
  activeIndex: number;
  onSelect?: (id: string) => void;
}) {
  const scrollTo = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    onSelect?.(id);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <nav className="story-dots" aria-label="Chapters">
      {CHAPTERS.map((ch, idx) => {
        const isActive = activeIndex === idx;
        return (
          <a
            key={ch.id}
            href={`#${ch.id}`}
            onClick={(e) => scrollTo(ch.id, e)}
            aria-label={ch.label}
            aria-current={isActive ? "step" : undefined}
          >
            <span>{ch.label}</span>
            <i />
          </a>
        );
      })}
    </nav>
  );
}
