"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { unlockAchievement } from "@/lib/achievements";

const ROUNDS = 8;
const HISTORY = 24;

function aiDec(prices: number[], idx: number): "BUY" | "SELL" | "HOLD" {
    if (idx < 3) return "HOLD";
    const fast = prices[idx] - prices[idx - 2];
    const slow = prices[idx] - prices[idx - Math.min(5, idx)];
    if (fast > 0 && slow > 0) return "BUY";
    if (fast < 0 && slow < 0) return "SELL";
    return "HOLD";
}

function fmt(n: number) {
    return n.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

type Dec = "BUY" | "SELL" | "HOLD";
type Phase = "intro" | "loading" | "playing" | "result";

interface Candle { t: number; o: number; h: number; l: number; c: number; v: number; }
interface GS {
    candles: Candle[]; cursor: number; round: number;
    portfolio: number; aiPortfolio: number; position: "none" | "long";
    entryPrice: number;
    history: { dec: Dec; pct: number; price: number }[];
}

function CandleChart({ candles, cursor }: { candles: Candle[]; cursor: number }) {
    const slice = candles.slice(Math.max(0, cursor - HISTORY), cursor + 1);
    if (slice.length < 2) return null;

    const W = 600, H = 160, PL = 48, PR = 8, PT = 12, PB = 20;
    const IW = W - PL - PR, IH = H - PT - PB;
    const allLows = slice.map(c => c.l), allHighs = slice.map(c => c.h);
    const minP = Math.min(...allLows) * 0.9995, maxP = Math.max(...allHighs) * 1.0005;
    const range = maxP - minP;

    const px = (i: number) => PL + (i / (slice.length - 1)) * IW;
    const py = (p: number) => PT + IH - ((p - minP) / range) * IH;

    const candleW = Math.max(2, (IW / slice.length) * 0.6);
    const last = slice[slice.length - 1];
    const first = slice[0];
    const up = last.c >= first.c;

    // Close price line for AI algo
    let closeLine = `M${px(0)},${py(slice[0].c)}`;
    for (let i = 1; i < slice.length; i++) {
        closeLine += ` L${px(i)},${py(slice[i].c)}`;
    }

    // Price labels
    const priceTicks = [0.25, 0.5, 0.75].map(r => minP + r * range);

    return (
        <div className="relative">
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 160 }} preserveAspectRatio="none">
                <defs>
                    <linearGradient id="gUp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgba(16,185,129,0.15)" />
                        <stop offset="100%" stopColor="rgba(16,185,129,0)" />
                    </linearGradient>
                    <linearGradient id="gDown" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgba(239,68,68,0.15)" />
                        <stop offset="100%" stopColor="rgba(239,68,68,0)" />
                    </linearGradient>
                    <filter id="glow2"><feGaussianBlur stdDeviation="2" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                </defs>

                {/* Grid lines */}
                {priceTicks.map((p, i) => (
                    <g key={i}>
                        <line x1={PL} y1={py(p)} x2={W - PR} y2={py(p)} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                        <text x={PL - 4} y={py(p) + 3} textAnchor="end" fill="rgba(255,255,255,0.2)" fontSize="8" fontFamily="monospace">
                            {(p / 1000).toFixed(1)}k
                        </text>
                    </g>
                ))}

                {/* Candles */}
                {slice.map((c, i) => {
                    const x = px(i);
                    const isUp = c.c >= c.o;
                    const col = isUp ? "#10b981" : "#ef4444";
                    const bodyTop = py(Math.max(c.o, c.c));
                    const bodyH = Math.max(1, Math.abs(py(c.o) - py(c.c)));
                    const isCurrent = i === slice.length - 1;
                    return (
                        <g key={i} opacity={isCurrent ? 1 : 0.85}>
                            {/* Wick */}
                            <line x1={x} y1={py(c.h)} x2={x} y2={py(c.l)} stroke={col} strokeWidth={isCurrent ? 1.5 : 1} opacity={0.6} />
                            {/* Body */}
                            <rect
                                x={x - candleW / 2} y={bodyTop}
                                width={candleW} height={bodyH}
                                fill={col}
                                opacity={isCurrent ? 1 : isUp ? 0.7 : 0.6}
                                rx="0.5"
                                filter={isCurrent ? "url(#glow2)" : undefined}
                            />
                        </g>
                    );
                })}

                {/* Current price line */}
                <line x1={PL} y1={py(last.c)} x2={W - PR} y2={py(last.c)}
                    stroke={up ? "rgba(16,185,129,0.4)" : "rgba(239,68,68,0.4)"}
                    strokeWidth="1" strokeDasharray="4,3" />

                {/* Price tag */}
                <rect x={W - PR - 38} y={py(last.c) - 8} width={40} height={16} rx="3"
                    fill={up ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}
                    stroke={up ? "rgba(16,185,129,0.5)" : "rgba(239,68,68,0.5)"} strokeWidth="0.5" />
                <text x={W - PR - 18} y={py(last.c) + 4} textAnchor="middle"
                    fill={up ? "#10b981" : "#ef4444"} fontSize="7.5" fontFamily="monospace" fontWeight="bold">
                    {(last.c / 1000).toFixed(2)}k
                </text>

                {/* Pulsing dot on last candle */}
                <circle cx={px(slice.length - 1)} cy={py(last.c)} r="3" fill={up ? "#10b981" : "#ef4444"} filter="url(#glow2)">
                    <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" />
                </circle>
            </svg>
        </div>
    );
}

export default function TradeGame() {
    const [phase, setPhase] = useState<Phase>("intro");
    const [, tick] = useState(0);
    const [fb, setFb] = useState<{ text: string; good: boolean } | null>(null);
    const [symbol] = useState("BTCUSDT");

    const gs = useRef<GS>({
        candles: [], cursor: HISTORY, round: 0,
        portfolio: 10000, aiPortfolio: 10000,
        position: "none", entryPrice: 0, history: []
    });

    const redraw = () => tick(n => n + 1);

    const fetchCandles = async (): Promise<Candle[]> => {
        try {
            const res = await fetch(
                `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=5m&limit=${HISTORY + ROUNDS + 4}`,
                { cache: "no-store" }
            );
            if (!res.ok) throw new Error("API error");
            const data = await res.json();
            return data.map((k: unknown[]) => ({
                t: Number(k[0]), o: parseFloat(String(k[1])),
                h: parseFloat(String(k[2])), l: parseFloat(String(k[3])),
                c: parseFloat(String(k[4])), v: parseFloat(String(k[5]))
            }));
        } catch {
            // Fallback: generate realistic-looking data
            const base = 43500;
            const candles: Candle[] = [];
            let price = base;
            for (let i = 0; i < HISTORY + ROUNDS + 4; i++) {
                const change = (Math.random() - 0.47) * 400;
                const o = price, c = Math.max(base * 0.8, o + change);
                const h = Math.max(o, c) + Math.random() * 120;
                const l = Math.min(o, c) - Math.random() * 120;
                candles.push({ t: Date.now() - (HISTORY + ROUNDS + 4 - i) * 300000, o, h, l, c, v: Math.random() * 50 });
                price = c;
            }
            return candles;
        }
    };

    const startGame = async () => {
        setPhase("loading");
        const candles = await fetchCandles();
        gs.current = {
            candles, cursor: HISTORY, round: 0,
            portfolio: 10000, aiPortfolio: 10000,
            position: "none", entryPrice: 0, history: []
        };
        redraw();
        setPhase("playing");
    };

    const decide = (dec: Dec) => {
        const g = gs.current;
        if (g.round >= ROUNDS) return;
        const cur = g.candles[g.cursor];
        const nxt = g.candles[g.cursor + 1];
        if (!cur || !nxt) return;

        const pct = (nxt.c - cur.c) / cur.c;
        let p = g.portfolio, pos = g.position, entry = g.entryPrice;

        if (dec === "BUY" && pos === "none") { pos = "long"; entry = cur.c; }
        else if (dec === "SELL" && pos === "long") {
            const gain = (cur.c - entry) / entry;
            p = p * (1 + gain); pos = "none"; entry = 0;
        } else if (pos === "long") {
            // Mark to market
            const gain = (nxt.c - entry) / entry;
            p = p * (1 + gain); entry = nxt.c;
        }
        p = Math.max(0, p);

        const prices = g.candles.map(c => c.c);
        const ad = aiDec(prices, g.cursor);
        let aiP = g.aiPortfolio;
        const aiPct = (nxt.c - cur.c) / cur.c;
        if (ad === "BUY") aiP = aiP * (1 + aiPct * 0.8);
        else if (ad === "SELL") aiP = aiP * (1 - aiPct * 0.8);
        aiP = Math.max(0, aiP);

        const good = (dec === "BUY" && pct > 0) || (dec === "SELL" && pct < 0) || (dec === "HOLD" && Math.abs(pct) < 0.003);
        const pctStr = (pct * 100).toFixed(2);

        const msgs: Record<Dec, string> = {
            BUY: pct > 0 ? `✓ BUY parfait +${pctStr}%` : `✗ BUY raté ${pctStr}%`,
            SELL: pct < 0 ? `✓ SELL timing parfait ${pctStr}%` : `✗ Vendu trop tôt +${pctStr}%`,
            HOLD: Math.abs(pct) < 0.003 ? `✓ Bon HOLD ${pctStr}%` : (pct > 0 ? `~ Raté +${pctStr}%` : `✓ Évité ${pctStr}%`),
        };
        setFb({ text: msgs[dec], good });
        setTimeout(() => setFb(null), 1800);

        const nr = g.round + 1;
        gs.current = { ...g, cursor: g.cursor + 1, round: nr, portfolio: p, aiPortfolio: aiP, position: pos, entryPrice: entry, history: [...g.history, { dec, pct, price: cur.c }] };
        redraw();

        if (nr >= ROUNDS) {
            setTimeout(() => {
                setPhase("result");
                unlockAchievement("TRADE_DONE");
                if (p > aiP) unlockAchievement("TRADE_WIN");
            }, 500);
        }
    };

    const g = gs.current;
    const pnl = g.portfolio - 10000;
    const aiPnl = g.aiPortfolio - 10000;
    const currentCandle = g.candles[g.cursor];
    const prevCandle = g.candles[g.cursor - 1];

    return (
        <section id="trade" className="relative py-32 px-6 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-yellow-950/8 to-transparent" />
            <div className="max-w-3xl mx-auto">

                <motion.div className="mb-10 text-center" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
                    <div className="flex items-center justify-center gap-4 mb-3">
                        <div className="glow-line w-12" />
                        <span className="text-xs font-mono text-yellow-400 tracking-widest uppercase">Mini-Jeu</span>
                        <div className="glow-line w-12" />
                    </div>
                    <h2 className="text-3xl md:text-5xl font-black text-white/90 mb-1">Trade Like Me</h2>
                    <p className="text-white/40 text-sm">Données réelles BTC/USDT · Battez mon algorithme</p>
                </motion.div>

                {/* ── INTRO ── */}
                {phase === "intro" && (
                    <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
                        className="glass rounded-2xl border border-yellow-400/20 overflow-hidden">
                        <div className="relative h-32 overflow-hidden">
                            <svg viewBox="0 0 600 100" className="w-full h-full" preserveAspectRatio="none">
                                <defs>
                                    <linearGradient id="ig2" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="rgba(16,185,129,0.2)" />
                                        <stop offset="100%" stopColor="transparent" />
                                    </linearGradient>
                                </defs>
                                <path d="M0,70 C30,65 50,80 80,55 C110,30 140,45 170,35 C200,25 230,50 260,38 C290,26 320,42 350,28 C380,14 410,38 440,22 C470,8 510,18 540,10 C560,6 580,12 600,8 L600,100 L0,100 Z" fill="url(#ig2)" />
                                <path d="M0,70 C30,65 50,80 80,55 C110,30 140,45 170,35 C200,25 230,50 260,38 C290,26 320,42 350,28 C380,14 410,38 440,22 C470,8 510,18 540,10 C560,6 580,12 600,8" fill="none" stroke="#10b981" strokeWidth="1.5" />
                            </svg>
                            <div className="absolute inset-0 bg-gradient-to-t from-[#030712] to-transparent" />
                            <div className="absolute bottom-3 left-4 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                <span className="text-xs font-mono text-emerald-400">BTC/USDT · LIVE DATA</span>
                            </div>
                        </div>
                        <div className="p-8 text-center">
                            <h3 className="text-2xl font-bold text-white/90 mb-1">Êtes-vous plus fort que l&apos;IA ?</h3>
                            <p className="text-white/40 text-sm mb-6">Chandelles réelles Binance 5 min · Mon algo momentum joue contre vous</p>
                            <div className="grid grid-cols-4 gap-2 max-w-sm mx-auto mb-8 text-center">
                                {[["$10K", "Capital"], ["5m", "Interval"], [String(ROUNDS), "Rounds"], ["IA", "Adversaire"]].map(([v, l]) => (
                                    <div key={l} className="glass rounded-xl p-2.5 border border-white/5">
                                        <div className="text-base font-black text-yellow-400">{v}</div>
                                        <div className="text-[10px] text-white/30 font-mono">{l}</div>
                                    </div>
                                ))}
                            </div>
                            <button
                                type="button"
                                onClick={() => startGame()}
                                style={{ cursor: "pointer" }}
                                className="inline-flex items-center gap-3 px-10 py-4 rounded-xl font-bold text-lg text-black bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-300 hover:to-orange-300 transition-all shadow-lg shadow-yellow-400/20"
                            >
                                🚀 Lancer la simulation
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* ── LOADING ── */}
                {phase === "loading" && (
                    <div className="glass rounded-2xl border border-yellow-400/20 p-16 text-center">
                        <div className="flex items-center justify-center gap-3 mb-4">
                            <div className="w-4 h-4 border-2 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin" />
                            <span className="font-mono text-yellow-400 text-sm">Chargement données Binance...</span>
                        </div>
                        <p className="text-white/30 text-xs font-mono">BTC/USDT · 5m · LIVE</p>
                    </div>
                )}

                {/* ── PLAYING ── */}
                {phase === "playing" && g.candles.length > 0 && (
                    <div className="space-y-4">
                        {/* HUD */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className={`glass rounded-xl p-3 border ${pnl >= 0 ? "border-emerald-400/20" : "border-red-400/20"}`}>
                                <div className="text-[10px] font-mono text-white/30 mb-0.5">VOUS</div>
                                <div className={`text-lg font-black font-mono ${pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>${fmt(g.portfolio)}</div>
                                <div className={`text-[10px] font-mono ${pnl >= 0 ? "text-emerald-400/70" : "text-red-400/70"}`}>
                                    {pnl >= 0 ? "+" : ""}{((pnl / 10000) * 100).toFixed(2)}%
                                </div>
                            </div>
                            <div className="glass rounded-xl p-3 border border-white/8 text-center">
                                <div className="text-[10px] font-mono text-white/30 mb-1.5">ROUND {g.round + 1}/{ROUNDS}</div>
                                <div className="flex gap-1 justify-center">
                                    {Array.from({ length: ROUNDS }).map((_, i) => {
                                        const h = g.history[i];
                                        const done = i < g.round;
                                        const isGood = done && h && ((h.dec === "BUY" && h.pct > 0) || (h.dec === "SELL" && h.pct < 0) || (h.dec === "HOLD" && Math.abs(h.pct) < 0.003));
                                        return <div key={i} className="w-2.5 h-2.5 rounded-sm transition-colors" style={{ backgroundColor: done ? (isGood ? "#10b981" : "#ef4444") : i === g.round ? "#facc15" : "rgba(255,255,255,0.08)" }} />;
                                    })}
                                </div>
                            </div>
                            <div className={`glass rounded-xl p-3 border ${aiPnl >= 0 ? "border-cyan-400/20" : "border-red-400/20"}`}>
                                <div className="text-[10px] font-mono text-white/30 mb-0.5">ALGO IA</div>
                                <div className={`text-lg font-black font-mono ${aiPnl >= 0 ? "text-cyan-400" : "text-red-400"}`}>${fmt(g.aiPortfolio)}</div>
                                <div className={`text-[10px] font-mono ${aiPnl >= 0 ? "text-cyan-400/70" : "text-red-400/70"}`}>
                                    {aiPnl >= 0 ? "+" : ""}{((aiPnl / 10000) * 100).toFixed(2)}%
                                </div>
                            </div>
                        </div>

                        {/* Chart */}
                        <div className="glass rounded-2xl border border-white/8 p-4 relative overflow-hidden">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    <span className="text-[10px] font-mono text-white/40">BTC/USDT · 5m · Binance</span>
                                </div>
                                {currentCandle && prevCandle && (
                                    <div className={`text-right ${currentCandle.c >= prevCandle.c ? "text-emerald-400" : "text-red-400"}`}>
                                        <span className="text-lg font-black font-mono">${fmt(currentCandle.c)}</span>
                                        <span className="text-xs font-mono ml-2 opacity-70">
                                            {currentCandle.c >= prevCandle.c ? "▲" : "▼"}{Math.abs(((currentCandle.c - prevCandle.c) / prevCandle.c) * 100).toFixed(3)}%
                                        </span>
                                    </div>
                                )}
                            </div>
                            <CandleChart candles={g.candles} cursor={g.cursor} />
                            <AnimatePresence>
                                {fb && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -8, scale: 0.92 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 8, scale: 0.92 }}
                                        className="absolute top-3 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl border backdrop-blur-md text-sm font-mono font-bold whitespace-nowrap z-10"
                                        style={{
                                            background: fb.good ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.12)",
                                            borderColor: fb.good ? "rgba(16,185,129,0.5)" : "rgba(239,68,68,0.5)",
                                            color: fb.good ? "#10b981" : "#ef4444",
                                            boxShadow: fb.good ? "0 0 20px rgba(16,185,129,0.2)" : "0 0 20px rgba(239,68,68,0.2)",
                                        }}
                                    >
                                        {fb.text}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Position */}
                        <div className="flex items-center justify-between px-1 text-xs font-mono">
                            <div className="flex items-center gap-2 text-white/40">
                                <div className={`w-2 h-2 rounded-full ${g.position === "long" ? "bg-emerald-400 animate-pulse" : "bg-white/15"}`} />
                                Position : <span className={g.position === "long" ? "text-emerald-400 font-bold" : "text-white/30"}>{g.position === "long" ? `LONG @ $${fmt(g.entryPrice)}` : "FLAT"}</span>
                            </div>
                            <span className="text-white/20">{ROUNDS - g.round} rounds restants</span>
                        </div>

                        {/* Decision buttons */}
                        <div className="grid grid-cols-3 gap-3">
                            {([
                                { dec: "BUY" as Dec, emoji: "📈", label: "BUY", bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.35)", color: "#10b981", shadow: "rgba(16,185,129,0.25)" },
                                { dec: "SELL" as Dec, emoji: "📉", label: "SELL", bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.35)", color: "#ef4444", shadow: "rgba(239,68,68,0.25)" },
                                { dec: "HOLD" as Dec, emoji: "⏸", label: "HOLD", bg: "rgba(148,163,184,0.06)", border: "rgba(148,163,184,0.25)", color: "#94a3b8", shadow: "rgba(148,163,184,0.15)" },
                            ]).map(({ dec, emoji, label, bg, border, color, shadow }) => (
                                <button
                                    key={dec}
                                    type="button"
                                    onClick={() => decide(dec)}
                                    style={{ cursor: "pointer", background: bg, border: `1px solid ${border}`, color }}
                                    className="py-5 rounded-xl font-black transition-all hover:scale-105 active:scale-95 flex flex-col items-center gap-1.5"
                                    onMouseEnter={e => (e.currentTarget.style.boxShadow = `0 0 24px ${shadow}`)}
                                    onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}
                                >
                                    <span className="text-2xl">{emoji}</span>
                                    <span className="text-sm tracking-widest">{label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── RESULT ── */}
                {phase === "result" && (() => {
                    const won = g.portfolio > g.aiPortfolio;
                    return (
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                            className="glass rounded-2xl border border-white/10 overflow-hidden">
                            <div className={`py-10 text-center ${won ? "bg-gradient-to-br from-emerald-500/10 to-cyan-500/10" : "bg-gradient-to-br from-red-500/10 to-orange-500/10"}`}>
                                <motion.div className="text-7xl mb-3" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.5 }}>
                                    {won ? "🏆" : pnl > 0 ? "✅" : "💀"}
                                </motion.div>
                                <h3 className="text-3xl font-black text-white/90">{won ? "Vous battez l'algorithme !" : "L'IA vous écrase"}</h3>
                                <p className={`font-mono mt-2 text-lg ${pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                    {pnl >= 0 ? "+" : ""}${Math.abs(pnl).toFixed(0)} ({pnl >= 0 ? "+" : ""}{((pnl / 10000) * 100).toFixed(2)}%)
                                </p>
                            </div>
                            <div className="p-6 space-y-5">
                                <div className="grid grid-cols-2 gap-4">
                                    {[{ l: "Vous", v: g.portfolio, c: won ? "#10b981" : "#ef4444" }, { l: "Algo IA", v: g.aiPortfolio, c: won ? "#94a3b8" : "#00d4ff" }].map(({ l, v, c }) => (
                                        <div key={l} className="glass rounded-xl p-4 border border-white/5">
                                            <div className="text-xs font-mono text-white/30 mb-2">{l}</div>
                                            <div className="text-2xl font-black font-mono" style={{ color: c }}>${fmt(v)}</div>
                                            <div className="mt-3 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                <motion.div className="h-full rounded-full" style={{ backgroundColor: c }}
                                                    initial={{ width: 0 }} animate={{ width: `${Math.min(100, (v / 12000) * 100)}%` }}
                                                    transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div>
                                    <div className="text-xs font-mono text-white/30 mb-2 uppercase tracking-wider">Vos {ROUNDS} décisions</div>
                                    <div className="flex gap-2 flex-wrap">
                                        {g.history.map((h, i) => {
                                            const good = (h.dec === "BUY" && h.pct > 0) || (h.dec === "SELL" && h.pct < 0) || (h.dec === "HOLD" && Math.abs(h.pct) < 0.003);
                                            return (
                                                <div key={i} title={`${(h.pct * 100).toFixed(3)}%`}
                                                    className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold border flex items-center gap-1"
                                                    style={{ background: good ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", borderColor: good ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)", color: good ? "#10b981" : "#ef4444" }}>
                                                    {good ? "✓" : "✗"} {h.dec}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                                <p className="text-white/30 text-xs font-mono text-center border-t border-white/5 pt-3">
                                    Mon algo utilise une stratégie dual-momentum — FAST(2) + SLOW(5) sur les clôtures
                                </p>
                                <div className="flex gap-3">
                                    <button type="button" onClick={() => startGame()} style={{ cursor: "pointer" }}
                                        className="flex-1 py-3 rounded-xl border border-white/15 text-white/60 hover:text-white font-medium text-sm transition-all">
                                        Rejouer (nouvelles données)
                                    </button>
                                    <button type="button" onClick={() => document.querySelector("#projects")?.scrollIntoView({ behavior: "smooth" })} style={{ cursor: "pointer" }}
                                        className="flex-1 py-3 rounded-xl font-bold text-sm text-black bg-gradient-to-r from-cyan-400 to-violet-500 hover:opacity-90 transition-all">
                                        Voir mes projets →
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    );
                })()}
            </div>
        </section>
    );
}
