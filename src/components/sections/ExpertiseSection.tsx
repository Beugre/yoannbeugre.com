"use client";

import { useRef, useState, useCallback } from "react";
import { motion, useInView } from "framer-motion";

interface Node {
  id: string;
  label: string;
  category: string;
  x: number; // percent
  y: number;
  color: string;
  size: number;
}

interface Edge { from: string; to: string; }

const NODES: Node[] = [
  // Core
  { id: "python",  label: "Python",     category: "Languages", x: 50, y: 50, color: "#3b82f6", size: 18 },
  { id: "ts",      label: "TypeScript", category: "Languages", x: 32, y: 30, color: "#3178c6", size: 14 },
  { id: "js",      label: "JavaScript", category: "Languages", x: 20, y: 48, color: "#f7df1e", size: 13 },
  { id: "sql",     label: "SQL",        category: "Databases", x: 68, y: 30, color: "#336791", size: 15 },
  { id: "java",    label: "Java",       category: "Languages", x: 18, y: 68, color: "#f89820", size: 12 },
  { id: "csharp",  label: "C#",         category: "Languages", x: 34, y: 72, color: "#9b4f96", size: 11 },
  // AI / Data
  { id: "llm",     label: "LLM",        category: "AI & Data", x: 72, y: 52, color: "#8b5cf6", size: 16 },
  { id: "ml",      label: "ML",         category: "AI & Data", x: 84, y: 38, color: "#7c3aed", size: 13 },
  { id: "pandas",  label: "Pandas",     category: "AI & Data", x: 62, y: 70, color: "#150458", size: 12 },
  { id: "pe",      label: "Prompt Eng", category: "AI & Data", x: 80, y: 62, color: "#a78bfa", size: 12 },
  // Trading
  { id: "binance", label: "Binance",    category: "Trading",   x: 50, y: 16, color: "#f0b90b", size: 15 },
  { id: "poly",    label: "Polymarket", category: "Trading",   x: 66, y: 16, color: "#10b981", size: 13 },
  { id: "ws",      label: "WebSocket",  category: "Trading",   x: 38, y: 16, color: "#06b6d4", size: 12 },
  // Frontend
  { id: "react",   label: "React",      category: "Frontend",  x: 20, y: 36, color: "#61dafb", size: 14 },
  { id: "nextjs",  label: "Next.js",    category: "Frontend",  x: 8,  y: 50, color: "#ffffff", size: 13 },
  { id: "tw",      label: "Tailwind",   category: "Frontend",  x: 10, y: 64, color: "#38bdf8", size: 11 },
  // Infrastructure
  { id: "docker",  label: "Docker",     category: "Infra",     x: 50, y: 84, color: "#2496ed", size: 13 },
  { id: "linux",   label: "Linux",      category: "Infra",     x: 36, y: 86, color: "#fcc624", size: 12 },
  { id: "gh",      label: "GitHub",     category: "Infra",     x: 64, y: 84, color: "#6e40c9", size: 12 },
  // Databases
  { id: "oracle",  label: "Oracle",     category: "Databases", x: 82, y: 20, color: "#ef4444", size: 12 },
  { id: "pg",      label: "PostgreSQL", category: "Databases", x: 80, y: 76, color: "#64748b", size: 12 },
  { id: "firebase",label: "Firebase",   category: "Databases", x: 68, y: 84, color: "#ffca28", size: 11 },
];

const EDGES: Edge[] = [
  { from: "python", to: "binance" }, { from: "python", to: "llm" }, { from: "python", to: "ml" },
  { from: "python", to: "pandas" }, { from: "python", to: "docker" }, { from: "python", to: "pg" },
  { from: "python", to: "ws" }, { from: "python", to: "poly" },
  { from: "sql",    to: "oracle" }, { from: "sql", to: "pg" }, { from: "sql", to: "python" },
  { from: "llm",    to: "pe" }, { from: "llm",  to: "python" }, { from: "llm", to: "react" },
  { from: "react",  to: "ts" }, { from: "react", to: "nextjs" }, { from: "react", to: "tw" },
  { from: "nextjs", to: "ts" }, { from: "ts", to: "js" },
  { from: "binance",to: "ws" }, { from: "binance", to: "pg" }, { from: "binance", to: "firebase" },
  { from: "docker", to: "linux" }, { from: "docker", to: "gh" },
  { from: "ml",     to: "pandas" }, { from: "ml", to: "pe" },
  { from: "poly",   to: "firebase" }, { from: "poly", to: "ws" },
  { from: "sql",    to: "firebase" },
  { from: "pg",     to: "firebase" },
];

const CATEGORY_INFO: Record<string, { label: string; color: string }> = {
  "Languages": { label: "Langages", color: "#3b82f6" },
  "AI & Data": { label: "AI & Data", color: "#8b5cf6" },
  "Trading":   { label: "Trading & Finance", color: "#f0b90b" },
  "Frontend":  { label: "Frontend", color: "#61dafb" },
  "Infra":     { label: "Infrastructure", color: "#2496ed" },
  "Databases": { label: "Databases", color: "#ef4444" },
};

function getConnected(nodeId: string): string[] {
  return EDGES.filter(e => e.from === nodeId || e.to === nodeId)
    .map(e => e.from === nodeId ? e.to : e.from);
}

export default function ExpertiseSection() {
  const ref = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });
  const [hovered, setHovered] = useState<string | null>(null);
  const [selectedCat, setSelectedCat] = useState<string | null>(null);

  const connected = hovered ? getConnected(hovered) : [];

  const isNodeActive = useCallback((n: Node) => {
    if (hovered) return n.id === hovered || connected.includes(n.id);
    if (selectedCat) return n.category === selectedCat;
    return true;
  }, [hovered, connected, selectedCat]);

  const isEdgeActive = useCallback((e: Edge) => {
    if (hovered) return e.from === hovered || e.to === hovered;
    if (selectedCat) {
      const fn = NODES.find(n => n.id === e.from);
      const tn = NODES.find(n => n.id === e.to);
      return fn?.category === selectedCat || tn?.category === selectedCat;
    }
    return false;
  }, [hovered, selectedCat]);

  const hoveredNode = NODES.find(n => n.id === hovered);

  return (
    <section id="expertise" className="relative py-32 px-6 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-950/5 to-transparent pointer-events-none" />

      <div ref={ref} className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div className="mb-14" initial={{ opacity: 0, y: 40 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7 }}>
          <div className="flex items-center gap-4 mb-3">
            <div className="glow-line w-12" />
            <span className="text-xs font-mono text-cyan-400 tracking-widest uppercase">02 / Skill Matrix</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-black text-white/90 mb-3">
            Les compétences ne sont pas<br />
            <span className="text-gradient-static">isolées. Elles forment un système.</span>
          </h2>
          <p className="text-white/40 text-sm font-mono">Survolez un nœud pour voir ses connexions</p>
        </motion.div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Category filters */}
          <motion.div className="space-y-2" initial={{ opacity: 0, x: -20 }} animate={isInView ? { opacity: 1, x: 0 } : {}} transition={{ delay: 0.3 }}>
            <div className="text-xs font-mono text-white/30 mb-3 uppercase tracking-widest">Catégories</div>
            <button type="button" onClick={() => setSelectedCat(null)}
              className="w-full text-left px-3 py-2.5 rounded-lg text-xs font-mono transition-all"
              style={{ background: !selectedCat ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.02)", color: !selectedCat ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.4)", border: `1px solid ${!selectedCat ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.05)"}` }}>
              ALL NODES
            </button>
            {Object.entries(CATEGORY_INFO).map(([key, { label, color }]) => (
              <button key={key} type="button" onClick={() => setSelectedCat(selectedCat === key ? null : key)}
                className="w-full text-left px-3 py-2.5 rounded-lg text-xs font-mono transition-all flex items-center gap-2"
                style={{ background: selectedCat === key ? `${color}18` : "rgba(255,255,255,0.02)", border: `1px solid ${selectedCat === key ? `${color}40` : "rgba(255,255,255,0.05)"}`, color: selectedCat === key ? color : "rgba(255,255,255,0.4)" }}>
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                {label}
              </button>
            ))}

            {/* Hover info card */}
            {hoveredNode && (
              <motion.div className="glass rounded-xl p-4 border border-white/10 mt-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: hoveredNode.color }} />
                  <span className="font-bold text-white/90 text-sm">{hoveredNode.label}</span>
                </div>
                <div className="text-xs font-mono mb-2" style={{ color: CATEGORY_INFO[hoveredNode.category]?.color }}>
                  {CATEGORY_INFO[hoveredNode.category]?.label}
                </div>
                <div className="text-xs text-white/40 font-mono">
                  Connecté à :
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {connected.map(cid => {
                    const cn = NODES.find(n => n.id === cid);
                    return cn ? (
                      <span key={cid} className="text-[10px] px-2 py-0.5 rounded font-mono" style={{ background: `${cn.color}18`, color: cn.color, border: `1px solid ${cn.color}30` }}>
                        {cn.label}
                      </span>
                    ) : null;
                  })}
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* SVG Skill Matrix */}
          <motion.div className="lg:col-span-3 glass rounded-2xl border border-white/8 overflow-hidden relative"
            style={{ minHeight: 480 }}
            initial={{ opacity: 0, scale: 0.95 }} animate={isInView ? { opacity: 1, scale: 1 } : {}} transition={{ delay: 0.2 }}>

            <div className="absolute top-3 left-3 text-[10px] font-mono text-white/20 z-10">
              SKILL.MATRIX · {NODES.length} nodes · {EDGES.length} connections
            </div>

            <svg
              ref={svgRef}
              viewBox="0 0 100 100"
              className="w-full h-full"
              style={{ minHeight: 480 }}
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                <filter id="skglow">
                  <feGaussianBlur stdDeviation="0.6" result="b" />
                  <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>

              {/* Edges */}
              {EDGES.map((e, i) => {
                const fn = NODES.find(n => n.id === e.from);
                const tn = NODES.find(n => n.id === e.to);
                if (!fn || !tn) return null;
                const active = isEdgeActive(e);
                const dim = hovered && !active;
                return (
                  <line key={i}
                    x1={fn.x} y1={fn.y} x2={tn.x} y2={tn.y}
                    stroke={active ? fn.color : "rgba(255,255,255,0.06)"}
                    strokeWidth={active ? "0.5" : "0.2"}
                    opacity={dim ? 0.05 : active ? 0.85 : 0.2}
                    style={{ transition: "all 0.25s ease" }}
                  />
                );
              })}

              {/* Animated packets on active edges */}
              {hovered && EDGES.filter(isEdgeActive).map((e, i) => {
                const fn = NODES.find(n => n.id === e.from);
                const tn = NODES.find(n => n.id === e.to);
                if (!fn || !tn) return null;
                return (
                  <circle key={`p${i}`} r="0.4" fill={fn.color} opacity="0.9">
                    <animateMotion dur={`${1.2 + i * 0.3}s`} repeatCount="indefinite" path={`M${fn.x},${fn.y} L${tn.x},${tn.y}`} />
                  </circle>
                );
              })}

              {/* Nodes */}
              {NODES.map(n => {
                const active = isNodeActive(n);
                const isHov = n.id === hovered;
                const isConn = connected.includes(n.id);
                const dimmed = (hovered || selectedCat) && !active;
                return (
                  <g key={n.id}
                    onMouseEnter={() => setHovered(n.id)}
                    onMouseLeave={() => setHovered(null)}
                    style={{ cursor: "pointer" }}
                  >
                    {/* Glow ring when hovered */}
                    {isHov && (
                      <circle cx={n.x} cy={n.y} r={n.size / 10 + 1.2} fill={n.color} opacity="0.12">
                        <animate attributeName="r" values={`${n.size / 10 + 0.8};${n.size / 10 + 1.8};${n.size / 10 + 0.8}`} dur="1.2s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.12;0.22;0.12" dur="1.2s" repeatCount="indefinite" />
                      </circle>
                    )}

                    {/* Node circle */}
                    <circle
                      cx={n.x} cy={n.y}
                      r={isHov ? n.size / 9 + 0.5 : isConn ? n.size / 10 + 0.2 : n.size / 10}
                      fill={n.color}
                      opacity={dimmed ? 0.08 : isHov ? 1 : isConn ? 0.85 : active ? 0.6 : 0.5}
                      filter={isHov || isConn ? "url(#skglow)" : undefined}
                      style={{ transition: "all 0.2s ease" }}
                    />

                    {/* Label */}
                    <text
                      x={n.x} y={n.y + n.size / 9 + 1.2}
                      textAnchor="middle"
                      fontSize="1.8"
                      fontFamily="monospace"
                      fontWeight={isHov ? "bold" : "normal"}
                      fill={isHov ? n.color : isConn ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.45)"}
                      opacity={dimmed ? 0.15 : 1}
                      style={{ transition: "all 0.2s ease", pointerEvents: "none" }}
                    >
                      {n.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </motion.div>
        </div>

        {/* Bottom tagline */}
        <motion.div className="mt-10 glass rounded-xl p-4 border border-cyan-400/10 text-center" initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}} transition={{ delay: 0.8 }}>
          <p className="text-white/40 font-mono text-sm">
            <span className="text-cyan-400">const</span>{" "}
            <span className="text-white/70">philosophy</span>{" "}
            <span className="text-white/40">= </span>
            <span className="text-emerald-400">&quot;Each skill is a node. Each project is a graph. Each system is emergent.&quot;</span>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
