"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { unlockAchievement } from "@/lib/achievements";

const BOOT_LINES = [
  { text: "YOANN CORE v1.0 — Quant AI System", style: "text-cyan-400 font-bold text-base", delay: 0 },
  { text: "Status: ONLINE", style: "text-emerald-400", delay: 300 },
  { text: "", delay: 500 },
  { text: "> initialize_candidate()", style: "text-white/50", delay: 700 },
  { text: "  [OK] Candidate profile loaded — YOANN BEUGRÉ", style: "text-green-400/70", delay: 950 },
  { text: "> load_memory()", style: "text-white/50", delay: 1200 },
  { text: "  [OK] 14 years mathematics teaching loaded", style: "text-green-400/70", delay: 1400 },
  { text: "  [OK] Master MIAGE — Bordeaux University", style: "text-green-400/70", delay: 1550 },
  { text: "> start_trading_engine()", style: "text-white/50", delay: 1750 },
  { text: "  [OK] Binance API connected", style: "text-green-400/70", delay: 1950 },
  { text: "  [OK] RSI + Momentum strategy active", style: "text-green-400/70", delay: 2100 },
  { text: "  [OK] Risk management: SL/TP adaptive", style: "text-green-400/70", delay: 2250 },
  { text: "> connect_ai_agents()", style: "text-white/50", delay: 2450 },
  { text: "  [OK] LLM engine ready — GPT-4o-mini", style: "text-green-400/70", delay: 2650 },
  { text: "  [OK] 5 autonomous agents deployed", style: "text-green-400/70", delay: 2800 },
  { text: "> scan_projects()", style: "text-white/50", delay: 3000 },
  { text: "  [ACTIVE] Crypto Trading Bot — Binance", style: "text-violet-300", delay: 3200 },
  { text: "  [ACTIVE] Sports Betting Algo — Value Bets", style: "text-violet-300", delay: 3350 },
  { text: "  [ACTIVE] Polymarket Analyzer — DeFi", style: "text-violet-300", delay: 3500 },
  { text: "  [ACTIVE] AI Agents — LangChain", style: "text-violet-300", delay: 3650 },
  { text: "> unlock_portfolio()", style: "text-white/50", delay: 3850 },
  { text: "  ██████████████████████████ 100%", style: "text-cyan-400", delay: 4100 },
  { text: "", delay: 4250 },
  { text: "✓ ACCESS GRANTED. Welcome to YOANN CORE.", style: "text-emerald-400 font-bold", delay: 4350 },
  { text: "", delay: 4500 },
  { text: "MISSION: Explore the system. Unlock all modules. Challenge the AI.", style: "text-white/50 text-xs", delay: 4600 },
  { text: "", delay: 4750 },
  { text: "[ ENTER SYSTEM ]", style: "text-cyan-400 animate-pulse font-bold text-base", delay: 4900 },
];

export default function BootScreen() {
  const [visible, setVisible] = useState<number[]>([]);
  const [done, setDone] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("boot_seen")) return;
    setShow(true);

    BOOT_LINES.forEach((line, i) => {
      setTimeout(() => {
        setVisible(prev => [...prev, i]);
        if (i === BOOT_LINES.length - 1) setDone(true);
      }, line.delay);
    });
  }, []);

  useEffect(() => {
    if (!done) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Enter") dismiss(); };
    window.addEventListener("keydown", h);
    const t = setTimeout(dismiss, 2500);
    return () => { window.removeEventListener("keydown", h); clearTimeout(t); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  const dismiss = () => {
    if (exiting) return;
    setExiting(true);
    sessionStorage.setItem("boot_seen", "1");
    unlockAchievement("BOOT");
    setTimeout(() => setShow(false), 700);
  };

  if (!show) return null;

  return (
    <AnimatePresence>
      {!exiting && (
        <motion.div
          className="fixed inset-0 z-[300] bg-black overflow-hidden"
          onClick={done ? dismiss : undefined}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          style={exiting ? { pointerEvents: "none" } : {}}
        >
          {/* CRT scanlines */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.07]" style={{ background: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,255,70,0.15) 2px,rgba(0,255,70,0.15) 4px)" }} />

          {/* Vignette */}
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 90% 90% at 50% 50%, transparent 50%, rgba(0,0,0,0.7))" }} />

          {/* Corner decorations */}
          <div className="absolute top-4 left-4 text-[10px] font-mono text-green-400/30">YOANN.CORE.SYS</div>
          <div className="absolute top-4 right-4 text-[10px] font-mono text-green-400/30">BOOT.SEQ.v1.0</div>
          <div className="absolute bottom-4 left-4 text-[10px] font-mono text-green-400/20">MEM:OK CPU:OK NET:OK</div>
          <div className="absolute bottom-4 right-4 text-[10px] font-mono text-green-400/20">SYS.READY</div>

          {/* Terminal */}
          <div className="relative z-10 p-8 md:p-16 max-w-3xl w-full mt-6 md:mt-10">
            <div className="font-mono text-sm space-y-0.5">
              {BOOT_LINES.map((line, i) =>
                visible.includes(i) ? (
                  <motion.div key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.06 }} className={line.style ?? "text-green-400/80"}>
                    {line.text || "\u00a0"}
                  </motion.div>
                ) : null
              )}
              {visible.length > 0 && !done && (
                <motion.span className="inline-block w-2 h-4 bg-green-400 align-middle" animate={{ opacity: [1, 0] }} transition={{ duration: 0.5, repeat: Infinity }} />
              )}
            </div>
          </div>

          {done && (
            <motion.div className="absolute inset-x-0 bottom-16 flex justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
              <button onClick={(e) => { e.stopPropagation(); dismiss(); }} type="button"
                style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 10, padding: "14px 40px", borderRadius: 14, fontWeight: 900, fontSize: 16, color: "#000", background: "linear-gradient(135deg,#00d4ff,#8b5cf6)", border: "none" }}>
                ⚡ ENTER SYSTEM
              </button>
            </motion.div>
          )}

          <button className="absolute top-4 right-16 text-xs font-mono text-white/20 hover:text-white/50 transition-colors z-20" onClick={dismiss} type="button">SKIP →</button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
