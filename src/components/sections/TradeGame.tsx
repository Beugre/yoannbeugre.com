"use client";

import { useCallback, useEffect, useState } from "react";
import { unlockAchievement } from "@/lib/achievements";

const ROUNDS = 8;
const VIS = 18;

type Dec = "BUY" | "SELL" | "HOLD";
interface Candle { o: number; h: number; l: number; c: number; v: number; }
interface Round { dec: Dec; aiDec: Dec; pct: number; price: number; good: boolean; }
interface GS {
  candles: Candle[];
  cursor: number;
  round: number;
  portfolio: number;
  ai: number;
  pos: "none" | "long";
  entry: number;
  aiPos: "none" | "long";
  aiEntry: number;
  log: Round[];
  lastRound: Round | null;
  showReveal: boolean;
}

const INIT: GS = { candles: [], cursor: VIS, round: 0, portfolio: 10000, ai: 10000, pos: "none", entry: 0, aiPos: "none", aiEntry: 0, log: [], lastRound: null, showReveal: false };

function fmt(n: number) { return n.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ","); }
function fmtPct(n: number) { return `${n >= 0 ? "+" : ""}${(n * 100).toFixed(2)}%`; }

async function fetchCandles(): Promise<Candle[]> {
  try {
    const r = await fetch("https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=5m&limit=40", { cache: "no-store", signal: AbortSignal.timeout(4000) });
    if (!r.ok) throw new Error();
    const d: unknown[][] = await r.json();
    return d.map(k => ({ o: +String(k[1]), h: +String(k[2]), l: +String(k[3]), c: +String(k[4]), v: +String(k[5]) }));
  } catch {
    let p = 43500;
    return Array.from({ length: 40 }, (_, i) => {
      const trend = Math.sin(i / 6) * 300;
      const o = p, d = trend + (Math.random() - 0.45) * 280, c = Math.max(38000, o + d);
      const h = Math.max(o, c) + Math.random() * 80, l = Math.min(o, c) - Math.random() * 80;
      p = c; return { o, h, l, c, v: Math.random() * 100 + 20 };
    });
  }
}

function aiMove(candles: Candle[], idx: number): Dec {
  if (idx < 5) return "HOLD";
  const rsi = candles.slice(idx - 4, idx + 1).reduce((a, c, i, arr) => i === 0 ? a : a + (c.c > arr[i-1].c ? c.c - arr[i-1].c : 0), 0) / 4;
  const loss = candles.slice(idx - 4, idx + 1).reduce((a, c, i, arr) => i === 0 ? a : a + (c.c < arr[i-1].c ? arr[i-1].c - c.c : 0), 0) / 4;
  const rsiVal = loss === 0 ? 100 : 100 - 100 / (1 + rsi / loss);
  if (rsiVal < 40) return "BUY";
  if (rsiVal > 60) return "SELL";
  return "HOLD";
}

function Chart({ candles, cursor, log }: { candles: Candle[]; cursor: number; log: Round[] }) {
  const slice = candles.slice(Math.max(0, cursor - VIS), cursor + 1);
  if (slice.length < 2) return null;
  const lo = Math.min(...slice.map(c => c.l)) * 0.9997;
  const hi = Math.max(...slice.map(c => c.h)) * 1.0003;
  const rng = hi - lo || 1;
  const maxV = Math.max(...slice.map(c => c.v)) || 1;
  const W = 600, H = 130, VH = 25, ML = 46, MR = 6, MT = 6, MB = 4;
  const IW = W - ML - MR, IH = H - MT - MB - VH - 4;
  const px = (i: number) => ML + (i / (slice.length - 1)) * IW;
  const py = (v: number) => MT + IH - ((v - lo) / rng) * IH;
  const cw = Math.max(3, IW / slice.length * 0.5);
  const last = slice[slice.length - 1];
  const isUp = last.c >= slice[0].c;
  const ticks = [lo + rng * 0.25, lo + rng * 0.5, lo + rng * 0.75];

  // Decisions overlay positions
  const decOffset = Math.max(0, cursor - VIS);

  return (
    <svg viewBox={`0 0 ${W} ${H + VH}`} className="w-full" style={{ height: 160 }} preserveAspectRatio="none">
      <defs>
        <filter id="cg2"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>

      {/* Grid */}
      {ticks.map((v, i) => (
        <g key={i}>
          <line x1={ML} y1={py(v)} x2={W - MR} y2={py(v)} stroke="rgba(255,255,255,0.04)" strokeWidth="0.7"/>
          <text x={ML - 3} y={py(v) + 3} textAnchor="end" fill="rgba(255,255,255,0.18)" fontSize="7.5" fontFamily="monospace">{(v/1000).toFixed(1)}k</text>
        </g>
      ))}

      {/* Volume bars */}
      {slice.map((c, i) => {
        const x = px(i), isUp2 = c.c >= c.o;
        const vh = (c.v / maxV) * VH;
        return <rect key={i} x={x - cw/2} y={H - MB - vh} width={cw} height={vh} fill={isUp2 ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.25)"} rx="0.5"/>;
      })}

      {/* Candles */}
      {slice.map((c, i) => {
        const x = px(i), isUp2 = c.c >= c.o, col = isUp2 ? "#10b981" : "#ef4444";
        const bT = py(Math.max(c.o, c.c)), bH = Math.max(1.5, Math.abs(py(c.o) - py(c.c)));
        const isCur = i === slice.length - 1;
        return (
          <g key={i}>
            <line x1={x} y1={py(c.h)} x2={x} y2={py(c.l)} stroke={col} strokeWidth={isCur ? 1.5 : 0.7} opacity={isCur ? 1 : 0.55}/>
            <rect x={x - cw/2} y={bT} width={cw} height={bH} fill={col} opacity={isCur ? 1 : 0.6} rx="0.5" filter={isCur ? "url(#cg2)" : undefined}/>
          </g>
        );
      })}

      {/* Decision flags on past candles */}
      {log.map((r, i) => {
        const candleIdx = i - decOffset;
        if (candleIdx < 0 || candleIdx >= slice.length) return null;
        const x = px(candleIdx), c = slice[candleIdx];
        const col = r.good ? "#10b981" : "#ef4444";
        return (
          <g key={`d${i}`}>
            <line x1={x} y1={py(c.h) - 12} x2={x} y2={py(c.h) - 2} stroke={col} strokeWidth="1" opacity="0.7"/>
            <text x={x} y={py(c.h) - 14} textAnchor="middle" fill={col} fontSize="8" fontWeight="bold" opacity="0.85">
              {r.dec[0]}
            </text>
          </g>
        );
      })}

      {/* Price tag */}
      <line x1={ML} y1={py(last.c)} x2={W-MR} y2={py(last.c)} stroke={isUp ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"} strokeWidth="0.7" strokeDasharray="3,2"/>
      <rect x={W-MR-38} y={py(last.c)-7} width={39} height={14} rx="2.5" fill={isUp ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"} stroke={isUp ? "#10b981" : "#ef4444"} strokeWidth="0.5"/>
      <text x={W-MR-19} y={py(last.c)+3.5} textAnchor="middle" fill={isUp ? "#10b981" : "#ef4444"} fontSize="7" fontFamily="monospace" fontWeight="bold">{(last.c/1000).toFixed(2)}k</text>

      {/* Pulsing dot */}
      <circle cx={px(slice.length-1)} cy={py(last.c)} r="3.5" fill={isUp ? "#10b981" : "#ef4444"} filter="url(#cg2)">
        <animate attributeName="opacity" values="1;0.2;1" dur="1s" repeatCount="indefinite"/>
      </circle>
    </svg>
  );
}

// ─── Portfolio sparkline ──────────────────────────────────────────────────────
function PortfolioSpark({ log, portfolio }: { log: Round[]; portfolio: number }) {
  const vals = [10000, ...log.map((_, i) => {
    // Approximate portfolio growth (simplified)
    return 10000;
  })];
  // Actually track real portfolio values through log
  const real = [10000];
  let p = 10000, pos: "none" | "long" = "none";
  for (const r of log) {
    if (r.dec === "BUY" && pos === "none") pos = "long";
    else if (r.dec === "SELL" && pos === "long") { p = p * (1 + r.pct); pos = "none"; }
    else if (pos === "long") p = p * (1 + r.pct);
    real.push(Math.max(0, p));
  }
  const series = real;
  if (series.length < 2) return null;
  const lo = Math.min(...series) * 0.995, hi = Math.max(...series) * 1.005, rng = hi - lo || 1;
  const W = 80, H = 28;
  const pts = series.map((v, i) => `${(i/(series.length-1))*W},${H-((v-lo)/rng)*H}`).join(" ");
  const up = series[series.length-1] >= 10000;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: 80, height: 28 }}>
      <polyline points={pts} fill="none" stroke={up ? "#10b981" : "#ef4444"} strokeWidth="1.5"/>
    </svg>
  );
}

type Phase = "intro" | "playing" | "result";

export default function TradeGame() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [g, setG] = useState<GS>(INIT);
  const [loading, setLoading] = useState(false);

  // Keyboard shortcuts
  useEffect(() => {
    if (phase !== "playing") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "b" || e.key === "B") decide("BUY");
      else if (e.key === "s" || e.key === "S") decide("SELL");
      else if (e.key === "h" || e.key === "H" || e.key === " ") { e.preventDefault(); decide("HOLD"); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, g.round]);

  const start = async () => {
    setLoading(true);
    try {
      const candles = await fetchCandles();
      setG({ ...INIT, candles });
      setPhase("playing");
    } finally {
      setLoading(false);
    }
  };

  const decide = useCallback((dec: Dec) => {
    setG(prev => {
      if (prev.round >= ROUNDS || prev.showReveal) return prev;
      const cur = prev.candles[prev.cursor];
      const nxt = prev.candles[prev.cursor + 1];
      if (!cur || !nxt) return prev;

      const pct = (nxt.c - cur.c) / cur.c;

      // Player
      let p = prev.portfolio, pos = prev.pos, entry = prev.entry;
      if (dec === "BUY" && pos === "none") { pos = "long"; entry = cur.c; }
      else if (dec === "SELL" && pos === "long") { p *= (1 + (cur.c - entry) / entry); pos = "none"; entry = 0; }
      else if (pos === "long") { p *= (1 + (nxt.c - entry) / entry); entry = nxt.c; }
      p = Math.max(0, p);

      // AI
      const aiDec = aiMove(prev.candles, prev.cursor);
      let ai = prev.ai, aiPos = prev.aiPos, aiEntry = prev.aiEntry;
      if (aiDec === "BUY" && aiPos === "none") { aiPos = "long"; aiEntry = cur.c; }
      else if (aiDec === "SELL" && aiPos === "long") { ai *= (1 + (cur.c - aiEntry) / aiEntry); aiPos = "none"; aiEntry = 0; }
      else if (aiPos === "long") { ai *= (1 + (nxt.c - aiEntry) / aiEntry); aiEntry = nxt.c; }
      ai = Math.max(0, ai);

      const good = (dec === "BUY" && pct > 0) || (dec === "SELL" && pct < 0) || (dec === "HOLD" && Math.abs(pct) < 0.003);
      const round: Round = { dec, aiDec, pct, price: cur.c, good };
      const nr = prev.round + 1;

      const next: GS = { ...prev, cursor: prev.cursor + 1, round: nr, portfolio: p, ai, pos, entry, aiPos, aiEntry, log: [...prev.log, round], lastRound: round, showReveal: true };

      // Hide reveal after 2s, then check if game over
      setTimeout(() => {
        setG(s => {
          const updated = { ...s, showReveal: false };
          return updated;
        });
        if (nr >= ROUNDS) {
          setTimeout(() => {
            setPhase("result");
            unlockAchievement("TRADE_DONE");
            setG(s => { if (s.portfolio > s.ai) unlockAchievement("TRADE_WIN"); return s; });
          }, 300);
        }
      }, 1800);

      return next;
    });
  }, []);

  const pnl = g.portfolio - 10000;
  const cur = g.candles[g.cursor];
  const prevC = g.candles[g.cursor - 1];
  const won = g.portfolio > g.ai;
  const lr = g.lastRound;

  const S = (obj: React.CSSProperties): React.CSSProperties => obj;

  return (
    <section id="trade" className="relative py-28 px-6">
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,transparent,rgba(234,179,8,0.04),transparent)", pointerEvents: "none" }} />
      <div style={{ maxWidth: 720, margin: "0 auto", position: "relative", zIndex: 1 }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 10 }}>
            <div style={{ height: 1, width: 48, background: "linear-gradient(90deg,transparent,rgba(0,212,255,0.5))" }} />
            <span style={{ fontFamily: "monospace", fontSize: 10, color: "#facc15", letterSpacing: 4, textTransform: "uppercase" }}>Mini-Jeu</span>
            <div style={{ height: 1, width: 48, background: "linear-gradient(90deg,rgba(0,212,255,0.5),transparent)" }} />
          </div>
          <h2 style={{ fontSize: "clamp(28px,5vw,48px)", fontWeight: 900, color: "rgba(255,255,255,0.92)", marginBottom: 4 }}>Trade Like Me</h2>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13 }}>Vraies données BTC/USDT Binance · Battez mon algorithme RSI</p>
        </div>

        {/* ── INTRO ── */}
        {phase === "intro" && (
          <div style={S({ background: "rgba(255,255,255,0.025)", borderRadius: 20, border: "1px solid rgba(250,204,21,0.18)", overflow: "hidden" })}>
            <div style={S({ position: "relative", height: 100, overflow: "hidden", pointerEvents: "none" })}>
              <svg viewBox="0 0 700 100" style={{ width: "100%", height: "100%" }} preserveAspectRatio="none">
                <defs><linearGradient id="igi" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="rgba(16,185,129,0.18)"/><stop offset="100%" stopColor="transparent"/></linearGradient></defs>
                <path d="M0,75 C60,65 90,82 140,52 C190,22 230,48 280,35 C330,22 370,50 420,32 C470,14 520,40 570,22 C610,8 650,16 700,10 L700,100 L0,100Z" fill="url(#igi)"/>
                <path d="M0,75 C60,65 90,82 140,52 C190,22 230,48 280,35 C330,22 370,50 420,32 C470,14 520,40 570,22 C610,8 650,16 700,10" fill="none" stroke="#10b981" strokeWidth="1.5"/>
              </svg>
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,#030712 20%,transparent)" }}/>
              <div style={{ position: "absolute", bottom: 8, left: 14, display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", display: "inline-block" }}/>
                <span style={{ fontFamily: "monospace", fontSize: 9, color: "#10b981" }}>BTC/USDT · LIVE · Binance 5m</span>
              </div>
            </div>
            <div style={{ padding: "24px 32px 32px", textAlign: "center" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, maxWidth: 300, margin: "0 auto 22px" }}>
                {[["$10K","Capital"],["RSI","Algo IA"],[`${ROUNDS}`,"Rounds"],["5m","Interval"]].map(([v,l]) => (
                  <div key={l} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.07)", padding: "8px 4px" }}>
                    <div style={{ fontSize: 14, fontWeight: 900, color: "#facc15" }}>{v}</div>
                    <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>{l}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginBottom: 10, fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>
                Raccourcis : <span style={{ color: "#10b981" }}>B</span> = BUY &nbsp;·&nbsp; <span style={{ color: "#ef4444" }}>S</span> = SELL &nbsp;·&nbsp; <span style={{ color: "#94a3b8" }}>Espace/H</span> = HOLD
              </div>
              <button type="button" onClick={start} disabled={loading}
                style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 10, padding: "14px 40px", borderRadius: 14, fontWeight: 900, fontSize: 16, color: "#000", background: loading ? "#888" : "linear-gradient(135deg,#facc15,#f97316)", border: "none" }}>
                {loading ? "⏳ Chargement Binance…" : "🚀 Lancer la simulation"}
              </button>
            </div>
          </div>
        )}

        {/* ── PLAYING ── */}
        {phase === "playing" && g.candles.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

            {/* HUD */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 10 }}>
              {/* You */}
              <div style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${pnl >= 0 ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}`, borderRadius: 12, padding: "10px 14px" }}>
                <div style={{ fontSize: 9, fontFamily: "monospace", color: "rgba(255,255,255,0.3)", marginBottom: 2 }}>VOUS</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ fontSize: 19, fontWeight: 900, fontFamily: "monospace", color: pnl >= 0 ? "#10b981" : "#ef4444" }}>${fmt(g.portfolio)}</div>
                  <PortfolioSpark log={g.log} portfolio={g.portfolio} />
                </div>
                <div style={{ fontSize: 10, fontFamily: "monospace", color: pnl >= 0 ? "#10b981" : "#ef4444", marginTop: 1 }}>{fmtPct(pnl / 10000)}</div>
              </div>

              {/* Round + dots */}
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "10px 16px", textAlign: "center", minWidth: 120 }}>
                <div style={{ fontSize: 9, fontFamily: "monospace", color: "rgba(255,255,255,0.3)", marginBottom: 6 }}>ROUND {g.round}/{ROUNDS}</div>
                <div style={{ display: "flex", gap: 5, justifyContent: "center", marginBottom: 4 }}>
                  {Array.from({ length: ROUNDS }).map((_, i) => {
                    const h = g.log[i], done = i < g.round;
                    return <div key={i} style={{ width: 10, height: 10, borderRadius: 3, background: done ? (h?.good ? "#10b981" : "#ef4444") : i === g.round ? "#facc15" : "rgba(255,255,255,0.08)", transition: "background 0.3s" }}/>;
                  })}
                </div>
                <div style={{ fontSize: 9, fontFamily: "monospace", color: "rgba(255,255,255,0.2)" }}>{ROUNDS - g.round} restants</div>
              </div>

              {/* AI */}
              <div style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${g.ai >= 10000 ? "rgba(0,212,255,0.2)" : "rgba(239,68,68,0.25)"}`, borderRadius: 12, padding: "10px 14px", textAlign: "right" }}>
                <div style={{ fontSize: 9, fontFamily: "monospace", color: "rgba(255,255,255,0.3)", marginBottom: 2 }}>ALGO IA (RSI)</div>
                <div style={{ fontSize: 19, fontWeight: 900, fontFamily: "monospace", color: g.ai >= 10000 ? "#00d4ff" : "#ef4444" }}>${fmt(g.ai)}</div>
                <div style={{ fontSize: 10, fontFamily: "monospace", color: g.ai >= 10000 ? "#00d4ff" : "#ef4444", marginTop: 1 }}>{fmtPct((g.ai - 10000) / 10000)}</div>
              </div>
            </div>

            {/* Chart */}
            <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "12px 14px", position: "relative" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#10b981", display: "inline-block" }}/>
                  <span style={{ fontFamily: "monospace", fontSize: 9, color: "rgba(255,255,255,0.3)" }}>BTC/USDT · 5m · Binance</span>
                  <span style={{ fontFamily: "monospace", fontSize: 9, color: "rgba(255,255,255,0.2)", marginLeft: 8 }}>B=BUY S=SELL H=HOLD</span>
                </div>
                {cur && prevC && (
                  <div style={{ color: cur.c >= prevC.c ? "#10b981" : "#ef4444", textAlign: "right" }}>
                    <span style={{ fontFamily: "monospace", fontWeight: 900, fontSize: 16 }}>${fmt(cur.c)}</span>
                    <span style={{ fontFamily: "monospace", fontSize: 10, marginLeft: 6, opacity: 0.7 }}>{cur.c >= prevC.c ? "▲" : "▼"}{Math.abs((cur.c - prevC.c) / prevC.c * 100).toFixed(3)}%</span>
                  </div>
                )}
              </div>
              <Chart candles={g.candles} cursor={g.cursor} log={g.log} />
            </div>

            {/* Post-round reveal */}
            {g.showReveal && lr && (
              <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, padding: "14px 20px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, alignItems: "center" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 9, fontFamily: "monospace", color: "rgba(255,255,255,0.3)", marginBottom: 4 }}>VOUS</div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: lr.good ? "#10b981" : "#ef4444" }}>
                    {lr.dec === "BUY" ? "📈" : lr.dec === "SELL" ? "📉" : "⏸"} {lr.dec}
                  </div>
                  <div style={{ fontSize: 10, fontFamily: "monospace", color: lr.good ? "#10b981" : "#ef4444", marginTop: 2 }}>{lr.good ? "✓ Bon move" : "✗ Mauvais move"}</div>
                </div>
                <div style={{ textAlign: "center", borderLeft: "1px solid rgba(255,255,255,0.08)", borderRight: "1px solid rgba(255,255,255,0.08)" }}>
                  <div style={{ fontSize: 9, fontFamily: "monospace", color: "rgba(255,255,255,0.3)", marginBottom: 4 }}>VARIATION</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: lr.pct >= 0 ? "#10b981" : "#ef4444", fontFamily: "monospace" }}>{fmtPct(lr.pct)}</div>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", marginTop: 2 }}>${fmt(lr.price)}</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 9, fontFamily: "monospace", color: "rgba(255,255,255,0.3)", marginBottom: 4 }}>ALGO IA</div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: "rgba(0,212,255,0.9)" }}>
                    {lr.aiDec === "BUY" ? "📈" : lr.aiDec === "SELL" ? "📉" : "⏸"} {lr.aiDec}
                  </div>
                  <div style={{ fontSize: 10, fontFamily: "monospace", color: "rgba(255,255,255,0.3)", marginTop: 2 }}>RSI strategy</div>
                </div>
              </div>
            )}

            {/* Position */}
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "monospace", fontSize: 10, color: "rgba(255,255,255,0.3)", padding: "0 2px" }}>
              <span>Position : <span style={{ color: g.pos === "long" ? "#10b981" : undefined, fontWeight: g.pos === "long" ? 700 : 400 }}>{g.pos === "long" ? `LONG @ $${fmt(g.entry)}` : "FLAT"}</span></span>
              <span style={{ color: "rgba(255,255,255,0.2)" }}>Clavier : B · S · H</span>
            </div>

            {/* Buttons */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              {([
                { dec: "BUY" as Dec, e: "📈", l: "BUY", sub: "[B]", bg: "rgba(16,185,129,0.1)", bd: "1.5px solid rgba(16,185,129,0.4)", c: "#10b981" },
                { dec: "SELL" as Dec, e: "📉", l: "SELL", sub: "[S]", bg: "rgba(239,68,68,0.1)", bd: "1.5px solid rgba(239,68,68,0.4)", c: "#ef4444" },
                { dec: "HOLD" as Dec, e: "⏸", l: "HOLD", sub: "[H/Espace]", bg: "rgba(148,163,184,0.05)", bd: "1.5px solid rgba(148,163,184,0.25)", c: "#94a3b8" },
              ]).map(({ dec, e, l, sub, bg, bd, c }) => (
                <button key={dec} type="button" onClick={() => decide(dec)} disabled={g.showReveal}
                  style={{ cursor: g.showReveal ? "not-allowed" : "pointer", background: bg, border: bd, borderRadius: 14, padding: "16px 8px 14px", display: "flex", flexDirection: "column", alignItems: "center", gap: 5, color: c, fontWeight: 900, opacity: g.showReveal ? 0.5 : 1, transition: "opacity 0.2s" }}>
                  <span style={{ fontSize: 26 }}>{e}</span>
                  <span style={{ fontFamily: "monospace", fontSize: 13, letterSpacing: 2 }}>{l}</span>
                  <span style={{ fontFamily: "monospace", fontSize: 9, opacity: 0.5 }}>{sub}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── RESULT ── */}
        {phase === "result" && (
          <div style={{ background: "rgba(255,255,255,0.025)", borderRadius: 20, border: "1px solid rgba(255,255,255,0.09)", overflow: "hidden" }}>
            <div style={{ padding: "36px 32px 28px", textAlign: "center", background: won ? "linear-gradient(135deg,rgba(16,185,129,0.08),rgba(0,212,255,0.04))" : "linear-gradient(135deg,rgba(239,68,68,0.08),rgba(251,146,60,0.04))" }}>
              <div style={{ fontSize: 60, marginBottom: 10 }}>{won ? "🏆" : pnl > 0 ? "✅" : "💀"}</div>
              <h3 style={{ fontSize: 26, fontWeight: 900, color: "rgba(255,255,255,0.92)", marginBottom: 6 }}>{won ? "Vous battez l'algorithme !" : pnl > 0 ? "Bon score, mais l'IA gagne" : "L'IA vous écrase"}</h3>
              <p style={{ fontFamily: "monospace", fontSize: 18, color: pnl >= 0 ? "#10b981" : "#ef4444" }}>
                {pnl >= 0 ? "+" : ""}${Math.abs(pnl).toFixed(0)} &nbsp;({fmtPct(pnl / 10000)})
              </p>
            </div>
            <div style={{ padding: "20px 24px 28px", display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Score comparison */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[{ l: "Vous", v: g.portfolio, c: won ? "#10b981" : "#ef4444" }, { l: "Algo IA (RSI)", v: g.ai, c: won ? "#64748b" : "#00d4ff" }].map(({ l, v, c }) => (
                  <div key={l} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "14px 16px" }}>
                    <div style={{ fontSize: 9, fontFamily: "monospace", color: "rgba(255,255,255,0.3)", marginBottom: 4 }}>{l}</div>
                    <div style={{ fontSize: 24, fontWeight: 900, fontFamily: "monospace", color: c }}>${fmt(v)}</div>
                    <div style={{ fontSize: 10, fontFamily: "monospace", color: c, opacity: 0.7 }}>{fmtPct((v - 10000) / 10000)}</div>
                  </div>
                ))}
              </div>

              {/* Decision breakdown */}
              <div>
                <div style={{ fontSize: 9, fontFamily: "monospace", color: "rgba(255,255,255,0.3)", marginBottom: 8, textTransform: "uppercase", letterSpacing: 2 }}>Analyse de vos décisions</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {g.log.map((r, i) => (
                    <div key={i} style={{ display: "grid", gridTemplateColumns: "20px 60px 1fr 60px 60px", gap: 10, alignItems: "center", padding: "5px 10px", borderRadius: 8, background: r.good ? "rgba(16,185,129,0.06)" : "rgba(239,68,68,0.06)", border: `1px solid ${r.good ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.12)"}` }}>
                      <span style={{ fontFamily: "monospace", fontSize: 9, color: "rgba(255,255,255,0.3)" }}>#{i+1}</span>
                      <span style={{ fontFamily: "monospace", fontSize: 11, fontWeight: 700, color: r.good ? "#10b981" : "#ef4444" }}>{r.good ? "✓" : "✗"} {r.dec}</span>
                      <div style={{ height: 2, background: "rgba(255,255,255,0.06)", borderRadius: 1, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${Math.min(100, Math.abs(r.pct) * 2000)}%`, background: r.pct >= 0 ? "#10b981" : "#ef4444" }}/>
                      </div>
                      <span style={{ fontFamily: "monospace", fontSize: 10, color: r.pct >= 0 ? "#10b981" : "#ef4444", textAlign: "right" }}>{fmtPct(r.pct)}</span>
                      <span style={{ fontFamily: "monospace", fontSize: 9, color: "rgba(0,212,255,0.6)", textAlign: "right" }}>IA: {r.aiDec[0]}</span>
                    </div>
                  ))}
                </div>
              </div>

              <p style={{ fontFamily: "monospace", fontSize: 10, color: "rgba(255,255,255,0.2)", textAlign: "center", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 12 }}>
                Algo IA : RSI(4) → BUY &lt;40 · SELL &gt;60 · HOLD sinon
              </p>
              <div style={{ display: "flex", gap: 10 }}>
                <button type="button" onClick={start} disabled={loading}
                  style={{ cursor: "pointer", flex: 1, padding: "13px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.15)", background: "transparent", color: "rgba(255,255,255,0.65)", fontWeight: 700, fontSize: 14 }}>
                  {loading ? "⏳ Chargement…" : "🔄 Rejouer (nouvelles données)"}
                </button>
                <button type="button" onClick={() => document.querySelector("#projects")?.scrollIntoView({ behavior: "smooth" })}
                  style={{ cursor: "pointer", flex: 1, padding: "13px", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#00d4ff,#8b5cf6)", color: "#000", fontWeight: 900, fontSize: 14 }}>
                  Voir mes projets →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
