"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { unlockAchievement } from "@/lib/achievements";

const BASE = 43200;
const VOL = 600;
const ROUNDS = 8;
const HISTORY = 16;

function gen(n: number): number[] {
    const p = [BASE];
    for (let i = 1; i < n; i++) p.push(Math.max(BASE * 0.75, p[i - 1] + (Math.random() - 0.47) * VOL));
    return p;
}
function aiDec(prices: number[], idx: number): "BUY" | "SELL" | "HOLD" {
    if (idx < 3) return "HOLD";
    const t = prices[idx] - prices[idx - 3];
    return t > 400 ? "BUY" : t < -400 ? "SELL" : "HOLD";
}
function fmt(n: number) { return n.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ","); }

type Dec = "BUY" | "SELL" | "HOLD";
type Phase = "intro" | "playing" | "result";
interface GS {
    prices: number[]; cursor: number; round: number;
    portfolio: number; aiPortfolio: number; position: "none" | "long";
    history: { dec: Dec; pct: number }[];
}

function Chart({ prices, cursor }: { prices: number[]; cursor: number }) {
    const slice = prices.slice(Math.max(0, cursor - HISTORY), cursor + 1);
    if (slice.length < 2) return null;
    const min = Math.min(...slice), max = Math.max(...slice), range = max - min || 1;
    const W = 600, H = 140;
    const tx = (i: number) => (i / (slice.length - 1)) * W;
    const ty = (p: number) => H - ((p - min) / range) * (H - 16) - 8;
    let line = `M${tx(0)},${ty(slice[0])}`;
    for (let i = 1; i < slice.length; i++) {
        const cx = (tx(i - 1) + tx(i)) / 2;
        line += ` C${cx},${ty(slice[i-1])} ${cx},${ty(slice[i])} ${tx(i)},${ty(slice[i])}`;
    }
    const last = slice[slice.length - 1], first = slice[0];
    const up = last >= first, ly = ty(last);
    const color = up ? "#10b981" : "#ef4444";
    const pct = ((last - first) / first * 100).toFixed(2);
    return (
        <div>
            <div className="flex items-end justify-between mb-2 px-1">
                <div className="text-xs font-mono text-white/30 tracking-widest">BTC/USDT · LIVE</div>
                <div className="text-right">
                    <div className="text-3xl font-black font-mono" style={{ color }}>${fmt(last)}</div>
                    <div className="text-xs font-mono" style={{ color }}>{up ? "▲" : "▼"} {Math.abs(last - first).toFixed(0)} ({up ? "+" : ""}{pct}%)</div>
                </div>
            </div>
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 140 }} preserveAspectRatio="none">
                <defs>
                    <linearGradient id="gf" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={up ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"} />
                        <stop offset="100%" stopColor="rgba(0,0,0,0)" />
                    </linearGradient>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                </defs>
                <path d={line + ` L${W},${H} L0,${H} Z`} fill="url(#gf)" />
                <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" filter="url(#glow)" />
                <circle cx={W} cy={ly} r="5" fill={color} filter="url(#glow)" />
                <circle cx={W} cy={ly} r="10" fill={color} opacity="0.2">
                    <animate attributeName="r" values="10;16;10" dur="1.5s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.2;0;0.2" dur="1.5s" repeatCount="indefinite" />
                </circle>
            </svg>
        </div>
    );
}

export default function TradeGame() {
    const gs = useRef<GS>({ prices: [], cursor: HISTORY, round: 0, portfolio: 10000, aiPortfolio: 10000, position: "none", history: [] });
    const [phase, setPhase] = useState<Phase>("intro");
    const [, tick] = useState(0);
    const redraw = () => tick(n => n + 1);
    const [fb, setFb] = useState<{ text: string; good: boolean } | null>(null);

    const start = (e: React.MouseEvent) => {
        e.stopPropagation();
        gs.current = { prices: gen(HISTORY + ROUNDS + 5), cursor: HISTORY, round: 0, portfolio: 10000, aiPortfolio: 10000, position: "none", history: [] };
        setFb(null);
        setPhase("playing");
    };

    const decide = (e: React.MouseEvent, dec: Dec) => {
        e.stopPropagation();
        const g = gs.current;
        const cur = g.prices[g.cursor], nxt = g.prices[g.cursor + 1] ?? cur;
        const pct = (nxt - cur) / cur;
        let p = g.portfolio, pos = g.position;
        if (dec === "BUY" && pos === "none") pos = "long";
        else if (dec === "SELL" && pos === "long") { p = p * (1 + pct); pos = "none"; }
        else if (pos === "long") p = p * (1 + pct);
        p = Math.max(0, p);
        const ad = aiDec(g.prices, g.cursor);
        const ai = Math.max(0, g.aiPortfolio * (1 + (ad === "BUY" ? 1 : ad === "SELL" ? -1 : 0) * Math.abs(pct)));
        const good = (dec === "BUY" && pct > 0) || (dec === "SELL" && pct < 0) || (dec === "HOLD" && Math.abs(pct) < 0.004);
        setFb({
            text: dec === "BUY" ? (pct > 0 ? "✓ BUY confirmé — prix en hausse" : "✗ Prix en baisse") : dec === "SELL" ? (pct < 0 ? "✓ SELL parfait — chute évitée" : "✗ Vendu trop tôt") : (Math.abs(pct) < 0.004 ? "✓ Bon HOLD — marché stable" : "~ HOLD maintenu"),
            good
        });
        setTimeout(() => setFb(null), 1600);
        const nr = g.round + 1;
        gs.current = { ...g, cursor: g.cursor + 1, round: nr, portfolio: p, aiPortfolio: ai, position: pos, history: [...g.history, { dec, pct }] };
        redraw();
        if (nr >= ROUNDS) setTimeout(() => { setPhase("result"); unlockAchievement("TRADE_DONE"); if (p > ai) unlockAchievement("TRADE_WIN"); }, 500);
    };

    const g = gs.current;

    return (
        <section id="trade" className="relative py-32 px-6 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-yellow-950/8 to-transparent" />
            <div className="max-w-3xl mx-auto">
                <motion.div className="mb-12 text-center" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
                    <div className="flex items-center justify-center gap-4 mb-3">
                        <div className="glow-line w-12" />
                        <span className="text-xs font-mono text-yellow-400 tracking-widest uppercase">Mini-Jeu</span>
                        <div className="glow-line w-12" />
                    </div>
                    <h2 className="text-3xl md:text-5xl font-black text-white/90 mb-2">Trade Like Me</h2>
                    <p className="text-white/40 text-sm">Battez mon algorithme en 8 décisions</p>
                </motion.div>

                {/* ── INTRO ── */}
                {phase === "intro" && (
                    <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="glass rounded-2xl border border-yellow-400/20 overflow-hidden">
                        {/* Fake chart preview */}
                        <div className="relative h-40 overflow-hidden opacity-40">
                            <svg viewBox="0 0 600 120" className="w-full h-full" preserveAspectRatio="none">
                                <defs><linearGradient id="ig" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="rgba(16,185,129,0.3)" /><stop offset="100%" stopColor="transparent" /></linearGradient></defs>
                                <path d="M0,80 C50,70 80,90 120,60 C160,30 200,50 240,40 C280,30 320,55 360,35 C400,15 440,45 480,30 C520,15 560,25 600,20 L600,120 L0,120 Z" fill="url(#ig)" />
                                <path d="M0,80 C50,70 80,90 120,60 C160,30 200,50 240,40 C280,30 320,55 360,35 C400,15 440,45 480,30 C520,15 560,25 600,20" fill="none" stroke="#10b981" strokeWidth="2" />
                            </svg>
                            <div className="absolute inset-0 bg-gradient-to-t from-[#030712] to-transparent" />
                        </div>
                        <div className="p-8 text-center">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 text-xs font-mono mb-4">
                                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                                Simulation BTC/USDT en temps réel
                            </div>
                            <h3 className="text-2xl font-bold text-white/90 mb-2">Êtes-vous plus fort que l&apos;IA ?</h3>
                            <p className="text-white/40 text-sm mb-6">Mon algorithme momentum analyse les tendances. À vous de jouer.</p>
                            <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto mb-8 text-center">
                                <div className="glass rounded-xl p-3 border border-white/5">
                                    <div className="text-xl font-black text-yellow-400">$10K</div>
                                    <div className="text-xs text-white/30 font-mono">Capital</div>
                                </div>
                                <div className="glass rounded-xl p-3 border border-white/5">
                                    <div className="text-xl font-black text-cyan-400">{ROUNDS}</div>
                                    <div className="text-xs text-white/30 font-mono">Rounds</div>
                                </div>
                                <div className="glass rounded-xl p-3 border border-white/5">
                                    <div className="text-xl font-black text-violet-400">IA</div>
                                    <div className="text-xs text-white/30 font-mono">Adversaire</div>
                                </div>
                            </div>
                            <button onClick={start} type="button" style={{ cursor: "pointer" }}
                                className="inline-flex items-center gap-3 px-10 py-4 rounded-xl font-bold text-lg text-black bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-300 hover:to-orange-300 transition-all shadow-lg shadow-yellow-400/20">
                                <span>🚀</span> Lancer la simulation
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* ── PLAYING ── */}
                {phase === "playing" && (
                    <div className="space-y-4">
                        {/* HUD top */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="glass rounded-xl p-3 border border-white/8">
                                <div className="text-[10px] font-mono text-white/30 mb-1">VOUS</div>
                                <div className={`text-xl font-black font-mono ${g.portfolio >= 10000 ? "text-emerald-400" : "text-red-400"}`}>${fmt(g.portfolio)}</div>
                                <div className={`text-[10px] font-mono ${g.portfolio >= 10000 ? "text-emerald-400/60" : "text-red-400/60"}`}>
                                    {g.portfolio >= 10000 ? "+" : ""}{((g.portfolio / 10000 - 1) * 100).toFixed(2)}%
                                </div>
                            </div>
                            {/* Round dots */}
                            <div className="glass rounded-xl p-3 border border-white/8 flex flex-col items-center justify-center">
                                <div className="text-[10px] font-mono text-white/30 mb-2">ROUND {g.round + 1}/{ROUNDS}</div>
                                <div className="flex gap-1">
                                    {Array.from({ length: ROUNDS }).map((_, i) => {
                                        const h = g.history[i];
                                        return (
                                            <div key={i} className="w-2 h-2 rounded-full" style={{
                                                backgroundColor: i < g.round
                                                    ? h?.pct !== undefined && ((h.dec === "BUY" && h.pct > 0) || (h.dec === "SELL" && h.pct < 0) || (h.dec === "HOLD" && Math.abs(h.pct) < 0.004))
                                                        ? "#10b981" : "#ef4444"
                                                    : i === g.round ? "#facc15" : "rgba(255,255,255,0.1)"
                                            }} />
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="glass rounded-xl p-3 border border-white/8">
                                <div className="text-[10px] font-mono text-white/30 mb-1">ALGO IA</div>
                                <div className={`text-xl font-black font-mono ${g.aiPortfolio >= 10000 ? "text-cyan-400" : "text-red-400"}`}>${fmt(g.aiPortfolio)}</div>
                                <div className={`text-[10px] font-mono ${g.aiPortfolio >= 10000 ? "text-cyan-400/60" : "text-red-400/60"}`}>
                                    {g.aiPortfolio >= 10000 ? "+" : ""}{((g.aiPortfolio / 10000 - 1) * 100).toFixed(2)}%
                                </div>
                            </div>
                        </div>

                        {/* Chart */}
                        <div className="glass rounded-2xl border border-white/8 p-5 relative overflow-hidden">
                            {/* Background glow based on trend */}
                            <div className="absolute inset-0 opacity-5" style={{
                                background: g.prices.length > 1 && g.prices[g.cursor] > g.prices[g.cursor - 1]
                                    ? "radial-gradient(ellipse at 80% 50%, #10b981 0%, transparent 70%)"
                                    : "radial-gradient(ellipse at 80% 50%, #ef4444 0%, transparent 70%)"
                            }} />
                            <Chart prices={g.prices} cursor={g.cursor} />
                            <AnimatePresence>
                                {fb && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10, scale: 0.9 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.9 }}
                                        className="absolute top-3 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl border backdrop-blur-sm text-sm font-mono font-bold whitespace-nowrap z-10"
                                        style={{
                                            background: fb.good ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
                                            borderColor: fb.good ? "rgba(16,185,129,0.4)" : "rgba(239,68,68,0.4)",
                                            color: fb.good ? "#10b981" : "#ef4444",
                                        }}
                                    >
                                        {fb.text}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Position badge */}
                        <div className="flex items-center justify-between px-1">
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${g.position === "long" ? "bg-emerald-400" : "bg-white/20"} ${g.position === "long" ? "animate-pulse" : ""}`} />
                                <span className="text-xs font-mono text-white/40">
                                    Position : <span className={g.position === "long" ? "text-emerald-400" : "text-white/40"}>{g.position === "long" ? "LONG ↑" : "FLAT"}</span>
                                </span>
                            </div>
                            <div className="text-xs font-mono text-white/20">
                                {ROUNDS - g.round} décisions restantes
                            </div>
                        </div>

                        {/* Decision buttons */}
                        <div className="grid grid-cols-3 gap-3">
                            {([
                                { dec: "BUY" as Dec, label: "BUY", emoji: "📈", color: "#10b981", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.3)", hover: "rgba(16,185,129,0.2)" },
                                { dec: "SELL" as Dec, label: "SELL", emoji: "📉", color: "#ef4444", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.3)", hover: "rgba(239,68,68,0.2)" },
                                { dec: "HOLD" as Dec, label: "HOLD", emoji: "⏸", color: "#94a3b8", bg: "rgba(148,163,184,0.05)", border: "rgba(148,163,184,0.2)", hover: "rgba(148,163,184,0.1)" },
                            ]).map(({ dec, label, emoji, color, bg, border }) => (
                                <button
                                    key={dec}
                                    type="button"
                                    onClick={(e) => decide(e, dec)}
                                    style={{ cursor: "pointer", background: bg, border: `1px solid ${border}`, color }}
                                    className="py-5 rounded-xl font-black text-base transition-all hover:scale-105 active:scale-95 flex flex-col items-center gap-1 group"
                                >
                                    <span className="text-2xl group-hover:scale-110 transition-transform">{emoji}</span>
                                    <span style={{ color }} className="tracking-widest text-sm">{label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── RESULT ── */}
                {phase === "result" && (() => {
                    const won = g.portfolio > g.aiPortfolio;
                    const profit = g.portfolio - 10000;
                    return (
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass rounded-2xl border border-white/10 overflow-hidden">
                            {/* Result banner */}
                            <div className={`py-8 text-center ${won ? "bg-gradient-to-r from-emerald-500/10 to-cyan-500/10" : "bg-gradient-to-r from-red-500/10 to-orange-500/10"}`}>
                                <div className="text-6xl mb-3">{won ? "🏆" : g.portfolio > 10000 ? "✅" : "💀"}</div>
                                <h3 className="text-2xl font-black text-white/90">{won ? "Vous avez battu l'algorithme !" : "L'IA remporte cette manche"}</h3>
                                <p className={`text-sm font-mono mt-1 ${profit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                    {profit >= 0 ? "+" : ""}${Math.abs(profit).toFixed(0)} ({profit >= 0 ? "+" : ""}{((profit / 10000) * 100).toFixed(1)}%)
                                </p>
                            </div>
                            {/* Comparison */}
                            <div className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    {[
                                        { label: "Vous", val: g.portfolio, color: won ? "#10b981" : "#ef4444" },
                                        { label: "Algo IA", val: g.aiPortfolio, color: won ? "#64748b" : "#00d4ff" },
                                    ].map(({ label, val, color }) => (
                                        <div key={label} className="glass rounded-xl p-4 border border-white/5">
                                            <div className="text-xs font-mono text-white/30 mb-2">{label}</div>
                                            <div className="text-2xl font-black font-mono" style={{ color }}>${fmt(val)}</div>
                                            <div className="mt-2 h-1 bg-white/5 rounded-full overflow-hidden">
                                                <motion.div className="h-full rounded-full" style={{ backgroundColor: color }}
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${Math.min(100, (val / 12000) * 100)}%` }}
                                                    transition={{ duration: 1, delay: 0.3 }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {/* Decision history */}
                                <div>
                                    <div className="text-xs font-mono text-white/30 mb-2">VOS DÉCISIONS</div>
                                    <div className="flex gap-2 flex-wrap">
                                        {g.history.map((h, i) => {
                                            const good = (h.dec === "BUY" && h.pct > 0) || (h.dec === "SELL" && h.pct < 0) || (h.dec === "HOLD" && Math.abs(h.pct) < 0.004);
                                            return (
                                                <div key={i} className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold border"
                                                    style={{ background: good ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", borderColor: good ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)", color: good ? "#10b981" : "#ef4444" }}>
                                                    {h.dec}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button onClick={start} type="button" style={{ cursor: "pointer" }}
                                        className="flex-1 py-3 rounded-xl border border-white/15 text-white/60 hover:text-white font-medium text-sm transition-all">
                                        Rejouer
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); document.querySelector("#projects")?.scrollIntoView({ behavior: "smooth" }); }} type="button" style={{ cursor: "pointer" }}
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
