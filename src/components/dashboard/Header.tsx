import Image from "next/image";

export default function Header() {
  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5 sm:pb-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-2xl bg-slate-900/90 border border-cyan-400/20 flex items-center justify-center shadow-[0_0_25px_rgba(34,211,238,0.12)] overflow-hidden">
          <Image
            src="/logo.png"
            alt="HookFlow"
            width={52}
            height={52}
            priority
            className="h-10 sm:h-12 w-auto object-contain"
          />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
            Hook<span className="text-cyan-300">Flow</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Pengelolaan webhook yang aman, terukur, dan mudah dipantau.
          </p>
        </div>
      </div>
    </header>
  );
}
