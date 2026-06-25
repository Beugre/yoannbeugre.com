"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

function useLivePnL() {
  const [pnl, setPnl] = useState(0);
  const [trades, setTrades] = useState(0);
  const [equity, setEquity] = useState<number[]>([10000]);
  const [running, setRunning] = useState(true);

  useEffect(() => {
    let capital = 10000;
    let tradeCount = 0;
    const iv = setInterval(() => {
      // Simulate an RSI trade outcome
      const win = Math.random() < 0.62; // 62% win rate
      const pct = win ? (Math.random() * 0.018 + 0.003) : -(Math.random() * 0.012 + 0.002);
      capital = Math.max(0, capital * (1 + pct));
      tradeCount++;
      setPnl(capital - 10000);
      setTrades(tradeCount);
      setEquity(prev => [...prev.slice(-60), capital]);
    }, 800 + Math.random() * 400);

    return () => clearInterval(iv);
  }, []);

  return { pnl, trades, equity, running };
}

function MiniEquityCurve({ equity }: { equity: number[] }) {
  if (equity.length < 2) return null;
  const min = Math.min(...equity) * 0.998;
  const max = Math.max(...equity) * 1.002;
  const rng = max - min || 1;
  const W = 120, H = 32;
  const px = (i: number) => (i / (equity.length - 1)) * W;
  const py = (v: number) => H - ((v - min) / rng) * H;
  let d = `M${px(0)},${py(equity[0])}`;
  for (let i = 1; i < equity.length; i++) {
    const cpx = (px(i - 1) + px(i)) / 2;
    d += ` C${cpx},${py(equity[i-1])} ${cpx},${py(equity[i])} ${px(i)},${py(equity[i])}`;
  }
  const up = equity[equity.length - 1] >= equity[0];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: 120, height: 32, flexShrink: 0 }}>
      <defs>
        <linearGradient id="pnlgrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={up ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"} />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </linearGradient>
      </defs>
      <path d={d + ` L${W},${H} L0,${H} Z`} fill="url(#pnlgrad)" />
      <path d={d} fill="none" stroke={up ? "#10b981" : "#ef4444"} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export default function LivePnLSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: false, amount: 0.3 });
  const { pnl, trades, equity } = useLivePnL();
  const up = pnl >= 0;

  const STATS = [
    { label: "Win Rate", value: "62%", color: "#10b981", sub: "RSI strategy" },
    { label: "Trades exécutés", value: String(trades), color: "#00d4ff", sub: "session live" },
    { label: "Max Drawdown", value: "−4.2%", color: "#f59e0b", sub: "risk managed" },
    { label: "Profit Factor", value: "1.95×", color: "#8b5cf6", sub: "backtest" },
  ];

  return (
    <section id="live-pnl" className="relative py-16 px-6 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-950/5 to-transparent pointer-events-none" />
      <div ref={ref} className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div className="mb-8 text-center" initial={{ opacity: 0, y: 30 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}>
          <div className="flex items-center justify-center gap-4 mb-3">
            <div className="glow-line w-12" />
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-mono text-emerald-400 tracking-widest uppercase">Bot Live Simulation</span>
            </div>
            <div className="glow-line w-12" />
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-white/90">
            Mon algorithme, <span className="text-gradient-static">en ce moment même</span>
          </h2>
          <p className="text-white/40 text-sm mt-2 font-mono">Simulation temps réel · Stratégie RSI + Price Action</p>
        </motion.div>

        {/* Main PnL card */}
        <motion.div
          className="glass rounded-2xl border overflow-hidden mb-6"
          style={{ borderColor: up ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)" }}
          initial={{ opacity: 0, scale: 0.95 }} animate={isInView ? { opacity: 1, scale: 1 } : {}} transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-4 px-6 py-4 border-b border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-mono text-white/50 tracking-widest">YOANN QUANT BOT · BTC/USDT · RSI STRATEGY</span>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <span className="text-[10px] font-mono text-white/30">Capital initial: $10,000</span>
              <MiniEquityCurve equity={equity} />
            </div>
          </div>

          <div className="flex items-center justify-between px-6 py-5">
            <div>
              <div className="text-xs font-mono text-white/35 mb-1">P&L LIVE</div>
              <motion.div
                className="text-5xl font-black font-mono tabular-nums"
                style={{ color: up ? "#10b981" : "#ef4444" }}
                key={Math.round(pnl)}
                animate={{ scale: [1, 1.03, 1] }}
                transition={{ duration: 0.2 }}
              >
                {up ? "+" : ""}${Math.abs(pnl).toFixed(2)}
              </motion.div>
              <div className="text-sm font-mono mt-1" style={{ color: up ? "rgba(16,185,129,0.6)" : "rgba(239,68,68,0.6)" }}>
                {up ? "+" : ""}{((pnl / 10000) * 100).toFixed(3)}%
              </div>
            </div>

            {/* Live trade feed */}
            <div className="hidden md:block">
              <div className="text-[10px] font-mono text-white/25 mb-2">DERNIERS SIGNAUX</div>
              <div className="space-y-1">
                {Array.from({ length: 4 }).map((_, i) => {
                  const idx = Math.max(0, equity.length - 1 - i);
                  const prev = equity[idx - 1] || equity[0];
                  const cur = equity[idx];
                  const win = cur >= prev;
                  return (
                    <div key={i} className="flex items-center gap-3 text-[10px] font-mono">
                      <span className={win ? "text-emerald-400" : "text-red-400"}>{win ? "▲ BUY" : "▼ SELL"}</span>
                      <span className="text-white/25">BTC/USDT</span>
                      <span style={{ color: win ? "#10b981" : "#ef4444" }}>{win ? "+" : ""}{((cur - prev) / prev * 100).toFixed(3)}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS.map((s, i) => (
            <motion.div key={s.label} className="glass rounded-xl p-4 border border-white/5" initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.3 + i * 0.07 }}>
              <div className="text-[10px] font-mono text-white/30 mb-1">{s.label}</div>
              <div className="text-2xl font-black" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[10px] text-white/25 font-mono mt-0.5">{s.sub}</div>
            </motion.div>
          ))}
        </div>

        <motion.p className="text-center text-xs font-mono text-white/20 mt-6" initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}} transition={{ delay: 0.8 }}>
          Simulation — les performances réelles varient · Stratégie RSI(14) + Price Action adaptative
        </motion.p>
      </div>
    </section>
  );
}
