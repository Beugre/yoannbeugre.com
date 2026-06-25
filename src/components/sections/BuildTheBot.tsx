"use client";
import { useState } from "react";

type BotConfig = { rsi: boolean; momentum: boolean; volume: boolean; sma: boolean; riskPct: number; sl: number; tp: number; };
type Phase = "build" | "backtesting" | "result";

function runBacktest(cfg: BotConfig): { winRate: number; drawdown: number; pf: number; ret: number; trades: number } {
  const score = (cfg.rsi ? 1 : 0) + (cfg.momentum ? 1 : 0) + (cfg.volume ? 1 : 0) + (cfg.sma ? 1 : 0);
  const base = 0.3 + score * 0.1;
  const winRate = Math.min(0.72, base + (Math.random() - 0.3) * 0.08);
  const drawdown = Math.max(3, 18 - score * 3 - (cfg.sl < 5 ? 2 : 0) + Math.random() * 3);
  const pf = 0.8 + score * 0.35 + (cfg.tp / cfg.sl) * 0.1 + Math.random() * 0.2;
  const ret = (winRate * cfg.tp - (1 - winRate) * cfg.sl) * cfg.riskPct * 10;
  return { winRate: Math.round(winRate * 100), drawdown: Math.round(drawdown * 10) / 10, pf: Math.round(pf * 100) / 100, ret: Math.round(ret * 10) / 10, trades: 40 + Math.floor(Math.random() * 30) };
}

function EquityCurve({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null;
  const min = Math.min(...data) * 0.995, max = Math.max(...data) * 1.005, rng = max - min || 1;
  const W = 300, H = 60;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * W},${H - ((v - min) / rng) * H}`).join(" ");
  const up = data[data.length - 1] >= data[0];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: 60 }} preserveAspectRatio="none">
      <defs><linearGradient id={`eg${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={`${color}22`} /><stop offset="100%" stopColor="transparent" /></linearGradient></defs>
      <polyline points={`${pts} ${W},${H} 0,${H}`} fill={`url(#eg${color.replace('#', '')})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

function genCurve(winRate: number, trades: number, start = 10000): number[] {
  const p = [start];
  for (let i = 0; i < trades; i++) {
    const win = Math.random() < winRate / 100;
    p.push(Math.max(0, p[p.length - 1] * (1 + (win ? 0.018 : -0.012) * (0.8 + Math.random() * 0.4))));
  }
  return p;
}

export default function BuildTheBot() {
  const [phase, setPhase] = useState<Phase>("build");
  const [cfg, setCfg] = useState<BotConfig>({ rsi: false, momentum: false, volume: false, sma: false, riskPct: 2, sl: 3, tp: 6 });
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ReturnType<typeof runBacktest> | null>(null);
  const [curve, setCurve] = useState<number[]>([]);

  const YOANN = { winRate: 68, drawdown: 8.2, pf: 1.95, ret: 18.4, trades: 62 };
  const yoannCurve = genCurve(68, 62);

  const toggle = (k: keyof Pick<BotConfig, "rsi" | "momentum" | "volume" | "sma">) => setCfg(p => ({ ...p, [k]: !p[k] }));

  const backtest = () => {
    const active = (cfg.rsi ? 1 : 0) + (cfg.momentum ? 1 : 0) + (cfg.volume ? 1 : 0) + (cfg.sma ? 1 : 0);
    if (active === 0) return;
    setPhase("backtesting"); setProgress(0);
    let p = 0;
    const iv = setInterval(() => {
      p += Math.random() * 12 + 8; if (p >= 100) {
        clearInterval(iv); setProgress(100);
        const r = runBacktest(cfg); setResult(r); setCurve(genCurve(r.winRate, r.trades)); setTimeout(() => setPhase("result"), 300);
      }
      else setProgress(Math.round(p));
    }, 80);
  };

  const S = (o: React.CSSProperties) => o;

  return (
    <section id="buildbot" className="relative py-24 px-6">
      <div style={S({ position: "absolute", inset: 0, background: "radial-gradient(ellipse 60% 50% at 50% 100%,rgba(139,92,246,0.04),transparent)", pointerEvents: "none" })} />
      <div style={S({ maxWidth: 720, margin: "0 auto", position: "relative", zIndex: 1 })}>

        <div style={S({ textAlign: "center", marginBottom: 24 })}>
          <div style={S({ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 8 })}>
            <div style={S({ height: 1, width: 40, background: "linear-gradient(90deg,transparent,rgba(139,92,246,0.6))" })} />
            <span style={S({ fontFamily: "monospace", fontSize: 10, color: "#8b5cf6", letterSpacing: 4, textTransform: "uppercase" })}>Challenge Arena</span>
            <div style={S({ height: 1, width: 40, background: "linear-gradient(90deg,rgba(139,92,246,0.6),transparent)" })} />
          </div>
          <h2 style={S({ fontSize: "clamp(24px,4vw,40px)", fontWeight: 900, color: "rgba(255,255,255,0.92)", marginBottom: 4 })}>Build The Bot</h2>
          <p style={S({ color: "rgba(255,255,255,0.35)", fontSize: 13 })}>Construisez votre stratégie de trading · Backtest vs algorithme de Yoann</p>
        </div>

        {phase === "build" && (
          <div style={S({ background: "rgba(255,255,255,0.025)", borderRadius: 20, border: "1px solid rgba(139,92,246,0.2)", padding: "24px 28px" })}>
            <div style={S({ marginBottom: 20 })}>
              <div style={S({ fontSize: 11, fontFamily: "monospace", color: "rgba(255,255,255,0.45)", marginBottom: 12, textTransform: "uppercase", letterSpacing: 2 })}>1. Choisissez vos indicateurs</div>
              <div style={S({ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 })}>
                {([["rsi", "RSI(14)", "Relative Strength Index — détection surachat/survente"], ["momentum", "Momentum", "Force directionnelle sur 5 périodes"], ["volume", "Volume Filter", "Confirmation du signal par le volume"], ["sma", "SMA Cross", "Croisement moyennes 10/50 — tendance"]] as const).map(([k, label, desc]) => (
                  <button key={k} type="button" onClick={() => toggle(k as "rsi" | "momentum" | "volume" | "sma")} style={{ cursor: "pointer", background: cfg[k as keyof typeof cfg] ? "rgba(139,92,246,0.15)" : "rgba(255,255,255,0.03)", border: `1.5px solid ${cfg[k as keyof typeof cfg] ? "rgba(139,92,246,0.5)" : "rgba(255,255,255,0.1)"}`, borderRadius: 12, padding: "12px 14px", display: "flex", alignItems: "flex-start", gap: 10, textAlign: "left" }}>
                    <div style={{ width: 18, height: 18, borderRadius: 4, border: `1.5px solid ${cfg[k as keyof typeof cfg] ? "#8b5cf6" : "rgba(255,255,255,0.25)"}`, background: cfg[k as keyof typeof cfg] ? "#8b5cf6" : "transparent", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1 }}>
                      {cfg[k as keyof typeof cfg] && <span style={{ color: "#fff", fontSize: 11, fontWeight: 900 }}>✓</span>}
                    </div>
                    <div><div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>{label}</div><div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontFamily: "monospace", marginTop: 1 }}>{desc}</div></div>
                  </button>
                ))}
              </div>
            </div>
            <div style={S({ marginBottom: 20 })}>
              <div style={S({ fontSize: 11, fontFamily: "monospace", color: "rgba(255,255,255,0.45)", marginBottom: 12, textTransform: "uppercase", letterSpacing: 2 })}>2. Gestion du risque</div>
              <div style={S({ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 })}>
                {([["riskPct", "Risk/trade", "%", 1, 5], ["sl", "Stop Loss", "%", 1, 10], ["tp", "Take Profit", "%", 2, 20]] as const).map(([k, label, unit, min, max]) => (
                  <div key={k} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", padding: "12px" }}>
                    <div style={{ fontSize: 10, fontFamily: "monospace", color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>{label}</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: "#8b5cf6", marginBottom: 8 }}>{cfg[k as keyof BotConfig]}{unit}</div>
                    <input type="range" min={min} max={max} value={cfg[k as keyof BotConfig] as number} onChange={e => setCfg(p => ({ ...p, [k]: +e.target.value }))} style={{ width: "100%", cursor: "pointer", accentColor: "#8b5cf6" }} />
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, fontFamily: "monospace", color: "rgba(255,255,255,0.25)", marginTop: 2 }}><span>{min}{unit}</span><span>{max}{unit}</span></div>
                  </div>
                ))}
              </div>
            </div>
            <div style={S({ textAlign: "center" })}>
              {(cfg.rsi || cfg.momentum || cfg.volume || cfg.sma) ?
                <button type="button" onClick={backtest} style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 10, padding: "14px 36px", borderRadius: 14, fontWeight: 900, fontSize: 16, color: "#fff", background: "linear-gradient(135deg,#8b5cf6,#6d28d9)", border: "none" }}>⚡ BACKTEST MY BOT</button> :
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>Sélectionnez au moins un indicateur</div>}
            </div>
          </div>
        )}

        {phase === "backtesting" && (
          <div style={S({ background: "rgba(255,255,255,0.025)", borderRadius: 20, border: "1px solid rgba(139,92,246,0.2)", padding: "40px 32px", textAlign: "center" })}>
            <div style={{ fontSize: 11, fontFamily: "monospace", color: "#8b5cf6", letterSpacing: 3, marginBottom: 20, textTransform: "uppercase" }}>SIMULATION EN COURS</div>
            <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 6, overflow: "hidden", height: 8, marginBottom: 12, maxWidth: 400, margin: "0 auto 12px" }}><div style={{ height: "100%", background: "linear-gradient(90deg,#8b5cf6,#00d4ff)", borderRadius: 6, width: `${progress}%`, transition: "width 0.1s" }} /></div>
            <div style={{ fontFamily: "monospace", fontSize: 13, color: "rgba(255,255,255,0.5)" }}>{progress < 30 ? "Chargement des données historiques..." : progress < 60 ? "Simulation des ordres..." : progress < 85 ? "Calcul des métriques..." : "Finalisation..."}</div>
          </div>
        )}

        {phase === "result" && result && (
          <div style={S({ background: "rgba(255,255,255,0.025)", borderRadius: 20, border: "1px solid rgba(139,92,246,0.2)", overflow: "hidden" })}>
            <div style={{ padding: "20px 24px 0", background: "rgba(139,92,246,0.05)" }}>
              <div style={{ fontSize: 11, fontFamily: "monospace", color: "rgba(255,255,255,0.4)", marginBottom: 14, textTransform: "uppercase", letterSpacing: 2 }}>Résultats du backtest</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                {/* Your bot */}
                <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 14, border: "1px solid rgba(139,92,246,0.25)", padding: "14px 16px" }}>
                  <div style={{ fontSize: 9, fontFamily: "monospace", color: "rgba(255,255,255,0.3)", marginBottom: 8 }}>VOTRE BOT</div>
                  <EquityCurve data={curve} color={result.ret >= 0 ? "#8b5cf6" : "#ef4444"} />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 10 }}>
                    {[["Rendement", `${result.ret >= 0 ? "+" : ""}${result.ret}%`, result.ret >= 0 ? "#8b5cf6" : "#ef4444"], ["Win Rate", `${result.winRate}%`, "#8b5cf6"], ["Drawdown", `-${result.drawdown}%`, "#f59e0b"], ["P. Factor", `${result.pf}`, "#8b5cf6"]].map(([l, v, c]) => (
                      <div key={l}><div style={{ fontSize: 8, fontFamily: "monospace", color: "rgba(255,255,255,0.3)", marginBottom: 2 }}>{l}</div><div style={{ fontSize: 15, fontWeight: 900, color: c as string }}>{v}</div></div>
                    ))}
                  </div>
                </div>
                {/* Yoann's bot */}
                <div style={{ background: "rgba(0,212,255,0.05)", borderRadius: 14, border: "1px solid rgba(0,212,255,0.25)", padding: "14px 16px" }}>
                  <div style={{ fontSize: 9, fontFamily: "monospace", color: "rgba(0,212,255,0.6)", marginBottom: 8 }}>BOT DE YOANN ⚡</div>
                  <EquityCurve data={yoannCurve} color="#00d4ff" />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 10 }}>
                    {[[`+${YOANN.ret}%`, "Rendement", "#10b981"], [`${YOANN.winRate}%`, "Win Rate", "#00d4ff"], [`-${YOANN.drawdown}%`, "Drawdown", "#f59e0b"], [`${YOANN.pf}x`, "P. Factor", "#00d4ff"]].map(([v, l, c]) => (
                      <div key={l}><div style={{ fontSize: 8, fontFamily: "monospace", color: "rgba(255,255,255,0.3)", marginBottom: 2 }}>{l}</div><div style={{ fontSize: 15, fontWeight: 900, color: c as string }}>{v}</div></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div style={{ padding: "16px 24px 24px" }}>
              <div style={{ background: "rgba(0,0,0,0.4)", borderRadius: 12, border: "1px solid rgba(0,212,255,0.15)", padding: "14px 16px", marginBottom: 16 }}>
                <div style={{ fontSize: 10, fontFamily: "monospace", color: "rgba(0,212,255,0.7)", marginBottom: 8 }}>💡 Ce que Yoann aurait amélioré :</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {[!cfg.volume && "Ajout du filtre volume — évite les faux signaux en faible liquidité", !cfg.rsi && "RSI pour éviter les entrées en zone de surachat", cfg.sl > 6 && "Stop Loss trop large — risque de ruine sur série perdante", cfg.tp / cfg.sl < 1.5 && "Ratio R:R insuffisant — visez 2:1 minimum", "Filtrage des sessions de faible volatilité (nuit, weekend)"].filter(Boolean).slice(0, 3).map((tip, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, fontSize: 11, color: "rgba(255,255,255,0.55)", fontFamily: "monospace" }}>
                      <span style={{ color: "#00d4ff", flexShrink: 0 }}>→</span><span>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button type="button" onClick={() => { setPhase("build"); setResult(null); }} style={{ cursor: "pointer", flex: 1, padding: "12px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.15)", background: "transparent", color: "rgba(255,255,255,0.65)", fontWeight: 700, fontSize: 14 }}>🔧 Modifier</button>
                <button type="button" onClick={() => document.querySelector("#projects")?.scrollIntoView({ behavior: "smooth" })} style={{ cursor: "pointer", flex: 1, padding: "12px", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#8b5cf6,#6d28d9)", color: "#fff", fontWeight: 900, fontSize: 14 }}>Voir mes projets →</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
