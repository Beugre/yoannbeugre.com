"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { unlockAchievement } from "@/lib/achievements";

function generatePrices(n: number): number[] {
    const p = [100];
    for (let i = 1; i < n; i++) p.push(Math.max(60, p[i - 1] + (Math.random() - 0.47) * 3));
    return p;
}

function aiDecision(prices: number[], idx: number): "BUY" | "SELL" | "HOLD" {
    if (idx < 2) return "HOLD";
    const t = prices[idx] - prices[idx - 2];
    return t > 0.8 ? "BUY" : t < -0.8 ? "SELL" : "HOLD";
}

const ROUNDS = 8;
const HISTORY = 20;
type Decision = "BUY" | "SELL" | "HOLD";
type Phase = "intro" | "playing" | "result";

// Pure CSS sparkline — no canvas, no refs
function PriceChart({ prices, cursor }: { prices: number[]; cursor: number }) {
    const slice = prices.slice(Math.max(0, cursor - HISTORY), cursor + 1);
    if (slice.length < 2) return null;
    const min = Math.min(...slice);
    const max = Math.max(...slice);
    const range = max - min || 1;
    const last = slice[slice.length - 1];
    const trend = slice[slice.length - 1] - slice[0];

    const points = slice.map((p, i) => {
        const x = (i / (slice.length - 1)) * 100;
        const y = 100 - ((p - min) / range) * 100;
        return `${x},${y}`;
    }).join(" ");

    return (
        <div className="relative w-full h-48 glass rounded-xl border border-white/8 overflow-hidden p-3">
            {/* SVG chart — no canvas */}
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
                {/* Grid */}
                {[25, 50, 75].map(y => (
                    <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                ))}
                {/* Fill */}
                <defs>
                    <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgba(0,212,255,0.15)" />
                        <stop offset="100%" stopColor="rgba(0,212,255,0)" />
                    </linearGradient>
                    <linearGradient id="chartLine" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="rgba(139,92,246,0.9)" />
                        <stop offset="100%" stopColor="rgba(0,212,255,0.9)" />
                    </linearGradient>
                </defs>
                <polyline points={`${points} 100,100 0,100`} fill="url(#chartFill)" />
                <polyline points={points} fill="none" stroke="url(#chartLine)" strokeWidth="0.8" />
                {/* Last dot */}
                {slice.length > 0 && (
                    <circle cx="100" cy={100 - ((last - min) / range) * 100} r="1.5" fill="#00d4ff" />
                )}
            </svg>
            {/* Labels */}
            <div className="absolute top-2 right-3 text-xs font-mono text-white/60">${last.toFixed(2)}</div>
            <div className={`absolute top-2 left-3 text-xs font-mono ${trend >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {trend >= 0 ? "▲" : "▼"} {Math.abs(trend).toFixed(2)}
            </div>
        </div>
    );
}

export default function TradeGame() {
    const [phase, setPhase] = useState<Phase>("intro");
    const [prices, setPrices] = useState<number[]>([]);
    const [cursor, setCursor] = useState(HISTORY);
    const [round, setRound] = useState(0);
    const [portfolio, setPortfolio] = useState(10000);
    const [aiPortfolio, setAiPortfolio] = useState(10000);
    const [position, setPosition] = useState<"none" | "long">("none");
    const [feedback, setFeedback] = useState<string | null>(null);

    const startGame = () => {
        const newPrices = generatePrices(HISTORY + ROUNDS + 5);
        setPrices(newPrices);
        setCursor(HISTORY);
        setRound(0);
        setPortfolio(10000);
        setAiPortfolio(10000);
        setPosition("none");
        setFeedback(null);
        setPhase("playing");
    };

    const decide = (decision: Decision) => {
        const cur = prices[cursor], nxt = prices[cursor + 1] ?? cur;
        const pct = (nxt - cur) / cur;

        let newP = portfolio, newPos = position;
        if (decision === "BUY" && position === "none") newPos = "long";
        else if (decision === "SELL" && position === "long") { newP = portfolio * (1 + pct); newPos = "none"; }
        else if (position === "long") newP = portfolio * (1 + pct);
        newP = Math.max(0, newP);

        const aiDec = aiDecision(prices, cursor);
        const newAi = Math.max(0, aiPortfolio * (1 + (aiDec === "BUY" ? 1 : aiDec === "SELL" ? -1 : 0) * Math.abs(pct)));

        const fbs: Record<Decision, string> = {
            BUY: pct > 0 ? "✓ Prix en hausse !" : "✗ Prix en baisse",
            SELL: pct < 0 ? "✓ Bon exit !" : "✗ Vendu trop tôt",
            HOLD: Math.abs(pct) < 0.5 ? "✓ Marché plat" : "~ Position maintenue",
        };
        setFeedback(fbs[decision]);
        setTimeout(() => setFeedback(null), 1400);

        setPortfolio(newP); setAiPortfolio(newAi); setPosition(newPos);
        setCursor(c => c + 1);

        const nr = round + 1; setRound(nr);
        if (nr >= ROUNDS) setTimeout(() => {
            setPhase("result"); unlockAchievement("TRADE_DONE");
            if (newP > newAi) unlockAchievement("TRADE_WIN");
        }, 400);
    };

    return (
        <section id="trade" className="relative py-32 px-6 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-yellow-950/5 to-transparent" />
            <div className="max-w-4xl mx-auto">

                <motion.div className="mb-12 text-center" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
                    <div className="flex items-center justify-center gap-4 mb-3">
                        <div className="glow-line w-12" />
                        <span className="text-xs font-mono text-yellow-400 tracking-widest uppercase">Mini-Jeu</span>
                        <div className="glow-line w-12" />
                    </div>
                    <h2 className="text-3xl md:text-5xl font-black text-white/90 mb-3">Trade Like Me</h2>
                    <p className="text-white/40 max-w-md mx-auto text-sm">Pouvez-vous battre mon algorithme ? 8 décisions. 1 seul gagnant.</p>
                </motion.div>

                {phase === "intro" && (
                    <div className="glass rounded-2xl p-8 border border-yellow-400/15 text-center">
                        <div className="text-6xl mb-4">📈</div>
                        <h3 className="text-2xl font-bold text-white/90 mb-3">Défi Trading</h3>
                        <div className="space-y-2 text-sm text-white/50 mb-8 max-w-sm mx-auto">
                            <p>💰 Portfolio : <span className="text-yellow-400 font-mono">$10,000</span></p>
                            <p>🤖 Algo IA momentum joue en parallèle</p>
                            <p>📊 8 décisions : BUY / SELL / HOLD</p>
                        </div>
                        <button onClick={startGame} style={{ cursor: "pointer" }}
                            className="px-8 py-3 rounded-xl font-bold text-black bg-gradient-to-r from-yellow-400 to-orange-400 hover:opacity-90 transition-opacity">
                            Commencer la partie →
                        </button>
                    </div>
                )}

                {phase === "playing" && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-3">
                            <div className="glass rounded-xl p-3 border border-white/5 text-center">
                                <div className="text-xs font-mono text-white/30 mb-1">Vous</div>
                                <div className={`text-lg font-black font-mono ${portfolio >= 10000 ? "text-emerald-400" : "text-red-400"}`}>${portfolio.toFixed(0)}</div>
                            </div>
                            <div className="glass rounded-xl p-3 border border-white/5 text-center">
                                <div className="text-xs font-mono text-white/30 mb-1">Round</div>
                                <div className="text-lg font-black text-white/90">{round + 1}/{ROUNDS}</div>
                            </div>
                            <div className="glass rounded-xl p-3 border border-white/5 text-center">
                                <div className="text-xs font-mono text-white/30 mb-1">Algo IA</div>
                                <div className={`text-lg font-black font-mono ${aiPortfolio >= 10000 ? "text-cyan-400" : "text-red-400"}`}>${aiPortfolio.toFixed(0)}</div>
                            </div>
                        </div>

                        <div className="relative">
                            <PriceChart prices={prices} cursor={cursor} />
                            {feedback && (
                                <div className="absolute top-3 left-1/2 -translate-x-1/2 glass px-4 py-1.5 rounded-lg border border-white/10 text-sm font-mono text-white/80 whitespace-nowrap z-10">
                                    {feedback}
                                </div>
                            )}
                        </div>

                        <div className="text-center text-xs font-mono text-white/30">
                            Position : <span className={position === "long" ? "text-emerald-400" : "text-white/40"}>{position === "long" ? "LONG 📈" : "FLAT —"}</span>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            {(["BUY", "SELL", "HOLD"] as Decision[]).map((dec) => (
                                <button key={dec} onClick={() => decide(dec)} style={{ cursor: "pointer" }}
                                    className={`py-4 rounded-xl font-bold text-sm border transition-all ${dec === "BUY" ? "border-emerald-400/30 text-emerald-400 hover:bg-emerald-400/15" : dec === "SELL" ? "border-red-400/30 text-red-400 hover:bg-red-400/15" : "border-white/15 text-white/60 hover:bg-white/8"}`}>
                                    {dec === "BUY" ? "📈 BUY" : dec === "SELL" ? "📉 SELL" : "⏸ HOLD"}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {phase === "result" && (
                    <div className="glass rounded-2xl p-8 border border-white/10 text-center">
                        <div className="text-5xl mb-4">{portfolio > aiPortfolio ? "🏆" : portfolio > 10000 ? "✅" : "💀"}</div>
                        <h3 className="text-2xl font-bold text-white/90 mb-6">{portfolio > aiPortfolio ? "Vous avez battu l'algorithme !" : "L'IA gagne cette fois..."}</h3>
                        <div className="grid grid-cols-2 gap-4 mb-6 max-w-xs mx-auto">
                            <div className={`glass rounded-xl p-4 border ${portfolio >= 10000 ? "border-emerald-400/20" : "border-red-400/20"}`}>
                                <div className="text-xs font-mono text-white/30 mb-1">Vous</div>
                                <div className={`text-xl font-black font-mono ${portfolio >= 10000 ? "text-emerald-400" : "text-red-400"}`}>${portfolio.toFixed(0)}</div>
                                <div className="text-xs text-white/30">{portfolio > 10000 ? "+" : ""}{((portfolio / 10000 - 1) * 100).toFixed(1)}%</div>
                            </div>
                            <div className="glass rounded-xl p-4 border border-cyan-400/20">
                                <div className="text-xs font-mono text-white/30 mb-1">Algo IA</div>
                                <div className="text-xl font-black font-mono text-cyan-400">${aiPortfolio.toFixed(0)}</div>
                                <div className="text-xs text-white/30">{aiPortfolio > 10000 ? "+" : ""}{((aiPortfolio / 10000 - 1) * 100).toFixed(1)}%</div>
                            </div>
                        </div>
                        <div className="flex items-center justify-center gap-4">
                            <button onClick={startGame} style={{ cursor: "pointer" }} className="px-6 py-3 rounded-xl border border-white/15 text-white/60 hover:text-white hover:border-white/30 text-sm font-medium transition-all">Rejouer</button>
                            <button onClick={() => document.querySelector("#projects")?.scrollIntoView({ behavior: "smooth" })} style={{ cursor: "pointer" }} className="px-6 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-400 to-violet-500 text-black hover:opacity-90 transition-all">Voir mes projets →</button>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
