/** Full-screen film grain. Kills gradient banding on dark surfaces and adds premium texture.
 *  Static SVG noise (no asset, no JS), fixed + pointer-events-none, blended very subtly. */
export function GrainOverlay() {
  const noise =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E";
  // NOTE: plain alpha compositing (no mix-blend). A mix-blend-mode layer forces the browser to
  // re-blend against the animating WebGL canvas every frame, which flickers on some GPUs/drivers.
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[60] opacity-[0.025]"
      style={{ backgroundImage: `url("${noise}")`, backgroundSize: "160px 160px" }}
    />
  );
}
