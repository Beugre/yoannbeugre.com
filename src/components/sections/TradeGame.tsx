"use client";

import { useEffect, useState } from "react";
import { unlockAchievement } from "@/lib/achievements";

const ROUNDS = 8;
const VIS = 20;

type Dec = "BUY" | "SELL" | "HOLD";

interface Candle { o: number; h: number; l: number; c: number; }

interface GameState {
  candles: Candle[];
  cursor: number;
  round: number;
  portfolio: number;
  ai: number;
  pos: "none" | "long";
  entry: number;
  log: { dec: Dec; pct: number }[];
}

function fmt(n: number) { return n.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ","); }

async function fetchCandles(): Promise<Candle[]> {
  try {
    const r = await fetch(
      "https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=5m&limit=40",
      { cache: "no-store", signal: AbortSignal.timeout(4000) }
    );
    if (!r.ok) throw new Error();
    const d: unknown[][] = await r.json();
    return d.map(k => ({
      o: +String(k[1]), h: +String(k[2]),
      l: +String(k[3]), c: +String(k[4]),
    }));
  } catch {
    let p = 43500;
    return Array.from({ length: 40 }, () => {
      const o = p, d = (Math.random() - 0.47) * 380, c = Math.max(38000, o + d);
      const h = Math.max(o, c) + Math.random() * 90;
      const l = Math.min(o, c) - Math.random() * 90;
      p = c; return { o, h, l, c };
    });
  }
}

function aiMove(candles: Candle[], idx: number): Dec {
  if (idx < 4) return "HOLD";
  const fast = candles[idx].c - candles[idx - 2].c;
  const slow = candles[idx].c - candles[idx - 4].c;
  if (fast > 150 && slow > 0) return "BUY";
  if (fast < -150 && slow < 0) return "SELL";
  return "HOLD";
}

// ─── Chart: real candlestick bars ───────────────────────────────────────────
function Chart({ candles, cursor }: { candles: Candle[]; cursor: number }) {
  const slice = candles.slice(Math.max(0, cursor - VIS), cursor + 1);
  if (slice.length < 2) return <div className="h-44 flex items-center justify-center text-white/20 font-mono text-sm">Chargement…</div>;

  const lows = slice.map(c => c.l), highs = slice.map(c => c.h);
  const lo = Math.min(...lows), hi = Math.max(...highs), rng = hi - lo || 1;
  const last = slice[slice.length - 1];
  const first = slice[0];
  const W = 600, H = 140, ML = 48, MT = 8, MB = 4, IH = H - MT - MB;
  const IW = W - ML - 4;
  const px = (i: number) => ML + (i / (slice.length - 1)) * IW;
  const py = (v: number) => MT + IH - ((v - lo) / rng) * IH;
  const cw = Math.max(4, IW / slice.length * 0.55);
  const up = last.c >= first.c;
  const ticks = [0, 0.33, 0.66, 1].map(r => lo + r * rng);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 160 }} preserveAspectRatio="none">
      <defs>
        <filter id="cg"><feGaussianBlur stdDeviation="2.5" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      {ticks.map((v, i) => (
        <g key={i}>
          <line x1={ML} y1={py(v)} x2={W} y2={py(v)} stroke="rgba(255,255,255,0.04)" strokeWidth="0.8" />
          <text x={ML - 3} y={py(v) + 3} textAnchor="end" fill="rgba(255,255,255,0.18)" fontSize="7.5" fontFamily="monospace">{(v / 1000).toFixed(1)}k</text>
        </g>
      ))}
      {slice.map((c, i) => {
        const x = px(i), up2 = c.c >= c.o, col = up2 ? "#10b981" : "#ef4444";
        const bT = py(Math.max(c.o, c.c)), bH = Math.max(1.5, Math.abs(py(c.o) - py(c.c)));
        const isCur = i === slice.length - 1;
        return (
          <g key={i}>
            <line x1={x} y1={py(c.h)} x2={x} y2={py(c.l)} stroke={col} strokeWidth={isCur ? 1.5 : 0.8} opacity={isCur ? 1 : 0.55} />
            <rect x={x - cw / 2} y={bT} width={cw} height={bH} fill={col} opacity={isCur ? 1 : 0.65} rx="0.5" filter={isCur ? "url(#cg)" : undefined} />
          </g>
        );
      })}
      <line x1={ML} y1={py(last.c)} x2={W} y2={py(last.c)} stroke={up ? "rgba(16,185,129,0.35)" : "rgba(239,68,68,0.35)"} strokeWidth="0.7" strokeDasharray="3,2" />
      <rect x={W - 38} y={py(last.c) - 7} width={38} height={14} rx="2" fill={up ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"} stroke={up ? "#10b981" : "#ef4444"} strokeWidth="0.5" />
      <text x={W - 19} y={py(last.c) + 3.5} textAnchor="middle" fill={up ? "#10b981" : "#ef4444"} fontSize="7" fontFamily="monospace" fontWeight="bold">{(last.c / 1000).toFixed(2)}k</text>
      <circle cx={px(slice.length - 1)} cy={py(last.c)} r="3.5" fill={up ? "#10b981" : "#ef4444"} filter="url(#cg)">
        <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
type Phase = "intro" | "playing" | "result";

const INIT: GameState = { candles: [], cursor: VIS, round: 0, portfolio: 10000, ai: 10000, pos: "none", entry: 0, log: [] };

export default function TradeGame() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [g, setG] = useState<GameState>(INIT);
  const [fb, setFb] = useState<{ text: string; good: boolean } | null>(null);
  const [loading, setLoading] = useState(false);

  // Pre-load on mount
  useEffect(() => {
    fetchCandles().then(candles => setG(prev => ({ ...prev, candles })));
  }, []);

  const start = () => {
    setLoading(true);
    const go = (candles: Candle[]) => {
      setG({ ...INIT, candles });
      setFb(null);
      setLoading(false);
      setPhase("playing");
    };
    if (g.candles.length > 0) { go(g.candles); return; }
    fetchCandles().then(go).catch(() => { setLoading(false); });
  };

  const decide = (dec: Dec) => {
    setG(prev => {
      if (prev.round >= ROUNDS) return prev;
      const cur = prev.candles[prev.cursor];
      const nxt = prev.candles[prev.cursor + 1];
      if (!cur || !nxt) return prev;

      const pct = (nxt.c - cur.c) / cur.c;
      let p = prev.portfolio, pos = prev.pos, entry = prev.entry;

      if (dec === "BUY" && pos === "none") { pos = "long"; entry = cur.c; }
      else if (dec === "SELL" && pos === "long") { p = p * (1 + (cur.c - entry) / entry); pos = "none"; entry = 0; }
      else if (pos === "long") { p = p * (1 + (nxt.c - entry) / entry); entry = nxt.c; }
      p = Math.max(0, p);

      const ad = aiMove(prev.candles, prev.cursor);
      let ai = prev.ai;
      if (ad === "BUY") ai *= (1 + Math.abs(pct) * 0.75);
      else if (ad === "SELL") ai *= (1 + (pct < 0 ? Math.abs(pct) : -Math.abs(pct)) * 0.75);
      ai = Math.max(0, ai);

      const good = (dec === "BUY" && pct > 0) || (dec === "SELL" && pct < 0) || (dec === "HOLD" && Math.abs(pct) < 0.003);
      const sign = pct >= 0 ? "+" : "";
      const msgs: Record<Dec, string> = {
        BUY: `${pct > 0 ? "✓" : "✗"} BUY ${sign}${(pct * 100).toFixed(2)}%`,
        SELL: `${pct < 0 ? "✓" : "✗"} SELL ${sign}${(pct * 100).toFixed(2)}%`,
        HOLD: `${good ? "✓" : "~"} HOLD ${sign}${(pct * 100).toFixed(2)}%`,
      };
      setFb({ text: msgs[dec], good });
      setTimeout(() => setFb(null), 1600);

      const nr = prev.round + 1;
      const next: GameState = { ...prev, cursor: prev.cursor + 1, round: nr, portfolio: p, ai, pos, entry, log: [...prev.log, { dec, pct }] };

      if (nr >= ROUNDS) {
        setTimeout(() => {
          setPhase("result");
          unlockAchievement("TRADE_DONE");
          if (p > ai) unlockAchievement("TRADE_WIN");
        }, 400);
      }
      return next;
    });
  };

  const pnl = g.portfolio - 10000;
  const cur = g.candles[g.cursor];
  const prev2 = g.candles[g.cursor - 1];
  const won = g.portfolio > g.ai;

  return (
    <section id="trade" className="relative py-32 px-6">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-yellow-950/8 to-transparent pointer-events-none" />
      <div className="max-w-3xl mx-auto" style={{ position: "relative", zIndex: 1 }}>

        <div className="mb-10 text-center">
          <div className="flex items-center justify-center gap-4 mb-3">
            <div className="glow-line w-12" />
            <span className="text-xs font-mono text-yellow-400 tracking-widest uppercase">Mini-Jeu</span>
            <div className="glow-line w-12" />
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-white/90 mb-1">Trade Like Me</h2>
          <p className="text-white/40 text-sm">Vraies données BTC/USDT · Battez mon algorithme</p>
        </div>

        {/* INTRO */}
        {phase === "intro" && (
          <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 16, border: "1px solid rgba(250,204,21,0.2)", overflow: "hidden" }}>
            <div style={{ height: 110, overflow: "hidden", position: "relative", pointerEvents: "none" }}>
              <svg viewBox="0 0 600 100" style={{ width: "100%", height: "100%" }} preserveAspectRatio="none">
                <defs><linearGradient id="ig4" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="rgba(16,185,129,0.2)" /><stop offset="100%" stopColor="transparent" /></linearGradient></defs>
                <path d="M0,70 C40,60 70,80 110,50 C150,20 180,45 220,32 C260,19 290,48 330,30 C370,12 410,38 450,20 C490,5 530,15 600,8 L600,100 L0,100Z" fill="url(#ig4)" />
                <path d="M0,70 C40,60 70,80 110,50 C150,20 180,45 220,32 C260,19 290,48 330,30 C370,12 410,38 450,20 C490,5 530,15 600,8" fill="none" stroke="#10b981" strokeWidth="1.5" />
              </svg>
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #030712, transparent)" }} />
              <div style={{ position: "absolute", bottom: 8, left: 16, display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", animation: "pulse 1s infinite" }} />
                <span style={{ fontFamily: "monospace", fontSize: 10, color: "#10b981" }}>BTC/USDT · LIVE · Binance</span>
              </div>
            </div>
            <div style={{ padding: "28px 32px", textAlign: "center" }}>
              <h3 style={{ fontSize: 20, fontWeight: 900, color: "rgba(255,255,255,0.9)", marginBottom: 6 }}>Êtes-vous plus fort que l&apos;IA ?</h3>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 24 }}>Chandelles réelles 5 min · Mon algo dual-momentum vous affronte</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, maxWidth: 280, margin: "0 auto 24px" }}>
                {[["$10K","Capital"],["5m","Interval"],[`${ROUNDS}`,"Rounds"],["IA","Adversaire"]].map(([v,l]) => (
                  <div key={l} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.07)", padding: "8px 4px", textAlign: "center" }}>
                    <div style={{ fontSize: 13, fontWeight: 900, color: "#facc15" }}>{v}</div>
                    <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>{l}</div>
                  </div>
                ))}
              </div>
              <button type="button" onClick={start} disabled={loading}
                style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 10, padding: "14px 36px", borderRadius: 12, fontWeight: 900, fontSize: 16, color: "#000", background: "linear-gradient(135deg,#facc15,#f97316)", border: "none", opacity: loading ? 0.6 : 1 }}>
                {loading ? "⏳ Chargement…" : "🚀 Lancer la simulation"}
              </button>
            </div>
          </div>
        )}

        {/* PLAYING */}
        {phase === "playing" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* HUD */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              {/* Player */}
              <div style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${pnl >= 0 ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}`, borderRadius: 12, padding: "10px 12px" }}>
                <div style={{ fontSize: 9, fontFamily: "monospace", color: "rgba(255,255,255,0.3)", marginBottom: 2 }}>VOUS</div>
                <div style={{ fontSize: 20, fontWeight: 900, fontFamily: "monospace", color: pnl >= 0 ? "#10b981" : "#ef4444" }}>${fmt(g.portfolio)}</div>
                <div style={{ fontSize: 9, fontFamily: "monospace", color: pnl >= 0 ? "rgba(16,185,129,0.7)" : "rgba(239,68,68,0.7)" }}>{pnl >= 0 ? "+" : ""}{((pnl / 10000) * 100).toFixed(2)}%</div>
              </div>
              {/* Round */}
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "10px 12px", textAlign: "center" }}>
                <div style={{ fontSize: 9, fontFamily: "monospace", color: "rgba(255,255,255,0.3)", marginBottom: 6 }}>ROUND {g.round + 1}/{ROUNDS}</div>
                <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
                  {Array.from({ length: ROUNDS }).map((_, i) => {
                    const h = g.log[i], done = i < g.round;
                    const good = done && h && ((h.dec === "BUY" && h.pct > 0) || (h.dec === "SELL" && h.pct < 0) || (h.dec === "HOLD" && Math.abs(h.pct) < 0.003));
                    return <div key={i} style={{ width: 10, height: 10, borderRadius: 3, background: done ? (good ? "#10b981" : "#ef4444") : i === g.round ? "#facc15" : "rgba(255,255,255,0.08)" }} />;
                  })}
                </div>
              </div>
              {/* AI */}
              <div style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${g.ai >= 10000 ? "rgba(0,212,255,0.25)" : "rgba(239,68,68,0.25)"}`, borderRadius: 12, padding: "10px 12px" }}>
                <div style={{ fontSize: 9, fontFamily: "monospace", color: "rgba(255,255,255,0.3)", marginBottom: 2 }}>ALGO IA</div>
                <div style={{ fontSize: 20, fontWeight: 900, fontFamily: "monospace", color: g.ai >= 10000 ? "#00d4ff" : "#ef4444" }}>${fmt(g.ai)}</div>
                <div style={{ fontSize: 9, fontFamily: "monospace", color: g.ai >= 10000 ? "rgba(0,212,255,0.7)" : "rgba(239,68,68,0.7)" }}>{g.ai >= 10000 ? "+" : ""}{((g.ai / 10000 - 1) * 100).toFixed(2)}%</div>
              </div>
            </div>

            {/* Chart */}
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "14px 16px", position: "relative" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981" }} />
                  <span style={{ fontFamily: "monospace", fontSize: 9, color: "rgba(255,255,255,0.35)" }}>BTC/USDT · 5m · Binance</span>
                </div>
                {cur && prev2 && (
                  <div style={{ color: cur.c >= prev2.c ? "#10b981" : "#ef4444", textAlign: "right" }}>
                    <span style={{ fontFamily: "monospace", fontWeight: 900, fontSize: 15 }}>${fmt(cur.c)}</span>
                    <span style={{ fontFamily: "monospace", fontSize: 10, marginLeft: 6, opacity: 0.7 }}>
                      {cur.c >= prev2.c ? "▲" : "▼"}{Math.abs((cur.c - prev2.c) / prev2.c * 100).toFixed(3)}%
                    </span>
                  </div>
                )}
              </div>
              <Chart candles={g.candles} cursor={g.cursor} />
              {fb && (
                <div style={{ position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)", padding: "6px 16px", borderRadius: 10, border: `1px solid ${fb.good ? "rgba(16,185,129,0.5)" : "rgba(239,68,68,0.5)"}`, background: fb.good ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.12)", color: fb.good ? "#10b981" : "#ef4444", fontFamily: "monospace", fontSize: 13, fontWeight: 700, whiteSpace: "nowrap", pointerEvents: "none" }}>
                  {fb.text}
                </div>
              )}
            </div>

            {/* Position */}
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "monospace", fontSize: 11, color: "rgba(255,255,255,0.3)", padding: "0 4px" }}>
              <span>Position : <span style={{ color: g.pos === "long" ? "#10b981" : undefined, fontWeight: g.pos === "long" ? 700 : 400 }}>{g.pos === "long" ? `LONG @ $${fmt(g.entry)}` : "FLAT"}</span></span>
              <span>{ROUNDS - g.round} rounds restants</span>
            </div>

            {/* Buttons */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              {([
                { dec: "BUY" as Dec, e: "📈", l: "BUY", bg: "rgba(16,185,129,0.12)", bd: "rgba(16,185,129,0.4)", c: "#10b981" },
                { dec: "SELL" as Dec, e: "📉", l: "SELL", bg: "rgba(239,68,68,0.12)", bd: "rgba(239,68,68,0.4)", c: "#ef4444" },
                { dec: "HOLD" as Dec, e: "⏸", l: "HOLD", bg: "rgba(148,163,184,0.06)", bd: "rgba(148,163,184,0.3)", c: "#94a3b8" },
              ]).map(({ dec, e, l, bg, bd, c }) => (
                <button key={dec} type="button" onClick={() => decide(dec)}
                  style={{ cursor: "pointer", background: bg, border: `1.5px solid ${bd}`, borderRadius: 14, padding: "18px 8px", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, color: c, fontWeight: 900 }}>
                  <span style={{ fontSize: 28 }}>{e}</span>
                  <span style={{ fontFamily: "monospace", fontSize: 14, letterSpacing: 2 }}>{l}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* RESULT */}
        {phase === "result" && (
          <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.1)", overflow: "hidden" }}>
            <div style={{ padding: "40px 32px", textAlign: "center", background: won ? "linear-gradient(135deg,rgba(16,185,129,0.08),rgba(0,212,255,0.05))" : "linear-gradient(135deg,rgba(239,68,68,0.08),rgba(251,146,60,0.05))" }}>
              <div style={{ fontSize: 64, marginBottom: 12 }}>{won ? "🏆" : pnl > 0 ? "✅" : "💀"}</div>
              <h3 style={{ fontSize: 28, fontWeight: 900, color: "rgba(255,255,255,0.9)", marginBottom: 8 }}>{won ? "Vous battez l'algorithme !" : "L'IA vous écrase"}</h3>
              <p style={{ fontFamily: "monospace", fontSize: 18, color: pnl >= 0 ? "#10b981" : "#ef4444" }}>{pnl >= 0 ? "+" : ""}${Math.abs(pnl).toFixed(0)} ({pnl >= 0 ? "+" : ""}{((pnl / 10000) * 100).toFixed(2)}%)</p>
            </div>
            <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[{ l: "Vous", v: g.portfolio, c: won ? "#10b981" : "#ef4444" }, { l: "Algo IA", v: g.ai, c: won ? "#64748b" : "#00d4ff" }].map(({ l, v, c }) => (
                  <div key={l} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 16 }}>
                    <div style={{ fontSize: 10, fontFamily: "monospace", color: "rgba(255,255,255,0.3)", marginBottom: 4 }}>{l}</div>
                    <div style={{ fontSize: 24, fontWeight: 900, fontFamily: "monospace", color: c }}>${fmt(v)}</div>
                  </div>
                ))}
              </div>
              <div>
                <div style={{ fontSize: 10, fontFamily: "monospace", color: "rgba(255,255,255,0.3)", marginBottom: 8 }}>VOS DÉCISIONS</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {g.log.map((h, i) => {
                    const good = (h.dec === "BUY" && h.pct > 0) || (h.dec === "SELL" && h.pct < 0) || (h.dec === "HOLD" && Math.abs(h.pct) < 0.003);
                    return <div key={i} style={{ padding: "4px 10px", borderRadius: 8, border: `1px solid ${good ? "rgba(16,185,129,0.35)" : "rgba(239,68,68,0.35)"}`, background: good ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", color: good ? "#10b981" : "#ef4444", fontFamily: "monospace", fontSize: 11, fontWeight: 700 }}>{good ? "✓" : "✗"} {h.dec}</div>;
                  })}
                </div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button type="button" onClick={start} style={{ cursor: "pointer", flex: 1, padding: "12px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.15)", background: "transparent", color: "rgba(255,255,255,0.6)", fontWeight: 600, fontSize: 14 }}>Rejouer</button>
                <button type="button" onClick={() => document.querySelector("#projects")?.scrollIntoView({ behavior: "smooth" })} style={{ cursor: "pointer", flex: 1, padding: "12px", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#00d4ff,#8b5cf6)", color: "#000", fontWeight: 900, fontSize: 14 }}>Voir mes projets →</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
