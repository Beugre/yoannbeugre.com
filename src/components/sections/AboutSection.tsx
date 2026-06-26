"use client";
import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

const CAPSULES = [
  { id: "math", year: "2011", icon: "∑", label: "Mathématiques", color: "#facc15", detail: "14 ans de cours particuliers (3ème → L2). La rigueur mathématique est le fondement de tout ce que je construis : de l'analyse de séries temporelles aux modèles probabilistes." },
  { id: "dev", year: "2017", icon: "💻", label: "Développement", color: "#00d4ff", detail: "Full-Stack PHP, puis Node.js. Apprentissage des patterns d'architecture, des APIs REST, des bases de données relationnelles. Chaque bug est une leçon d'ingénierie." },
  { id: "lead", year: "2018", icon: "⚡", label: "Architecture & Lead", color: "#8b5cf6", detail: "Scrum Master → CTO Adjoint. Gestion d'équipes, choix technologiques, migration SAP S4, audit SOX. La complexité des systèmes d'entreprise affûte le raisonnement." },
  { id: "ai", year: "2023", icon: "🧠", label: "Intelligence Artificielle", color: "#10b981", detail: "LLM, LangChain, agents IA autonomes, Prompt Engineering. L'IA n'est pas magique : c'est de la mathématique appliquée à la statistique et à l'inférence." },
  { id: "quant", year: "2024", icon: "📈", label: "Trading Quantitatif", color: "#f97316", detail: "Bots Binance (RSI, Price Action, SL/TP adaptatif), algo paris sportifs (value bets, Kelly), Polymarket (marchés prédictifs DeFi). La finance est un problème d'optimisation." },
  { id: "sys", year: "Now", icon: "◈", label: "Architecte Systèmes", color: "#00d4ff", detail: "Aujourd'hui je conçois des systèmes qui pensent : qui analysent, décident et agissent en temps réel. L'objectif : automatiser l'intelligence." },
  { id: "life", year: "⚽", icon: "⚽", label: "Football & Voyages", color: "#f97316", detail: "Fan inconditionnel des Éléphants de Côte d'Ivoire. Le football m'a appris la stratégie, la rigueur collective et le dépassement de soi. Les voyages entre Bordeaux et Abidjan alimentent ma vision globale des systèmes — humains comme techniques." },
];

const STATS = [
  { value: "8+", label: "Ans d'expérience", color: "#00d4ff" },
  { value: "14", label: "Ans cours maths", color: "#facc15" },
  { value: "Bac+5", label: "Master MIAGE", color: "#8b5cf6" },
  { value: "∞", label: "Problèmes résolus", color: "#10b981" },
];

export default function AboutSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });
  const [open, setOpen] = useState<string | null>(null);

  return (
    <section id="about" className="relative py-16 md:py-32 px-4 md:px-6 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-950/5 to-transparent pointer-events-none" />

      <div ref={ref} className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div className="mb-14" initial={{ opacity: 0, y: 40 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7 }}>
          <div className="flex items-center gap-4 mb-3">
            <div className="glow-line w-12" />
            <span className="text-xs font-mono text-cyan-400 tracking-widest uppercase">01 / Memory Core</span>
          </div>
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-white/90 leading-tight">
            Les maths m&apos;ont appris à <span className="text-gradient-static">penser.</span><br />
            Le code à <span className="text-gradient-static">construire.</span><br />
            <span className="text-white/50">L&apos;IA à </span><span className="text-gradient-static">automatiser l&apos;intelligence.</span>
          </h2>
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-8 items-start">
          {/* Capsules timeline */}
          <div className="lg:col-span-3">
            <motion.div className="flex items-center gap-3 mb-6 text-xs font-mono text-white/30" initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}} transition={{ delay: 0.3 }}>
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              CLICK TO OPEN MEMORY CAPSULE
            </motion.div>

            <div className="space-y-3">
              {CAPSULES.map((c, i) => (
                <motion.div key={c.id} initial={{ opacity: 0, x: -30 }} animate={isInView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.5, delay: 0.1 + i * 0.08 }}>
                  <button
                    type="button"
                    onClick={() => setOpen(open === c.id ? null : c.id)}
                    style={{ cursor: "pointer", width: "100%" }}
                    className="w-full text-left glass rounded-xl border border-white/5 hover:border-white/15 transition-all duration-300 overflow-hidden"
                  >
                    {/* Header */}
                    <div className="flex items-center gap-4 p-4">
                      <div className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-xl font-bold border border-white/10" style={{ background: `${c.color}15`, borderColor: `${c.color}30`, color: c.color }}>
                        {c.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white/85">{c.label}</span>
                          <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: `${c.color}15`, color: c.color }}>{c.year}</span>
                        </div>
                        <div className="text-xs text-white/30 font-mono mt-0.5 truncate">
                          {open === c.id ? "— MEMORY UNLOCKED —" : c.detail.slice(0, 55) + "…"}
                        </div>
                      </div>
                      <div className="flex-shrink-0 text-white/25 font-mono text-sm">{open === c.id ? "▲" : "▼"}</div>
                    </div>

                    {/* Expanded */}
                    {open === c.id && (
                      <div className="px-4 pb-4 pt-0 border-t border-white/5">
                        <div className="flex items-start gap-3">
                          <div className="w-0.5 h-full rounded-full self-stretch mt-1 flex-shrink-0" style={{ background: `linear-gradient(180deg, ${c.color}60, transparent)`, minHeight: 40 }} />
                          <p className="text-sm text-white/60 leading-relaxed">{c.detail}</p>
                        </div>
                      </div>
                    )}
                  </button>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right: code + stats */}
          <div className="lg:col-span-2 space-y-5">
            {/* Code snippet */}
            <motion.div className="glass rounded-xl p-4 font-mono text-sm border border-white/5" initial={{ opacity: 0, y: 30 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.5 }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
                <span className="ml-2 text-white/20 text-xs">yoann_core.py</span>
              </div>
              <div className="space-y-0.5 text-xs">
                <div><span className="text-violet-400">class </span><span className="text-cyan-400">YoannCore</span><span className="text-white/50">:</span></div>
                <div className="pl-4"><span className="text-violet-400">def </span><span className="text-yellow-400">__init__</span><span className="text-white/50">(self):</span></div>
                <div className="pl-8 text-white/40">self.education = <span className="text-yellow-300">&quot;Master MIAGE · Bordeaux&quot;</span></div>
                <div className="pl-8 text-white/40">self.teaching = <span className="text-emerald-400">&quot;Maths 3ème→L2 (2011-2025)&quot;</span></div>
                <div className="pl-8 text-white/40">self.stack = [<span className="text-cyan-400">&quot;Python&quot;</span>, <span className="text-cyan-400">&quot;AI&quot;</span>, <span className="text-cyan-400">&quot;Quant&quot;</span>]</div>
                <div className="pl-8 text-white/40">self.status = <span className="text-violet-400">&quot;building intelligent systems&quot;</span></div>
                <div className="pl-8 text-white/40">self.football = <span className="text-orange-400">&quot;⚽Éléphants CI &amp; travels&quot;</span></div>
                <div className="mt-2"><span className="text-violet-400">def </span><span className="text-yellow-400">think</span><span className="text-white/50">(self, problem):</span></div>
                <div className="pl-4 text-white/40"><span className="text-green-400"># Math → Algo → Code → System</span></div>
                <div className="pl-4 text-white/40"><span className="text-violet-400">return</span> self.solve(problem)</div>
              </div>
            </motion.div>

            {/* Stats */}
            <motion.div className="grid grid-cols-2 gap-3" initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.65 }}>
              {STATS.map((s) => (
                <div key={s.label} className="glass rounded-xl p-4 text-center border border-white/5">
                  <div className="text-2xl font-black mb-1" style={{ color: s.color }}>{s.value}</div>
                  <div className="text-[10px] text-white/35 leading-tight">{s.label}</div>
                </div>
              ))}
            </motion.div>

            {/* Progression bar */}
            <motion.div className="glass rounded-xl p-4 border border-cyan-400/10" initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}} transition={{ delay: 0.8 }}>
              <div className="text-xs font-mono text-cyan-400/70 mb-3">EXPERTISE PROGRESSION</div>
              {[["Algorithmique", 95], ["Python / AI", 92], ["SQL / Data", 90], ["Trading Quant", 85], ["IA / LLM", 82]].map(([l, v]) => (
                <div key={String(l)} className="mb-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-white/50 font-mono">{l}</span>
                    <span className="text-white/30 font-mono">{v}%</span>
                  </div>
                  <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <motion.div className="h-full rounded-full" style={{ background: "linear-gradient(90deg,#00d4ff,#8b5cf6)" }}
                      initial={{ width: 0 }} animate={isInView ? { width: `${v}%` } : {}} transition={{ duration: 1.2, delay: 0.8, ease: "easeOut" }} />
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
