/**
 * SectionDivider — a faint holographic separator line with a centered node.
 * Purely decorative; keeps the long scroll feeling composed and "lab"-like.
 */
export default function SectionDivider() {
  return (
    <div className="container-lab" aria-hidden="true">
      <div className="relative flex items-center justify-center">
        <span className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <span className="absolute h-1.5 w-1.5 rotate-45 border border-accent-cyan/40 bg-void-900" />
      </div>
    </div>
  );
}
