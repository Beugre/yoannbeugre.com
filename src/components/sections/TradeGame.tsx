"use client";

import { useEffect, useRef, useState } from "react";
import { unlockAchievement } from "@/lib/achievements";

const ROUNDS = 8;
const HISTORY = 24;

type Dec = "BUY" | "SELL" | "HOLD";
type Phase = "intro" | "loading" | "playing" | "result";
interface Candle { t: number; o: number; h: number; l: number; c: number; }
interface H { dec: Dec; pct: number; price: number; }

function fmt(n: number) { return n.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ","); }

function aiDecide(prices: number[], idx: number): Dec {
    if (idx < 4) return "HOLD";
    const fast = prices[idx] - prices[idx - 2];
    const slow = prices[idx] - prices[idx - 4];
    if (fast > 0 && slow > 0) return "BUY";
    if (fast < 0 && slow < 0) return "SELL";
    return "HOLD";
}

async function loadCandles(): Promise<Candle[]> {
    try {
        const r = await fetch(
            "https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=5m&limit=40",
            { cache: "no-store", signal: AbortSignal.timeout(4000) }
        );
        if (!r.ok) throw new Error();
        const d = await r.json() as unknown[][];
        return d.map(k => ({
            t: Number(k[0]),
            o: parseFloat(k[1] as string),
            h: parseFloat(k[2] as string),
            l: parseFloat(k[3] as string),
            c: parseFloat(k[4] as string),
        }));
    } catch {
        const base = 43500, p: Candle[] = [];
        let price = base;
        for (let i = 0; i < 40; i++) {
            const d = (Math.random() - 0.47) * 400;
            const o = price, c = Math.max(base * 0.8, o + d);
            p.push({ t: i, o, h: Math.max(o, c) + Math.random() * 100, l: Math.min(o, c) - Math.random() * 100, c });
            price = c;
        }
        return p;
    }
}

function CandleChart({ candles, cursor }: { candles: Candle[]; cursor: number }) {
    const slice = candles.slice(Math.max(0, cursor - HISTORY), cursor + 1);
    if (slice.length < 2) return null;
    const W = 600, H = 160, PL = 44, PR = 6, PT = 10, PB = 18;
    const IW = W - PL - PR, IH = H - PT - PB;
    const lows = slice.map(c => c.l), highs = slice.map(c => c.h);
    const lo = Math.min(...lows) * 0.9998, hi = Math.max(...highs) * 1.0002, rng = hi - lo;
    const px = (i: number) => PL + (i / (slice.length - 1)) * IW;
    const py = (v: number) => PT + IH - ((v - lo) / rng) * IH;
    const cw = Math.max(3, (IW / slice.length) * 0.55);
    const last = slice[slice.length - 1], first = slice[0];
    const up = last.c >= first.c;
    const ticks = [0.25, 0.5, 0.75].map(r => lo + r * rng);
    return (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 160 }} preserveAspectRatio="none">
            <defs>
                <filter id="glow3"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            </defs>
            {ticks.map((v, i) => (
                <g key={i}>
                    <line x1={PL} y1={py(v)} x2={W - PR} y2={py(v)} stroke="rgba(255,255,255,0.05)" strokeWidth="0.8"/>
                    <text x={PL - 3} y={py(v) + 3} textAnchor="end" fill="rgba(255,255,255,0.2)" fontSize="7.5" fontFamily="monospace">{(v / 1000).toFixed(1)}k</text>
                </g>
            ))}
            {slice.map((c, i) => {
                const x = px(i), isUp = c.c >= c.o, col = isUp ? "#10b981" : "#ef4444";
                const bTop = py(Math.max(c.o, c.c)), bH = Math.max(1.5, Math.abs(py(c.o) - py(c.c)));
                const cur = i === slice.length - 1;
                return (
                    <g key={i}>
                        <line x1={x} y1={py(c.h)} x2={x} y2={py(c.l)} stroke={col} strokeWidth={cur ? 1.5 : 0.8} opacity={cur ? 0.9 : 0.5}/>
                        <rect x={x - cw / 2} y={bTop} width={cw} height={bH} fill={col} opacity={cur ? 1 : 0.65} rx="0.5" filter={cur ? "url(#glow3)" : undefined}/>
                    </g>
                );
            })}
            <line x1={PL} y1={py(last.c)} x2={W - PR} y2={py(last.c)} stroke={up ? "rgba(16,185,129,0.35)" : "rgba(239,68,68,0.35)"} strokeWidth="0.8" strokeDasharray="3,2"/>
            <rect x={W - PR - 36} y={py(last.c) - 7} width={38} height={14} rx="2.5" fill={up ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"} stroke={up ? "rgba(16,185,129,0.5)" : "rgba(239,68,68,0.5)"} strokeWidth="0.5"/>
            <text x={W - PR - 17} y={py(last.c) + 3.5} textAnchor="middle" fill={up ? "#10b981" : "#ef4444"} fontSize="7" fontFamily="monospace" fontWeight="bold">{(last.c / 1000).toFixed(2)}k</text>
            <circle cx={px(slice.length - 1)} cy={py(last.c)} r="3.5" fill={up ? "#10b981" : "#ef4444"} filter="url(#glow3)">
                <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite"/>
            </circle>
        </svg>
    );
}

export default function TradeGame() {
    // All game state in one ref — no stale closures possible
    const candlesRef = useRef<Candle[]>([]);
    const cursorRef = useRef(HISTORY);
    const roundRef = useRef(0);
    const portfolioRef = useRef(10000);
    const aiRef = useRef(10000);
    const posRef = useRef<"none" | "long">("none");
    const entryRef = useRef(0);
    const histRef = useRef<H[]>([]);

    const [phase, setPhase] = useState<Phase>("intro");
    const [, forceUpdate] = useState(0);
    const [fb, setFb] = useState<{ text: string; good: boolean } | null>(null);
    const redraw = () => forceUpdate(n => n + 1);

    // Pre-load candles immediately when component mounts
    useEffect(() => {
        loadCandles().then(c => { candlesRef.current = c; });
    }, []);

    const startGame = () => {
        setPhase("loading");
        const doStart = (candles: Candle[]) => {
            candlesRef.current = candles;
            cursorRef.current = HISTORY;
            roundRef.current = 0;
            portfolioRef.current = 10000;
            aiRef.current = 10000;
            posRef.current = "none";
            entryRef.current = 0;
            histRef.current = [];
            setPhase("playing");
        };

        // If already loaded, start immediately
        if (candlesRef.current.length > 0) {
            doStart(candlesRef.current);
        } else {
            loadCandles().then(doStart);
        }
    };

    const decide = (dec: Dec) => {
        const cursor = cursorRef.current;
        const candles = candlesRef.current;
        const cur = candles[cursor];
        const nxt = candles[cursor + 1];
        if (!cur || !nxt) return;

        const pct = (nxt.c - cur.c) / cur.c;
        let p = portfolioRef.current;
        let pos = posRef.current;
        let entry = entryRef.current;

        if (dec === "BUY" && pos === "none") {
            pos = "long"; entry = cur.c;
        } else if (dec === "SELL" && pos === "long") {
            p = p * (1 + (cur.c - entry) / entry); pos = "none"; entry = 0;
        } else if (pos === "long") {
            const gain = (nxt.c - entry) / entry; p = p * (1 + gain); entry = nxt.c;
        }
        p = Math.max(0, p);

        const prices = candles.map(c => c.c);
        const ad = aiDecide(prices, cursor);
        let ai = aiRef.current;
        if (ad === "BUY") ai = ai * (1 + Math.abs(pct) * 0.8);
        else if (ad === "SELL") ai = ai * (1 + (pct < 0 ? Math.abs(pct) : -Math.abs(pct)) * 0.8);
        ai = Math.max(0, ai);

        const good = (dec === "BUY" && pct > 0) || (dec === "SELL" && pct < 0) || (dec === "HOLD" && Math.abs(pct) < 0.003);
        const msgs: Record<Dec, string> = {
            BUY: pct > 0 ? `✓ BUY +${(pct * 100).toFixed(2)}%` : `✗ BUY ${(pct * 100).toFixed(2)}%`,
            SELL: pct < 0 ? `✓ SELL ${(pct * 100).toFixed(2)}%` : `✗ Trop tôt +${(pct * 100).toFixed(2)}%`,
            HOLD: `${good ? "✓" : "~"} HOLD ${(pct * 100).toFixed(2)}%`,
        };
        setFb({ text: msgs[dec], good });
        setTimeout(() => setFb(null), 1800);

        cursorRef.current = cursor + 1;
        roundRef.current = roundRef.current + 1;
        portfolioRef.current = p;
        aiRef.current = ai;
        posRef.current = pos;
        entryRef.current = entry;
        histRef.current = [...histRef.current, { dec, pct, price: cur.c }];
        redraw();

        if (roundRef.current >= ROUNDS) {
            setTimeout(() => {
                setPhase("result");
                unlockAchievement("TRADE_DONE");
                if (p > ai) unlockAchievement("TRADE_WIN");
            }, 500);
        }
    };

    const portfolio = portfolioRef.current;
    const aiPortfolio = aiRef.current;
    const pnl = portfolio - 10000;
    const round = roundRef.current;
    const candles = candlesRef.current;
    const cursor = cursorRef.current;
    const position = posRef.current;
    const history = histRef.current;
    const curCandle = candles[cursor];
    const prevCandle = candles[cursor - 1];
    const won = portfolio > aiPortfolio;

    return (
        <section id="trade" className="relative py-32 px-6 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-yellow-950/8 to-transparent pointer-events-none" />
            <div className="max-w-3xl mx-auto relative z-10">

                {/* Header — NO framer-motion to avoid pointer-events issues */}
                <div className="mb-10 text-center">
                    <div className="flex items-center justify-center gap-4 mb-3">
                        <div className="glow-line w-12" />
                        <span className="text-xs font-mono text-yellow-400 tracking-widest uppercase">Mini-Jeu</span>
                        <div className="glow-line w-12" />
                    </div>
                    <h2 className="text-3xl md:text-5xl font-black text-white/90 mb-1">Trade Like Me</h2>
                    <p className="text-white/40 text-sm">Données réelles BTC/USDT · Battez mon algorithme</p>
                </div>

                {/* ── INTRO ── */}
                {phase === "intro" && (
                    <div className="glass rounded-2xl border border-yellow-400/20 overflow-hidden">
                        <div className="relative h-28 overflow-hidden pointer-events-none">
                            <svg viewBox="0 0 600 100" className="w-full h-full" preserveAspectRatio="none">
                                <defs><linearGradient id="ig3" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="rgba(16,185,129,0.2)"/><stop offset="100%" stopColor="transparent"/></linearGradient></defs>
                                <path d="M0,70 C40,60 70,80 110,50 C150,20 180,45 220,32 C260,19 290,48 330,30 C370,12 410,38 450,20 C490,5 530,15 600,8 L600,100 L0,100Z" fill="url(#ig3)"/>
                                <path d="M0,70 C40,60 70,80 110,50 C150,20 180,45 220,32 C260,19 290,48 330,30 C370,12 410,38 450,20 C490,5 530,15 600,8" fill="none" stroke="#10b981" strokeWidth="1.5"/>
                            </svg>
                            <div className="absolute inset-0 bg-gradient-to-t from-[#030712] to-transparent" />
                            <div className="absolute bottom-2 left-4 flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                <span className="text-[10px] font-mono text-emerald-400">BTC/USDT · LIVE DATA · Binance</span>
                            </div>
                        </div>
                        <div className="p-8 text-center">
                            <h3 className="text-xl font-bold text-white/90 mb-1">Êtes-vous plus fort que l&apos;IA ?</h3>
                            <p className="text-white/40 text-sm mb-6">Chandelles 5 min réelles · Mon algo dual-momentum joue contre vous</p>
                            <div className="grid grid-cols-4 gap-2 max-w-xs mx-auto mb-7">
                                {[["$10K","Capital"],["5m","Interval"],[String(ROUNDS),"Rounds"],["IA","Adversaire"]].map(([v,l]) => (
                                    <div key={l} className="glass rounded-lg p-2 border border-white/5 text-center">
                                        <div className="text-sm font-black text-yellow-400">{v}</div>
                                        <div className="text-[9px] text-white/30 font-mono">{l}</div>
                                    </div>
                                ))}
                            </div>
                            {/* THE BUTTON — maximum simplicity, no interference */}
                            <button
                                type="button"
                                onClick={startGame}
                                style={{
                                    cursor: "pointer",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "10px",
                                    padding: "14px 36px",
                                    borderRadius: "12px",
                                    fontWeight: 900,
                                    fontSize: "16px",
                                    color: "#000",
                                    background: "linear-gradient(135deg, #facc15, #f97316)",
                                    border: "none",
                                    position: "relative",
                                    zIndex: 100,
                                }}
                            >
                                <span>🚀</span>
                                <span>Lancer la simulation</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* ── LOADING ── */}
                {phase === "loading" && (
                    <div className="glass rounded-2xl border border-yellow-400/20 p-16 text-center">
                        <div className="flex items-center justify-center gap-3 mb-3">
                            <div className="w-5 h-5 border-2 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin" />
                            <span className="font-mono text-yellow-400">Chargement BTC/USDT...</span>
                        </div>
                    </div>
                )}

                {/* ── PLAYING ── */}
                {phase === "playing" && candles.length > 0 && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-3">
                            <div className={`glass rounded-xl p-3 border ${pnl >= 0 ? "border-emerald-400/20" : "border-red-400/20"}`}>
                                <div className="text-[10px] font-mono text-white/30 mb-0.5">VOUS</div>
                                <div className={`text-lg font-black font-mono ${pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>${fmt(portfolio)}</div>
                                <div className={`text-[10px] font-mono ${pnl >= 0 ? "text-emerald-400/70" : "text-red-400/70"}`}>{pnl >= 0 ? "+" : ""}{((pnl / 10000) * 100).toFixed(2)}%</div>
                            </div>
                            <div className="glass rounded-xl p-3 border border-white/8 text-center">
                                <div className="text-[10px] font-mono text-white/30 mb-1.5">ROUND {round + 1}/{ROUNDS}</div>
                                <div className="flex gap-1 justify-center">
                                    {Array.from({ length: ROUNDS }).map((_, i) => {
                                        const h = history[i], done = i < round;
                                        const good = done && h && ((h.dec==="BUY"&&h.pct>0)||(h.dec==="SELL"&&h.pct<0)||(h.dec==="HOLD"&&Math.abs(h.pct)<0.003));
                                        return <div key={i} className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: done ? (good ? "#10b981" : "#ef4444") : i===round ? "#facc15" : "rgba(255,255,255,0.08)" }} />;
                                    })}
                                </div>
                            </div>
                            <div className={`glass rounded-xl p-3 border ${aiPortfolio >= 10000 ? "border-cyan-400/20" : "border-red-400/20"}`}>
                                <div className="text-[10px] font-mono text-white/30 mb-0.5">ALGO IA</div>
                                <div className={`text-lg font-black font-mono ${aiPortfolio >= 10000 ? "text-cyan-400" : "text-red-400"}`}>${fmt(aiPortfolio)}</div>
                                <div className={`text-[10px] font-mono ${aiPortfolio >= 10000 ? "text-cyan-400/70" : "text-red-400/70"}`}>{aiPortfolio >= 10000 ? "+" : ""}{((aiPortfolio / 10000 - 1) * 100).toFixed(2)}%</div>
                            </div>
                        </div>

                        <div className="glass rounded-2xl border border-white/8 p-4 relative">
                            <div className="pointer-events-none absolute inset-0 rounded-2xl" style={{ background: curCandle && prevCandle && curCandle.c >= prevCandle.c ? "radial-gradient(ellipse at 90% 50%, rgba(16,185,129,0.06) 0%, transparent 60%)" : "radial-gradient(ellipse at 90% 50%, rgba(239,68,68,0.06) 0%, transparent 60%)" }} />
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    <span className="text-[10px] font-mono text-white/40">BTC/USDT · 5m · Binance</span>
                                </div>
                                {curCandle && prevCandle && (
                                    <div className={curCandle.c >= prevCandle.c ? "text-emerald-400" : "text-red-400"}>
                                        <span className="text-base font-black font-mono">${fmt(curCandle.c)}</span>
                                        <span className="text-xs font-mono ml-1.5 opacity-70">{curCandle.c >= prevCandle.c ? "▲" : "▼"}{Math.abs((curCandle.c - prevCandle.c) / prevCandle.c * 100).toFixed(3)}%</span>
                                    </div>
                                )}
                            </div>
                            <CandleChart candles={candles} cursor={cursor} />
                            {fb && (
                                <div className="absolute top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-xl border backdrop-blur-md text-sm font-mono font-bold whitespace-nowrap z-10 pointer-events-none"
                                    style={{ background: fb.good ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.12)", borderColor: fb.good ? "rgba(16,185,129,0.5)" : "rgba(239,68,68,0.5)", color: fb.good ? "#10b981" : "#ef4444", boxShadow: fb.good ? "0 0 20px rgba(16,185,129,0.2)" : "0 0 20px rgba(239,68,68,0.2)" }}>
                                    {fb.text}
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-between px-1 text-xs font-mono text-white/30">
                            <span>Position : <span className={position === "long" ? "text-emerald-400 font-bold" : ""}>{position === "long" ? `LONG @ $${fmt(entryRef.current)}` : "FLAT"}</span></span>
                            <span>{ROUNDS - round} restants</span>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            {([
                                { dec: "BUY" as Dec, emoji: "📈", label: "BUY", bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.4)", color: "#10b981" },
                                { dec: "SELL" as Dec, emoji: "📉", label: "SELL", bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.4)", color: "#ef4444" },
                                { dec: "HOLD" as Dec, emoji: "⏸", label: "HOLD", bg: "rgba(148,163,184,0.06)", border: "rgba(148,163,184,0.25)", color: "#94a3b8" },
                            ]).map(({ dec, emoji, label, bg, border, color }) => (
                                <button key={dec} type="button" onClick={() => decide(dec)}
                                    style={{ cursor: "pointer", background: bg, border: `1.5px solid ${border}`, color, position: "relative", zIndex: 10 }}
                                    className="py-5 rounded-xl font-black flex flex-col items-center gap-1.5 hover:scale-105 active:scale-95 transition-transform">
                                    <span style={{ fontSize: 26 }}>{emoji}</span>
                                    <span style={{ fontSize: 13, letterSpacing: 2 }}>{label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── RESULT ── */}
                {phase === "result" && (
                    <div className="glass rounded-2xl border border-white/10 overflow-hidden">
                        <div className={`py-10 text-center ${won ? "bg-gradient-to-br from-emerald-500/10 to-cyan-500/10" : "bg-gradient-to-br from-red-500/10 to-orange-500/10"}`}>
                            <div className="text-7xl mb-3">{won ? "🏆" : pnl > 0 ? "✅" : "💀"}</div>
                            <h3 className="text-3xl font-black text-white/90">{won ? "Vous battez l'algorithme !" : "L'IA vous écrase"}</h3>
                            <p className={`font-mono mt-2 text-lg ${pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>{pnl >= 0 ? "+" : ""}${Math.abs(pnl).toFixed(0)} ({pnl >= 0 ? "+" : ""}{((pnl / 10000) * 100).toFixed(2)}%)</p>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                {[{ l: "Vous", v: portfolio, c: won ? "#10b981" : "#ef4444" }, { l: "Algo IA", v: aiPortfolio, c: won ? "#64748b" : "#00d4ff" }].map(({ l, v, c }) => (
                                    <div key={l} className="glass rounded-xl p-4 border border-white/5">
                                        <div className="text-xs font-mono text-white/30 mb-1">{l}</div>
                                        <div className="text-2xl font-black font-mono" style={{ color: c }}>${fmt(v)}</div>
                                    </div>
                                ))}
                            </div>
                            <div>
                                <div className="text-xs font-mono text-white/30 mb-2">VOS DÉCISIONS</div>
                                <div className="flex gap-2 flex-wrap">
                                    {history.map((h, i) => {
                                        const good = (h.dec==="BUY"&&h.pct>0)||(h.dec==="SELL"&&h.pct<0)||(h.dec==="HOLD"&&Math.abs(h.pct)<0.003);
                                        return <div key={i} className="px-3 py-1 rounded-lg text-xs font-mono font-bold border" style={{ background: good ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", borderColor: good ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)", color: good ? "#10b981" : "#ef4444" }}>{good ? "✓" : "✗"} {h.dec}</div>;
                                    })}
                                </div>
                            </div>
                            <div className="flex gap-3 pt-1">
                                <button type="button" onClick={startGame} style={{ cursor: "pointer", zIndex: 10, position: "relative" }} className="flex-1 py-3 rounded-xl border border-white/15 text-white/60 hover:text-white font-medium text-sm transition-all">Rejouer</button>
                                <button type="button" onClick={() => document.querySelector("#projects")?.scrollIntoView({ behavior: "smooth" })} style={{ cursor: "pointer", zIndex: 10, position: "relative" }} className="flex-1 py-3 rounded-xl font-bold text-sm text-black bg-gradient-to-r from-cyan-400 to-violet-500 hover:opacity-90 transition-all">Voir mes projets →</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
