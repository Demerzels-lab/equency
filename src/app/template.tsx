// Re-mounts on every route change, so the enter animation replays per navigation → an app-like
// page transition. The nav/footer live in layout.tsx (outside this), so only the content moves.
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="route-enter">{children}</div>;
}
