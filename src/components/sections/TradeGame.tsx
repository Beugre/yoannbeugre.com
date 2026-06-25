"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { unlockAchievement } from "@/lib/achievements";

// Price simulation — random walk with slight upward bias
function generatePriceData(n: number): number[] {
    const prices = [100];
    for (let i = 1; i < n; i++) {
        const change = (Math.random() - 0.47) * 3;
        prices.push(Math.max(60, prices[i - 1] + change));
    }
    return prices;
}

// AI strategy — simple momentum (buy on uptrend, sell on downtrend)
function aiDecision(prices: number[], idx: number): "BUY" | "SELL" | "HOLD" {
    if (idx < 2) return "HOLD";
    const trend = prices[idx] - prices[idx - 2];
    if (trend > 0.8) return "BUY";
    if (trend < -0.8) return "SELL";
    return "HOLD";
}

const TOTAL_ROUNDS = 8;
const HISTORY_VISIBLE = 20;

type Decision = "BUY" | "SELL" | "HOLD";
type Phase = "intro" | "playing" | "result";

export default function TradeGame() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const pricesRef = useRef<number[]>([]);
    const [phase, setPhase] = useState<Phase>("intro");
    const [round, setRound] = useState(0);
    const [cursor, setCursor] = useState(HISTORY_VISIBLE);
    const [portfolio, setPortfolio] = useState(10000);
    const [aiPortfolio, setAiPortfolio] = useState(10000);
    const [position, setPosition] = useState<"none" | "long">("none");
    const [decisions, setDecisions] = useState<Decision[]>([]);
    const [aiDecisions, setAiDecisions] = useState<Decision[]>([]);
    const [feedback, setFeedback] = useState<string | null>(null);

    const drawChart = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas || pricesRef.current.length === 0) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const prices = pricesRef.current.slice(
            Math.max(0, cursor - HISTORY_VISIBLE),
            cursor + 1
        );

        const W = canvas.width;
        const H = canvas.height;
        const min = Math.min(...prices) - 2;
        const max = Math.max(...prices) + 2;

        ctx.clearRect(0, 0, W, H);

        // Background grid
        ctx.strokeStyle = "rgba(255,255,255,0.04)";
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const y = (i / 4) * H;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(W, y);
            ctx.stroke();
        }

        // Price line
        if (prices.length > 1) {
            const gradient = ctx.createLinearGradient(0, 0, W, 0);
            gradient.addColorStop(0, "rgba(139,92,246,0.8)");
            gradient.addColorStop(1, "rgba(0,212,255,0.8)");

            ctx.beginPath();
            prices.forEach((p, i) => {
                const x = (i / (prices.length - 1)) * W;
                const y = H - ((p - min) / (max - min)) * H;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            });
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 2.5;
            ctx.stroke();

            // Fill under line
            ctx.lineTo(W, H);
            ctx.lineTo(0, H);
            ctx.closePath();
            const fillGrad = ctx.createLinearGradient(0, 0, 0, H);
            fillGrad.addColorStop(0, "rgba(0,212,255,0.15)");
            fillGrad.addColorStop(1, "rgba(0,212,255,0)");
            ctx.fillStyle = fillGrad;
            ctx.fill();

            // Current price dot
            const lastX = W;
            const lastY = H - ((prices[prices.length - 1] - min) / (max - min)) * H;
            ctx.beginPath();
            ctx.arc(lastX, lastY, 5, 0, Math.PI * 2);
            ctx.fillStyle = "#00d4ff";
            ctx.shadowBlur = 12;
            ctx.shadowColor = "#00d4ff";
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        // Price labels
        ctx.font = "10px JetBrains Mono, monospace";
        ctx.fillStyle = "rgba(255,255,255,0.4)";
        ctx.textAlign = "right";
        ctx.fillText(`$${prices[prices.length - 1].toFixed(2)}`, W - 4, 14);
    }, [cursor]);

    useEffect(() => {
        drawChart();
    }, [drawChart]);

    // Redraw quand la phase passe en playing — attend que le canvas soit monté
    useEffect(() => {
        if (phase !== "playing") return;
        // Double rAF pour laisser React monter le canvas dans le DOM
        let id1: number;
        let id2: number;
        id1 = requestAnimationFrame(() => {
            id2 = requestAnimationFrame(() => {
                const canvas = canvasRef.current;
                if (canvas) {
                    canvas.width = canvas.offsetWidth || 700;
                    canvas.height = canvas.offsetHeight || 200;
                }
                drawChart();
            });
        });
        return () => {
            cancelAnimationFrame(id1);
            cancelAnimationFrame(id2);
        };
    }, [phase, cursor, drawChart]);

    const startGame = () => {
        // Générer les données prix d'abord
        pricesRef.current = generatePriceData(HISTORY_VISIBLE + TOTAL_ROUNDS + 5);
        // Reset tout en une seule batch de state — sans passer par cursor=0
        setRound(0);
        setPortfolio(10000);
        setAiPortfolio(10000);
        setPosition("none");
        setDecisions([]);
        setAiDecisions([]);
        setFeedback(null);
        setCursor(HISTORY_VISIBLE);
        setPhase("playing");
    };

    const makeDecision = (decision: Decision) => {
        const prices = pricesRef.current;
        const currentPrice = prices[cursor];
        const nextPrice = prices[cursor + 1] ?? currentPrice;
        const priceChange = nextPrice - currentPrice;
        const pctChange = priceChange / currentPrice;

        // Player portfolio update
        let newPortfolio = portfolio;
        if (decision === "BUY" && position === "none") {
            setPosition("long");
        } else if (decision === "SELL" && position === "long") {
            newPortfolio = portfolio * (1 + pctChange);
            setPosition("none");
        } else if (position === "long") {
            newPortfolio = portfolio * (1 + pctChange);
        }
        setPortfolio(Math.max(0, newPortfolio));

        // AI portfolio update
        const aiDec = aiDecision(prices, cursor);
        const newAiPortfolio = aiPortfolio * (1 + (aiDec === "BUY" ? 1 : aiDec === "SELL" ? -1 : 0) * Math.abs(pctChange));
        setAiPortfolio(Math.max(0, newAiPortfolio));

        // Feedback
        const feedbacks: Record<Decision, string> = {
            BUY: priceChange > 0 ? "✓ Good call — price went up!" : "✗ Price dropped after buy",
            SELL: priceChange < 0 ? "✓ Good exit — price fell!" : "✗ You sold too early",
            HOLD: Math.abs(priceChange) < 1 ? "✓ Smart — market was flat" : "~ Holding position",
        };
        setFeedback(feedbacks[decision]);
        setTimeout(() => setFeedback(null), 1500);

        setDecisions((prev) => [...prev, decision]);
        setAiDecisions((prev) => [...prev, aiDec]);

        const newRound = round + 1;
        setRound(newRound);
        setCursor((c) => c + 1);

        if (newRound >= TOTAL_ROUNDS) {
            setTimeout(() => {
                setPhase("result");
                unlockAchievement("TRADE_DONE");
                if (newPortfolio > newAiPortfolio) unlockAchievement("TRADE_WIN");
            }, 400);
        }
    };

    return (
        <section id="trade" className="relative py-32 px-6 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-yellow-950/5 to-transparent" />

            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <motion.div
                    className="mb-12 text-center"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="flex items-center justify-center gap-4 mb-3">
                        <div className="glow-line w-12" />
                        <span className="text-xs font-mono text-yellow-400 tracking-widest uppercase">
                            Mini-Jeu
                        </span>
                        <div className="glow-line w-12" />
                    </div>
                    <h2 className="text-3xl md:text-5xl font-black text-white/90 mb-3">
                        Trade Like Me
                    </h2>
                    <p className="text-white/40 max-w-md mx-auto text-sm">
                        Pouvez-vous battre mon algorithme de trading ? 8 décisions. 1 seul gagnant.
                    </p>
                </motion.div>

                <AnimatePresence mode="wait">
                    {/* INTRO */}
                    {phase === "intro" && (
                        <motion.div
                            key="intro"
                            className="glass rounded-2xl p-8 border border-yellow-400/15 text-center"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                        >
                            <div className="text-6xl mb-4">📈</div>
                            <h3 className="text-2xl font-bold text-white/90 mb-3">Défi Trading</h3>
                            <div className="space-y-2 text-sm text-white/50 mb-8 max-w-sm mx-auto">
                                <p>💰 Portfolio de départ : <span className="text-yellow-400 font-mono">$10,000</span></p>
                                <p>🤖 L&apos;algorithme joue en parallèle avec une stratégie momentum</p>
                                <p>📊 Vous avez 8 décisions : BUY / SELL / HOLD</p>
                                <p>🏆 Débloquez l&apos;achievement &quot;Quant Instinct&quot; si vous gagnez</p>
                            </div>
                            <motion.button
                                onClick={startGame}
                                className="px-8 py-3 rounded-xl font-bold text-black bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-300 hover:to-orange-300 transition-all"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                Commencer la partie →
                            </motion.button>
                        </motion.div>
                    )}

                    {/* PLAYING */}
                    {phase === "playing" && (
                        <motion.div
                            key="playing"
                            className="space-y-4"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            {/* HUD */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="glass rounded-xl p-3 border border-white/5 text-center">
                                    <div className="text-xs font-mono text-white/30 mb-1">Votre portfolio</div>
                                    <div className={`text-lg font-black font-mono ${portfolio > 10000 ? "text-emerald-400" : "text-red-400"}`}>
                                        ${portfolio.toFixed(0)}
                                    </div>
                                </div>
                                <div className="glass rounded-xl p-3 border border-white/5 text-center">
                                    <div className="text-xs font-mono text-white/30 mb-1">Round</div>
                                    <div className="text-lg font-black text-white/90">{round + 1}/{TOTAL_ROUNDS}</div>
                                </div>
                                <div className="glass rounded-xl p-3 border border-white/5 text-center">
                                    <div className="text-xs font-mono text-white/30 mb-1">Algo IA</div>
                                    <div className={`text-lg font-black font-mono ${aiPortfolio > 10000 ? "text-cyan-400" : "text-red-400"}`}>
                                        ${aiPortfolio.toFixed(0)}
                                    </div>
                                </div>
                            </div>

                            {/* Chart */}
                            <div className="glass rounded-2xl p-4 border border-white/8 relative">
                                <canvas
                                    ref={canvasRef}
                                    width={700}
                                    height={200}
                                    className="w-full rounded-xl"
                                />
                                {feedback && (
                                    <motion.div
                                        className="absolute top-4 left-1/2 -translate-x-1/2 glass px-4 py-2 rounded-lg border border-white/10 text-sm font-mono text-white/80"
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                    >
                                        {feedback}
                                    </motion.div>
                                )}
                            </div>

                            {/* Position indicator */}
                            <div className="text-center text-xs font-mono text-white/30">
                                Position actuelle:{" "}
                                <span className={position === "long" ? "text-emerald-400" : "text-white/40"}>
                                    {position === "long" ? "LONG 📈" : "FLAT —"}
                                </span>
                            </div>

                            {/* Decision buttons */}
                            <div className="grid grid-cols-3 gap-3">
                                {(["BUY", "SELL", "HOLD"] as Decision[]).map((dec) => (
                                    <motion.button
                                        key={dec}
                                        onClick={() => makeDecision(dec)}
                                        className={`py-4 rounded-xl font-bold text-sm border transition-all ${dec === "BUY"
                                            ? "border-emerald-400/30 text-emerald-400 hover:bg-emerald-400/15"
                                            : dec === "SELL"
                                                ? "border-red-400/30 text-red-400 hover:bg-red-400/15"
                                                : "border-white/15 text-white/60 hover:bg-white/8"
                                            }`}
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.97 }}
                                    >
                                        {dec === "BUY" ? "📈 BUY" : dec === "SELL" ? "📉 SELL" : "⏸ HOLD"}
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* RESULT */}
                    {phase === "result" && (
                        <motion.div
                            key="result"
                            className="glass rounded-2xl p-8 border border-white/10 text-center"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <div className="text-5xl mb-4">
                                {portfolio > aiPortfolio ? "🏆" : portfolio > 10000 ? "✅" : "💀"}
                            </div>
                            <h3 className="text-2xl font-bold text-white/90 mb-6">
                                {portfolio > aiPortfolio ? "Vous avez battu l'algorithme !" : "L'IA gagne cette fois..."}
                            </h3>

                            <div className="grid grid-cols-2 gap-4 mb-6 max-w-xs mx-auto">
                                <div className={`glass rounded-xl p-4 border ${portfolio > 10000 ? "border-emerald-400/20" : "border-red-400/20"}`}>
                                    <div className="text-xs font-mono text-white/30 mb-1">Vous</div>
                                    <div className={`text-xl font-black font-mono ${portfolio > 10000 ? "text-emerald-400" : "text-red-400"}`}>
                                        ${portfolio.toFixed(0)}
                                    </div>
                                    <div className="text-xs text-white/30">
                                        {portfolio > 10000 ? "+" : ""}{((portfolio / 10000 - 1) * 100).toFixed(1)}%
                                    </div>
                                </div>
                                <div className="glass rounded-xl p-4 border border-cyan-400/20">
                                    <div className="text-xs font-mono text-white/30 mb-1">Algorithme IA</div>
                                    <div className="text-xl font-black font-mono text-cyan-400">
                                        ${aiPortfolio.toFixed(0)}
                                    </div>
                                    <div className="text-xs text-white/30">
                                        {aiPortfolio > 10000 ? "+" : ""}{((aiPortfolio / 10000 - 1) * 100).toFixed(1)}%
                                    </div>
                                </div>
                            </div>

                            <p className="text-white/40 text-sm mb-6 max-w-md mx-auto">
                                Mon algorithme utilise une stratégie momentum : il achète quand le prix monte
                                et vend quand il baisse. Simple mais efficace sur 8 rounds.
                            </p>

                            <div className="flex items-center justify-center gap-4">
                                <motion.button
                                    onClick={startGame}
                                    className="px-6 py-3 rounded-xl border border-white/15 text-white/60 hover:text-white hover:border-white/30 text-sm font-medium transition-all"
                                    whileHover={{ scale: 1.03 }}
                                >
                                    Rejouer
                                </motion.button>
                                <motion.button
                                    onClick={() => document.querySelector("#projects")?.scrollIntoView({ behavior: "smooth" })}
                                    className="px-6 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-400 to-violet-500 text-black"
                                    whileHover={{ scale: 1.03 }}
                                >
                                    Voir mes projets →
                                </motion.button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </section>
    );
}
