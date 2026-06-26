"use client";
import { useState } from "react";

const MARKETS = [
  { id: "btc100k", q: "BTC dépasse $100K cette année ?", mktPrice: 38, category: "Crypto" },
  { id: "fed", q: "La Fed baisse ses taux en 2025 ?", mktPrice: 62, category: "Macro" },
  { id: "ai", q: "GPT-5 sort avant fin 2025 ?", mktPrice: 55, category: "AI" },
  { id: "eth", q: "ETH dépasse $5K cette année ?", mktPrice: 29, category: "Crypto" },
  { id: "btcetf", q: "Flux ETF BTC > $50B en 2025 ?", mktPrice: 71, category: "Finance" },
];

interface Result { edge: number; value: boolean; kelly: number; suggested: number; }

function kelly(p: number, odds: number): number {
  const q = 1 - p / 100; const b = (100 - odds) / odds;
  return Math.max(0, Math.min(25, (p / 100 * b - q) / b * 100));
}

export default function PredictionMarketLab() {
  const [mi, setMi] = useState(0);
  const [prob, setProb] = useState(50);
  const [result, setResult] = useState<Result | null>(null);
  const [done, setDone] = useState(false);
  const [scores, setScores] = useState<{ edge: number; value: boolean }[]>([]);

  const mkt = MARKETS[mi];
  const edge = prob - mkt.mktPrice;
  const kPct = kelly(prob, mkt.mktPrice);

  const submit = () => {
    const r: Result = { edge, value: Math.abs(edge) > 8, kelly: kPct, suggested: Math.round(kPct) };
    setResult(r);
    const next = [...scores, { edge, value: r.value }];
    setScores(next);
    setTimeout(() => {
      setResult(null); setProb(50);
      if (mi + 1 >= MARKETS.length) { setDone(true); }
      else setMi(i => i + 1);
    }, 3000);
  };

  const reset = () => { setMi(0); setProb(50); setResult(null); setDone(false); setScores([]); };

  const S = (o: React.CSSProperties) => o;

  return (
    <section id="prediction-lab" className="relative py-12 md:py-24 px-4 md:px-6">
      <div style={S({ position: "absolute", inset: 0, background: "radial-gradient(ellipse 60% 50% at 50% 100%,rgba(0,212,255,0.04),transparent)", pointerEvents: "none" })} />
      <div style={S({ maxWidth: 700, margin: "0 auto", position: "relative", zIndex: 1 })}>

        <div style={S({ textAlign: "center", marginBottom: 28 })}>
          <div style={S({ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 8 })}>
            <div style={S({ height: 1, width: 40, background: "linear-gradient(90deg,transparent,rgba(0,212,255,0.6))" })} />
            <span style={S({ fontFamily: "monospace", fontSize: 10, color: "#00d4ff", letterSpacing: 4, textTransform: "uppercase" })}>Challenge Arena</span>
            <div style={S({ height: 1, width: 40, background: "linear-gradient(90deg,rgba(0,212,255,0.6),transparent)" })} />
          </div>
          <h2 style={S({ fontSize: "clamp(24px,4vw,40px)", fontWeight: 900, color: "rgba(255,255,255,0.92)", marginBottom: 4 })}>Prediction Market Lab</h2>
          <p style={S({ color: "rgba(255,255,255,0.35)", fontSize: 13 })}>Estimez la probabilité réelle · Détectez les Value Bets · Pensez comme un quant</p>
        </div>

        {!done ? (
          <div style={S({ background: "rgba(255,255,255,0.025)", borderRadius: 20, border: "1px solid rgba(0,212,255,0.18)", overflow: "hidden" })}>
            {/* Progress */}
            <div style={{ background: "rgba(0,0,0,0.3)", padding: "10px 20px", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ display: "flex", gap: 4 }}>
                {MARKETS.map((_, i) => (
                  <div key={i} style={{ width: 32, height: 4, borderRadius: 2, background: i < mi ? "#10b981" : i === mi ? "#00d4ff" : "rgba(255,255,255,0.08)" }} />
                ))}
              </div>
              <span style={{ fontFamily: "monospace", fontSize: 10, color: "rgba(255,255,255,0.3)", marginLeft: "auto" }}>Marché {mi + 1}/{MARKETS.length}</span>
            </div>

            <div style={{ padding: "24px 28px" }}>
              {/* Category + question */}
              <div style={{ display: "inline-block", padding: "3px 10px", background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.25)", borderRadius: 6, fontFamily: "monospace", fontSize: 10, color: "#00d4ff", marginBottom: 10 }}>{mkt.category}</div>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: "rgba(255,255,255,0.88)", marginBottom: 16, lineHeight: 1.4 }}>{mkt.q}</h3>

              {/* Market price */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "10px 14px", marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 9, fontFamily: "monospace", color: "rgba(255,255,255,0.3)", marginBottom: 2 }}>PRIX DU MARCHÉ</div>
                  <div style={{ fontSize: 26, fontWeight: 900, color: "#facc15" }}>{mkt.mktPrice}%</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 9, fontFamily: "monospace", color: "rgba(255,255,255,0.3)", marginBottom: 2 }}>Ce que le marché pense</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Probabilité implicite = {mkt.mktPrice}%</div>
                </div>
              </div>

              {/* Your probability slider */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <span style={{ fontFamily: "monospace", fontSize: 11, color: "rgba(255,255,255,0.5)" }}>Votre probabilité estimée</span>
                  <span style={{ fontSize: 28, fontWeight: 900, color: Math.abs(edge) > 15 ? "#10b981" : Math.abs(edge) > 8 ? "#facc15" : "#94a3b8" }}>{prob}%</span>
                </div>
                <input type="range" min={1} max={99} value={prob} onChange={e => setProb(+e.target.value)} style={{ width: "100%", cursor: "pointer", accentColor: "#00d4ff", height: 6 }} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, fontFamily: "monospace", color: "rgba(255,255,255,0.2)", marginTop: 4 }}>
                  <span>1% — Très improbable</span><span>Certain — 99%</span>
                </div>
              </div>

              {/* Live metrics */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 20 }}>
                <div style={{ background: Math.abs(edge) > 8 ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.04)", border: `1px solid ${Math.abs(edge) > 8 ? "rgba(16,185,129,0.3)" : "rgba(255,255,255,0.08)"}`, borderRadius: 10, padding: "10px 12px" }}>
                  <div style={{ fontSize: 9, fontFamily: "monospace", color: "rgba(255,255,255,0.3)", marginBottom: 3 }}>EDGE</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: edge > 0 ? "#10b981" : edge < 0 ? "#ef4444" : "#94a3b8" }}>{edge > 0 ? "+" : ""}{edge}%</div>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>{Math.abs(edge) > 8 ? "✓ Value bet" : Math.abs(edge) > 4 ? "~ Légère opportunité" : "Neutre"}</div>
                </div>
                <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "10px 12px" }}>
                  <div style={{ fontSize: 9, fontFamily: "monospace", color: "rgba(255,255,255,0.3)", marginBottom: 3 }}>KELLY</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: "#00d4ff" }}>{kPct.toFixed(1)}%</div>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>Mise optimale</div>
                </div>
                <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "10px 12px" }}>
                  <div style={{ fontSize: 9, fontFamily: "monospace", color: "rgba(255,255,255,0.3)", marginBottom: 3 }}>RISK</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: "#f59e0b" }}>{kPct > 15 ? "HIGH" : kPct > 8 ? "MED" : "LOW"}</div>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>{kPct > 15 ? "Demi-Kelly suggéré" : "Acceptable"}</div>
                </div>
              </div>

              {/* Result overlay */}
              {result && (
                <div style={{ background: result.value ? "rgba(16,185,129,0.12)" : "rgba(148,163,184,0.08)", border: `1px solid ${result.value ? "rgba(16,185,129,0.4)" : "rgba(255,255,255,0.15)"}`, borderRadius: 12, padding: "14px 16px", marginBottom: 16 }}>
                  <div style={{ fontSize: 14, fontWeight: 900, color: result.value ? "#10b981" : "#94a3b8", marginBottom: 6 }}>{result.value ? "✓ VALUE BET DÉTECTÉ !" : "~ Pas d'opportunité claire"}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, fontFamily: "monospace" }}>
                    {result.value ? `Edge de ${Math.abs(result.edge)}% → Kelly suggère ${result.suggested}% du capital. Ce n'est pas du jeu, c'est de la gestion probabiliste.` : "L'edge est trop faible. Un quant ne trade que lorsque la probabilité réelle dépasse significativement la probabilité implicite."}
                  </div>
                </div>
              )}

              {!result && (
                <button type="button" onClick={submit} style={{ cursor: "pointer", width: "100%", padding: "14px", borderRadius: 12, fontWeight: 900, fontSize: 15, color: "#000", background: "linear-gradient(135deg,#00d4ff,#8b5cf6)", border: "none" }}>
                  Analyser mon edge →
                </button>
              )}
            </div>

            {/* Bottom explanation */}
            <div style={{ background: "rgba(0,0,0,0.3)", padding: "12px 20px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              <p style={{ fontFamily: "monospace", fontSize: 10, color: "rgba(255,255,255,0.3)", textAlign: "center" }}>
                Ce n&apos;est pas du gambling. C&apos;est de la <span style={{ color: "#00d4ff" }}>probabilité, du pricing et de la gestion du risque</span>. — Yoann Beugré
              </p>
            </div>
          </div>
        ) : (
          <div style={S({ background: "rgba(255,255,255,0.025)", borderRadius: 20, border: "1px solid rgba(0,212,255,0.2)", overflow: "hidden" })}>
            <div style={{ padding: "32px 28px", textAlign: "center", background: "linear-gradient(135deg,rgba(0,212,255,0.06),rgba(139,92,246,0.04))" }}>
              <div style={{ fontSize: 56, marginBottom: 10 }}>🎯</div>
              <div style={{ fontSize: 11, fontFamily: "monospace", color: "rgba(255,255,255,0.35)", letterSpacing: 3, textTransform: "uppercase", marginBottom: 8 }}>LAB COMPLETE</div>
              <h3 style={{ fontSize: 24, fontWeight: 900, color: "rgba(255,255,255,0.92)", marginBottom: 6 }}>
                {scores.filter(s => s.value).length} value bets identifiés / {MARKETS.length}
              </h3>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, maxWidth: 420, margin: "0 auto" }}>
                Mon système Polymarket applique exactement cette logique : identifier les inefficiences de prix entre probabilité réelle et probabilité implicite du marché.
              </p>
            </div>
            <div style={{ padding: "20px 24px" }}>
              <div style={{ display: "flex", gap: 10 }}>
                <button type="button" onClick={reset} style={{ cursor: "pointer", flex: 1, padding: "12px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.15)", background: "transparent", color: "rgba(255,255,255,0.65)", fontWeight: 700, fontSize: 14 }}>🔄 Rejouer</button>
                <button type="button" onClick={() => document.querySelector("#projects")?.scrollIntoView({ behavior: "smooth" })} style={{ cursor: "pointer", flex: 1, padding: "12px", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#00d4ff,#8b5cf6)", color: "#000", fontWeight: 900, fontSize: 14 }}>Voir Polymarket →</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
