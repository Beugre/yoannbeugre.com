"use client";

import { useLayoutEffect, useRef, useState } from "react";
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

function drawPrices(canvas: HTMLCanvasElement, prices: number[], cursor: number, HISTORY: number) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const slice = prices.slice(Math.max(0, cursor - HISTORY), cursor + 1);
    if (slice.length < 2) return;
    const W = canvas.width, H = canvas.height;
    const min = Math.min(...slice) - 2, max = Math.max(...slice) + 2;
    ctx.clearRect(0, 0, W, H);
    // grid
    ctx.strokeStyle = "rgba(255,255,255,0.04)"; ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) { const y = (i / 4) * H; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    // line
    const g = ctx.createLinearGradient(0, 0, W, 0);
    g.addColorStop(0, "rgba(139,92,246,0.9)"); g.addColorStop(1, "rgba(0,212,255,0.9)");
    ctx.beginPath();
    slice.forEach((p, i) => { const x = (i / (slice.length - 1)) * W, y = H - ((p - min) / (max - min)) * H; i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); });
    ctx.strokeStyle = g; ctx.lineWidth = 2.5; ctx.stroke();
    // fill
    const lx = W, ly = H - ((slice[slice.length - 1] - min) / (max - min)) * H;
    ctx.lineTo(lx, H); ctx.lineTo(0, H); ctx.closePath();
    const fg = ctx.createLinearGradient(0, 0, 0, H);
    fg.addColorStop(0, "rgba(0,212,255,0.12)"); fg.addColorStop(1, "rgba(0,212,255,0)");
    ctx.fillStyle = fg; ctx.fill();
    // dot
    ctx.beginPath(); ctx.arc(lx, ly, 5, 0, Math.PI * 2);
    ctx.fillStyle = "#00d4ff"; ctx.shadowBlur = 12; ctx.shadowColor = "#00d4ff"; ctx.fill(); ctx.shadowBlur = 0;
    // label
    ctx.font = "11px monospace"; ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.textAlign = "right";
    ctx.fillText(`$${slice[slice.length - 1].toFixed(2)}`, W - 6, 16);
}

const ROUNDS = 8;
const HISTORY = 20;
type Decision = "BUY" | "SELL" | "HOLD";
type Phase = "intro" | "playing" | "result";

export default function TradeGame() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const pricesRef = useRef<number[]>([]);

    const [phase, setPhase] = useState<Phase>("intro");
    const [round, setRound] = useState(0);
    const [cursor, setCursor] = useState(HISTORY);
    const [portfolio, setPortfolio] = useState(10000);
    const [aiPortfolio, setAiPortfolio] = useState(10000);
    const [position, setPosition] = useState<"none" | "long">("none");
    const [feedback, setFeedback] = useState<string | null>(null);

    // useLayoutEffect = synchronous after DOM commit — canvas is guaranteed mounted
    useLayoutEffect(() => {
        if (phase !== "playing") return;
        const canvas = canvasRef.current;
        if (!canvas || pricesRef.current.length < 2) return;
        drawPrices(canvas, pricesRef.current, cursor, HISTORY);
    }, [phase, cursor]);

    const startGame = () => {
        pricesRef.current = generatePrices(HISTORY + ROUNDS + 5);
        setRound(0);
        setPortfolio(10000);
        setAiPortfolio(10000);
        setPosition("none");
        setFeedback(null);
        setCursor(HISTORY);
        setPhase("playing");
    };

    const decide = (decision: Decision) => {
        const prices = pricesRef.current;
        const cur = prices[cursor], nxt = prices[cursor + 1] ?? cur;
        const pct = (nxt - cur) / cur;

        let newP = portfolio, newPos = position;
        if (decision === "BUY" && position === "none") { newPos = "long"; }
        else if (decision === "SELL" && position === "long") { newP = portfolio * (1 + pct); newPos = "none"; }
        else if (position === "long") { newP = portfolio * (1 + pct); }
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
        setCursor((c) => c + 1);
        const nr = round + 1; setRound(nr);
        if (nr >= ROUNDS) setTimeout(() => { setPhase("result"); unlockAchievement("TRADE_DONE"); if (newP > newAi) unlockAchievement("TRADE_WIN"); }, 400);
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

                {/* INTRO */}
                {phase === "intro" && (
                    <div className="glass rounded-2xl p-8 border border-yellow-400/15 text-center">
                        <div className="text-6xl mb-4">📈</div>
                        <h3 className="text-2xl font-bold text-white/90 mb-3">Défi Trading</h3>
                        <div className="space-y-2 text-sm text-white/50 mb-8 max-w-sm mx-auto">
                            <p>💰 Portfolio de départ : <span className="text-yellow-400 font-mono">$10,000</span></p>
                            <p>🤖 L&apos;algorithme joue en parallèle (stratégie momentum)</p>
                            <p>📊 8 décisions : BUY / SELL / HOLD</p>
                            <p>🏆 Achievement &quot;Quant Instinct&quot; si vous gagnez</p>
                        </div>
                        <button
                            onClick={startGame}
                            style={{ cursor: "pointer" }}
                            className="px-8 py-3 rounded-xl font-bold text-black bg-gradient-to-r from-yellow-400 to-orange-400 hover:opacity-90 transition-opacity"
                        >
                            Commencer la partie →
                        </button>
                    </div>
                )}

                {/* PLAYING */}
                {phase === "playing" && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-3">
                            <div className="glass rounded-xl p-3 border border-white/5 text-center">
                                <div className="text-xs font-mono text-white/30 mb-1">Votre portfolio</div>
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

                        <div className="glass rounded-2xl p-4 border border-white/8 relative">
                            <canvas ref={canvasRef} width={800} height={200} className="w-full rounded-xl block" />
                            {feedback && (
                                <div className="absolute top-3 left-1/2 -translate-x-1/2 glass px-4 py-1.5 rounded-lg border border-white/10 text-sm font-mono text-white/80 whitespace-nowrap">
                                    {feedback}
                                </div>
                            )}
                        </div>

                        <div className="text-center text-xs font-mono text-white/30">
                            Position : <span className={position === "long" ? "text-emerald-400" : "text-white/40"}>{position === "long" ? "LONG 📈" : "FLAT —"}</span>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            {(["BUY", "SELL", "HOLD"] as Decision[]).map((dec) => (
                                <button
                                    key={dec}
                                    onClick={() => decide(dec)}
                                    style={{ cursor: "pointer" }}
                                    className={`py-4 rounded-xl font-bold text-sm border transition-all ${dec === "BUY" ? "border-emerald-400/30 text-emerald-400 hover:bg-emerald-400/15" : dec === "SELL" ? "border-red-400/30 text-red-400 hover:bg-red-400/15" : "border-white/15 text-white/60 hover:bg-white/8"}`}
                                >
                                    {dec === "BUY" ? "📈 BUY" : dec === "SELL" ? "📉 SELL" : "⏸ HOLD"}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* RESULT */}
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
                                <div className="text-xs font-mono text-white/30 mb-1">Algorithme IA</div>
                                <div className="text-xl font-black font-mono text-cyan-400">${aiPortfolio.toFixed(0)}</div>
                                <div className="text-xs text-white/30">{aiPortfolio > 10000 ? "+" : ""}{((aiPortfolio / 10000 - 1) * 100).toFixed(1)}%</div>
                            </div>
                        </div>
                        <p className="text-white/40 text-sm mb-6 max-w-md mx-auto">Mon algorithme utilise une stratégie momentum : achat sur hausse, vente sur baisse.</p>
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
