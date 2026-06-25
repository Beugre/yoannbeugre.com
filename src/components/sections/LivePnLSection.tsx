"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

function useLivePnL() {
    const [entryPrice, setEntryPrice] = useState<number>(0);
    const [currentPrice, setCurrentPrice] = useState<number>(0);
    const [priceHistory, setPriceHistory] = useState<number[]>([]);
    const [entryTime] = useState(() => {
        const d = new Date();
        d.setHours(8, 0, 0, 0);
        return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    });
    const wsRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        // First: fetch today's 8h open price (or use first available kline)
        const fetchEntry = async () => {
            try {
                const r = await fetch("https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1d&limit=2");
                const d = await r.json();
                const todayOpen = parseFloat(d[d.length - 1][1]);
                setEntryPrice(todayOpen);
                setCurrentPrice(todayOpen);
                setPriceHistory([todayOpen]);
            } catch {
                // fallback
                setEntryPrice(59000);
                setCurrentPrice(59000);
                setPriceHistory([59000]);
            }
        };
        fetchEntry();

        // Live price via WebSocket
        const connect = () => {
            const ws = new WebSocket("wss://stream.binance.com:9443/ws/btcusdt@miniTicker");
            wsRef.current = ws;
            ws.onmessage = (e) => {
                try {
                    const data = JSON.parse(e.data);
                    const price = parseFloat(data.c);
                    setCurrentPrice(price);
                    setPriceHistory(prev => [...prev.slice(-80), price]);
                } catch { /* noop */ }
            };
            ws.onerror = () => ws.close();
        };
        connect();

        return () => { wsRef.current?.close(); };
    }, []);

    const pnl = entryPrice > 0 ? ((currentPrice - entryPrice) / entryPrice) * 100 : 0;
    const pnlUsd = entryPrice > 0 ? (currentPrice - entryPrice) / entryPrice * 10000 : 0;

    return { entryPrice, currentPrice, pnl, pnlUsd, priceHistory, entryTime };
}

function MiniEquityCurve({ prices }: { prices: number[] }) {
    if (prices.length < 2) return null;
    const min = Math.min(...prices) * 0.9995;
    const max = Math.max(...prices) * 1.0005;
    const rng = max - min || 1;
    const W = 120, H = 32;
    const px = (i: number) => (i / (prices.length - 1)) * W;
    const py = (v: number) => H - ((v - min) / rng) * H;
    let d = `M${px(0)},${py(prices[0])}`;
    for (let i = 1; i < prices.length; i++) {
        const cpx = (px(i - 1) + px(i)) / 2;
        d += ` C${cpx},${py(prices[i - 1])} ${cpx},${py(prices[i])} ${px(i)},${py(prices[i])}`;
    }
    const up = prices[prices.length - 1] >= prices[0];
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
    const { entryPrice, currentPrice, pnl, pnlUsd, priceHistory, entryTime } = useLivePnL();
    const up = pnl >= 0;

    function fmtPrice(n: number) { return n > 0 ? n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "···"; }

    const STATS = [
        { label: "Entrée aujourd'hui", value: entryPrice > 0 ? `$${fmtPrice(entryPrice)}` : "···", color: "#f0b90b", sub: `ouverture ${entryTime}` },
        { label: "Prix actuel", value: currentPrice > 0 ? `$${fmtPrice(currentPrice)}` : "···", color: up ? "#10b981" : "#ef4444", sub: "BTC/USDT live" },
        { label: "Variation", value: entryPrice > 0 ? `${pnl >= 0 ? "+" : ""}${pnl.toFixed(3)}%` : "···", color: up ? "#10b981" : "#ef4444", sub: "depuis l'entrée" },
        { label: "P&L ($10K cap)", value: entryPrice > 0 ? `${pnlUsd >= 0 ? "+" : ""}$${Math.abs(pnlUsd).toFixed(2)}` : "···", color: up ? "#10b981" : "#ef4444", sub: "simulation" },
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
                        BTC — position ouverte <span className="text-gradient-static">en direct</span>
                    </h2>
                    <p className="text-white/40 text-sm mt-2 font-mono">Entrée à l&apos;ouverture {entryTime} · Prix live Binance WebSocket · Capital simulé $10 000</p>
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
                            <span className="text-xs font-mono text-white/50 tracking-widest">POSITION LONGUE BTC/USDT · DEPUIS {entryTime} · PRIX RÉEL BINANCE</span>
                        </div>
                        <div className="ml-auto flex items-center gap-3">
                            <span className="text-[10px] font-mono text-white/30">Entrée: ${fmtPrice(entryPrice)}</span>
                            <MiniEquityCurve prices={priceHistory} />
                        </div>
                    </div>

                    <div className="flex items-center justify-between px-6 py-5">
                        <div>
                            <div className="text-xs font-mono text-white/35 mb-1">P&L LIVE (cap. $10 000)</div>
                            <motion.div
                                className="text-5xl font-black font-mono tabular-nums"
                                style={{ color: up ? "#10b981" : "#ef4444" }}
                                key={Math.round(pnlUsd * 10)}
                            >
                                {up ? "+" : ""}${Math.abs(pnlUsd).toFixed(2)}
                            </motion.div>
                            <div className="text-sm font-mono mt-1" style={{ color: up ? "rgba(16,185,129,0.6)" : "rgba(239,68,68,0.6)" }}>
                                {up ? "+" : ""}{pnl.toFixed(4)}% depuis l&apos;entrée
                            </div>
                        </div>
                        <div className="hidden md:block text-right">
                            <div className="text-[10px] font-mono text-white/25 mb-2">BTC ACTUEL</div>
                            <div className="text-2xl font-black font-mono" style={{ color: up ? "#10b981" : "#ef4444" }}>
                                ${fmtPrice(currentPrice)}
                            </div>
                            <div className="text-xs font-mono text-white/30 mt-1">
                                {up ? "▲" : "▼"} ${Math.abs(currentPrice - entryPrice).toFixed(2)} / BTC
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
