import { useLanguage } from "../i18n/LanguageContext";

/**
 * LanguageToggle — compact EN / 中 segmented switch. Default is English; the
 * choice is persisted via LanguageProvider. Designed to sit in the navbar.
 */
export default function LanguageToggle({ className = "" }: { className?: string }) {
  const { lang, setLang } = useLanguage();

  return (
    <div
      role="group"
      aria-label="Language"
      className={`relative inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] p-0.5 ${className}`}
    >
      {/* sliding indicator */}
      <span
        aria-hidden
        className="absolute top-0.5 bottom-0.5 w-[calc(50%-2px)] rounded-full bg-gradient-to-r from-accent-cyan/25 to-accent-violet/25 ring-1 ring-accent-cyan/40 transition-transform duration-300 ease-out"
        style={{ transform: lang === "zh" ? "translateX(100%)" : "translateX(0)" }}
      />
      <button
        type="button"
        onClick={() => setLang("en")}
        aria-pressed={lang === "en"}
        className={`relative z-10 w-9 rounded-full py-1 text-center font-mono text-[11px] tracking-wide transition-colors ${
          lang === "en" ? "text-white" : "text-accent-silver/50 hover:text-accent-silver/80"
        }`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLang("zh")}
        aria-pressed={lang === "zh"}
        className={`relative z-10 w-9 rounded-full py-1 text-center text-[12px] tracking-wide transition-colors ${
          lang === "zh" ? "text-white" : "text-accent-silver/50 hover:text-accent-silver/80"
        }`}
      >
        中
      </button>
    </div>
  );
}
