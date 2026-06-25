"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, useInView } from "framer-motion";

interface SNode {
  id: string; label: string; category: string;
  x: number; y: number; color: string; size: number;
  desc: string; usedIn: string; purpose: string; connected: string[];
}

interface SEdge { from: string; to: string; animated?: boolean; }

const NODES: SNode[] = [
  { id: "python",   label: "Python",       category: "core",    x: 50, y: 50, color: "#3b82f6", size: 16, desc: "Moteur principal de tous les systèmes", usedIn: "All projects", purpose: "Core language — trading bots, AI agents, data pipelines, automation", connected: ["binance","llm","polymarket","pg","docker","ws","telegram"] },
  { id: "binance",  label: "Binance API",  category: "trading", x: 22, y: 28, color: "#f0b90b", size: 13, desc: "Source de données et exécution d'ordres", usedIn: "Quant Trading Engine", purpose: "Market data (klines, orderbook), order execution, account management", connected: ["python","ws","telegram","pg"] },
  { id: "ws",       label: "WebSocket",    category: "trading", x: 8,  y: 45, color: "#06b6d4", size: 11, desc: "Flux de données temps réel", usedIn: "Trading Bot, Polymarket", purpose: "Real-time price feeds, order updates, live market data", connected: ["binance","python","polymarket"] },
  { id: "telegram", label: "Telegram",     category: "notify",  x: 8,  y: 64, color: "#3b82f6", size: 11, desc: "Alertes et notifications instantanées", usedIn: "All bots", purpose: "Real-time alerts, trade notifications, system status", connected: ["python","binance"] },
  { id: "polymarket",label:"Polymarket",   category: "trading", x: 26, y: 76, color: "#10b981", size: 13, desc: "Marchés prédictifs DeFi / Polygon", usedIn: "Polymarket Analyzer", purpose: "Prediction market data, position management, probability analysis", connected: ["python","ws","firebase"] },
  { id: "llm",      label: "LLM Engine",   category: "ai",      x: 72, y: 30, color: "#8b5cf6", size: 14, desc: "Moteur d'intelligence artificielle", usedIn: "AI Agents, Portfolio AI", purpose: "Reasoning, automation, explanations, portfolio assistant (GPT-4o-mini)", connected: ["python","agents","openai"] },
  { id: "openai",   label: "OpenAI API",   category: "ai",      x: 86, y: 20, color: "#a78bfa", size: 11, desc: "Provider LLM principal", usedIn: "AI Agents", purpose: "GPT-4o-mini — reasoning, text generation, function calling", connected: ["llm"] },
  { id: "agents",   label: "AI Agents",    category: "ai",      x: 85, y: 42, color: "#7c3aed", size: 12, desc: "Agents autonomes multi-tools", usedIn: "AI Automation", purpose: "Autonomous task execution, tool use, multi-step reasoning, workflows", connected: ["llm","python"] },
  { id: "firebase", label: "Firebase",     category: "db",      x: 40, y: 84, color: "#f97316", size: 11, desc: "Base de données temps réel NoSQL", usedIn: "Polymarket, Trading", purpose: "Real-time persistence, alerts history, portfolio snapshots", connected: ["python","polymarket","pg"] },
  { id: "pg",       label: "PostgreSQL",   category: "db",      x: 60, y: 84, color: "#64748b", size: 12, desc: "Base relationnelle principale", usedIn: "All projects", purpose: "Trade history, performance metrics, backtesting data, reporting", connected: ["python","binance","firebase"] },
  { id: "oracle",   label: "Oracle SQL",   category: "db",      x: 82, y: 72, color: "#ef4444", size: 11, desc: "Database enterprise — SQL avancé", usedIn: "SQL Performance Lab", purpose: "Enterprise ERP data, optimized stored procedures, ETL pipelines", connected: ["python"] },
  { id: "docker",   label: "Docker",       category: "infra",   x: 72, y: 65, color: "#2496ed", size: 11, desc: "Containerisation des services", usedIn: "All deployments", purpose: "Containerization, reproducible environments, CI/CD, orchestration", connected: ["python"] },
  { id: "stream",   label: "Streamlit",    category: "ui",      x: 20, y: 54, color: "#ff6b6b", size: 10, desc: "Dashboard monitoring trading", usedIn: "Trading Bot", purpose: "Real-time P&L dashboard, bot metrics, trade history visualization", connected: ["python","pg"] },
];

const EDGES: SEdge[] = [
  { from: "python", to: "binance", animated: true },
  { from: "python", to: "llm",     animated: true },
  { from: "python", to: "polymarket", animated: true },
  { from: "python", to: "pg"  }, { from: "python", to: "docker" },
  { from: "python", to: "ws"  }, { from: "python", to: "telegram" },
  { from: "python", to: "oracle" }, { from: "python", to: "stream" },
  { from: "binance", to: "ws" }, { from: "binance", to: "telegram" }, { from: "binance", to: "pg" },
  { from: "llm", to: "openai" }, { from: "llm", to: "agents", animated: true },
  { from: "polymarket", to: "ws" }, { from: "polymarket", to: "firebase" },
  { from: "pg", to: "firebase" },
  { from: "stream", to: "pg" },
];

const CAT_COLORS: Record<string, string> = {
  core: "#3b82f6", trading: "#f0b90b", ai: "#8b5cf6", db: "#ef4444", infra: "#2496ed", notify: "#10b981", ui: "#ff6b6b"
};

export default function ArchitectureSection() {
  const ref = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.15 });
  const [selected, setSelected] = useState<SNode | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const animRef = useRef<number>(0);
  const t = useRef(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    t.current += 0.008;
    ctx.clearRect(0, 0, W, H);

    const nx = (pct: number) => (pct / 100) * W;
    const ny = (pct: number) => (pct / 100) * H;

    const selId = selected?.id;

    EDGES.forEach((edge, ei) => {
      const fn = NODES.find(n => n.id === edge.from);
      const tn = NODES.find(n => n.id === edge.to);
      if (!fn || !tn) return;
      const x1 = nx(fn.x), y1 = ny(fn.y), x2 = nx(tn.x), y2 = ny(tn.y);
      const isActive = !selId || fn.id === selId || tn.id === selId;
      const alpha = isActive ? (edge.animated ? 0.6 : 0.25) : 0.04;

      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
      ctx.strokeStyle = isActive ? `${fn.color}${Math.round(alpha * 255).toString(16).padStart(2, "0")}` : "rgba(255,255,255,0.04)";
      ctx.lineWidth = isActive ? (edge.animated ? 1.5 : 0.8) : 0.4;
      ctx.stroke();

      if (edge.animated && isActive) {
        const tPkt = ((t.current * 0.5 + ei * 0.3) % 1);
        const px = x1 + (x2 - x1) * tPkt, py = y1 + (y2 - y1) * tPkt;
        ctx.beginPath(); ctx.arc(px, py, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = fn.color; ctx.shadowBlur = 8; ctx.shadowColor = fn.color; ctx.fill(); ctx.shadowBlur = 0;
      }
    });

    NODES.forEach(n => {
      const x = nx(n.x), y = ny(n.y), s = n.size;
      const isActive = !selId || n.id === selId || (selected?.connected ?? []).includes(n.id);
      const isHov = n.id === hovered;
      const alpha = isActive ? (isHov ? 1 : 0.85) : 0.12;

      // Glow
      const grd = ctx.createRadialGradient(x, y, 0, x, y, s * 2.2);
      grd.addColorStop(0, `${n.color}${Math.round(alpha * 0.28 * 255).toString(16).padStart(2, "0")}`);
      grd.addColorStop(1, "transparent");
      ctx.beginPath(); ctx.arc(x, y, s * 2.2, 0, Math.PI * 2); ctx.fillStyle = grd; ctx.fill();

      // Border
      ctx.beginPath(); ctx.arc(x, y, s, 0, Math.PI * 2);
      ctx.strokeStyle = `${n.color}${Math.round(alpha * 0.7 * 255).toString(16).padStart(2, "0")}`;
      ctx.lineWidth = isHov ? 2.5 : 1.5; ctx.stroke();

      // Fill
      ctx.beginPath(); ctx.arc(x, y, s * 0.65, 0, Math.PI * 2);
      ctx.fillStyle = `${n.color}${Math.round(alpha * 0.35 * 255).toString(16).padStart(2, "0")}`;
      ctx.fill();

      // Label
      ctx.font = `${isHov ? "bold " : ""}${Math.max(8, s * 0.72)}px monospace`;
      ctx.fillStyle = `rgba(255,255,255,${isActive ? 0.82 : 0.12})`;
      ctx.textAlign = "center"; ctx.fillText(n.label, x, y + s + 10);
    });

    animRef.current = requestAnimationFrame(draw);
  }, [selected, hovered]);

  useEffect(() => {
    if (!isInView) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const p = canvas.parentElement;
      if (p) { canvas.width = p.clientWidth; canvas.height = p.clientHeight; }
    };
    resize(); window.addEventListener("resize", resize);
    draw();
    return () => { window.removeEventListener("resize", resize); cancelAnimationFrame(animRef.current); };
  }, [isInView, draw]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * 100;
    const my = ((e.clientY - rect.top) / rect.height) * 100;
    let found: string | null = null;
    for (const n of NODES) {
      const dx = mx - n.x, dy = my - n.y;
      if (Math.sqrt(dx * dx + dy * dy) < n.size / 4) { found = n.id; break; }
    }
    setHovered(found);
    canvas.style.cursor = found ? "pointer" : "default";
  }, []);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * 100;
    const my = ((e.clientY - rect.top) / rect.height) * 100;
    for (const n of NODES) {
      const dx = mx - n.x, dy = my - n.y;
      if (Math.sqrt(dx * dx + dy * dy) < n.size / 4) {
        setSelected(prev => prev?.id === n.id ? null : n); return;
      }
    }
    setSelected(null);
  }, []);

  return (
    <section id="architecture" className="relative py-32 px-6 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-950/5 to-transparent pointer-events-none" />

      <div ref={ref} className="max-w-7xl mx-auto">
        <motion.div className="mb-12" initial={{ opacity: 0, y: 40 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7 }}>
          <div className="flex items-center gap-4 mb-3">
            <div className="glow-line w-12" />
            <span className="text-xs font-mono text-cyan-400 tracking-widest uppercase">05 / Live System Graph</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-black text-white/90">
            L&apos;architecture vivante <span className="text-gradient-static">de mes systèmes</span>
          </h2>
          <p className="mt-2 text-white/35 text-sm font-mono">Cliquez sur un nœud pour voir sa description et ses connexions</p>
        </motion.div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Canvas */}
          <motion.div className="lg:col-span-3 glass rounded-2xl border border-white/8 overflow-hidden relative"
            style={{ height: 520 }}
            initial={{ opacity: 0, scale: 0.95 }} animate={isInView ? { opacity: 1, scale: 1 } : {}} transition={{ delay: 0.2 }}>
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full"
              onMouseMove={handleMouseMove} onMouseLeave={() => setHovered(null)} onClick={handleClick} />
            <div className="absolute top-3 left-3 text-[10px] font-mono text-white/20 pointer-events-none">
              SYSTEM.GRAPH · {NODES.length} services · {EDGES.length} connections · live
            </div>
          </motion.div>

          {/* Info panel */}
          <motion.div className="space-y-4" initial={{ opacity: 0, x: 20 }} animate={isInView ? { opacity: 1, x: 0 } : {}} transition={{ delay: 0.4 }}>
            {/* Selected node info */}
            {selected ? (
              <div className="glass rounded-xl p-4 border border-white/10">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 rounded-full" style={{ background: selected.color }} />
                  <span className="font-bold text-white/90">{selected.label}</span>
                  <button type="button" onClick={() => setSelected(null)} className="ml-auto text-white/30 hover:text-white/70 text-xs font-mono" style={{ cursor: "pointer" }}>✕</button>
                </div>
                <div className="text-xs font-mono px-2 py-0.5 rounded inline-block mb-3" style={{ background: `${CAT_COLORS[selected.category]}18`, color: CAT_COLORS[selected.category] }}>
                  {selected.category.toUpperCase()}
                </div>
                <div className="space-y-2 text-xs">
                  <div><span className="text-white/30 font-mono">Used in:</span><br /><span className="text-white/65">{selected.usedIn}</span></div>
                  <div><span className="text-white/30 font-mono">Purpose:</span><br /><span className="text-white/55 leading-relaxed">{selected.purpose}</span></div>
                  <div>
                    <span className="text-white/30 font-mono">Connected to:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selected.connected.map(cid => {
                        const cn = NODES.find(n => n.id === cid);
                        return cn ? (
                          <button key={cid} type="button" onClick={() => setSelected(cn)} style={{ cursor: "pointer", background: `${cn.color}15`, color: cn.color, border: `1px solid ${cn.color}30` }}
                            className="text-[10px] px-2 py-0.5 rounded font-mono hover:scale-105 transition-transform">
                            {cn.label}
                          </button>
                        ) : null;
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="glass rounded-xl p-4 border border-white/8 text-center">
                <div className="text-2xl mb-2">🔍</div>
                <div className="text-xs font-mono text-white/30">Cliquez sur un nœud pour voir ses détails</div>
              </div>
            )}

            {/* Legend */}
            <div className="glass rounded-xl p-4 border border-white/8">
              <div className="text-xs font-mono text-white/30 mb-3 uppercase tracking-widest">Catégories</div>
              <div className="space-y-2">
                {Object.entries(CAT_COLORS).map(([cat, color]) => (
                  <div key={cat} className="flex items-center gap-2 text-xs font-mono">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                    <span className="text-white/45 capitalize">{cat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Animated dots key */}
            <div className="glass rounded-xl p-3 border border-white/8">
              <div className="flex items-center gap-2 text-xs font-mono text-white/30">
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                Paquets animés = flux de données actifs
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
