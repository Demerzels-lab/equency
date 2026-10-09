import Image from "next/image";

/** EQUENCY mark (glass ribbon "E", public/logo-mark.png · cleaned from logo-equency.png) + wordmark. */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <Image
        src="/logo-mark.png"
        width={34}
        height={34}
        alt=""
        aria-hidden
        priority
        className="size-[34px] drop-shadow-[0_0_10px_color-mix(in_oklab,var(--color-core)_35%,transparent)]"
      />
      <span className="eyebrow text-[15px] font-bold tracking-[0.32em]">EQUENCY</span>
    </span>
  );
}
