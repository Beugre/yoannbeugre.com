"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

const ROLES = ["Software Engineer", "AI Engineer", "Quant Developer", "Algorithmic Builder", "Bot Architect", "Math Enthusiast"];

function NeuralCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: 0, y: 0 });
  const raf = useRef<number>(0);

  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize(); window.addEventListener("resize", resize);
    window.addEventListener("mousemove", e => { mouse.current = { x: e.clientX, y: e.clientY }; });

    type N = { x: number; y: number; vx: number; vy: number; r: number; pulse: number; };
    const nodes: N[] = Array.from({ length: 55 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25,
      r: Math.random() * 2 + 1, pulse: Math.random() * Math.PI * 2,
    }));

    let t = 0;
    const draw = () => {
      t += 0.008;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const mx = mouse.current.x, my = mouse.current.y;

      nodes.forEach(n => {
        n.pulse += 0.02;
        const dx = mx - n.x, dy = my - n.y, dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 180) { n.vx += dx / dist * 0.015; n.vy += dy / dist * 0.015; }
        n.vx *= 0.98; n.vy *= 0.98;
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0) n.x = canvas.width; if (n.x > canvas.width) n.x = 0;
        if (n.y < 0) n.y = canvas.height; if (n.y > canvas.height) n.y = 0;
      });

      // Connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 140) {
            const a = (1 - d / 140) * 0.35;
            const fromMouse = Math.sqrt((mx - nodes[i].x) ** 2 + (my - nodes[i].y) ** 2);
            const boost = fromMouse < 200 ? 1.8 : 1;
            ctx.beginPath(); ctx.moveTo(nodes[i].x, nodes[i].y); ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `rgba(0,212,255,${a * boost})`; ctx.lineWidth = 0.6 * boost; ctx.stroke();
          }
        }
      }

      // Nodes
      nodes.forEach(n => {
        const fromMouse = Math.sqrt((mx - n.x) ** 2 + (my - n.y) ** 2);
        const glow = fromMouse < 150 ? 1.6 : 1;
        const alpha = 0.4 + Math.sin(n.pulse) * 0.25;
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r * glow, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,212,255,${alpha * glow})`; 
        if (glow > 1) { ctx.shadowBlur = 10; ctx.shadowColor = "#00d4ff"; }
        ctx.fill(); ctx.shadowBlur = 0;
      });

      // Floating data streams
      for (let i = 0; i < 5; i++) {
        const x = (i * 180 + t * 30) % canvas.width;
        const y = canvas.height * 0.3 + Math.sin(t + i) * 80;
        ctx.font = "9px monospace"; ctx.fillStyle = `rgba(139,92,246,${0.15 + Math.sin(t + i) * 0.1})`;
        ctx.fillText(["0.618", "RSI", "BTC", "∑", "λ=0.08"][i], x, y);
      }

      raf.current = requestAnimationFrame(draw);
    };
    draw();
    return () => { window.removeEventListener("resize", resize); cancelAnimationFrame(raf.current); };
  }, []);

  return <canvas ref={ref} className="absolute inset-0 w-full h-full" style={{ opacity: 0.6 }} />;
}

function TypedRole() {
  const [displayed, setDisplayed] = useState("");
  const [ri, setRi] = useState(0);
  const [del, setDel] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) { const t = setTimeout(() => { setPaused(false); setDel(true); }, 1800); return () => clearTimeout(t); }
    const cur = ROLES[ri];
    if (!del) {
      if (displayed.length < cur.length) { const t = setTimeout(() => setDisplayed(cur.slice(0, displayed.length + 1)), 55); return () => clearTimeout(t); }
      setPaused(true);
    } else {
      if (displayed.length > 0) { const t = setTimeout(() => setDisplayed(s => s.slice(0, -1)), 30); return () => clearTimeout(t); }
      setDel(false); setRi(i => (i + 1) % ROLES.length);
    }
  }, [displayed, del, ri, paused]);

  return <><span className="text-cyan-400">{displayed}</span><span className="animate-pulse text-cyan-400">|</span></>;
}

export default function HeroSection() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => { const t = setTimeout(() => setLoaded(true), 400); return () => clearTimeout(t); }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Deep background */}
      <div className="absolute inset-0 bg-[#030712]" />
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(0,212,255,0.04) 0%, transparent 70%)" }} />

      {/* Grid */}
      <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: "linear-gradient(rgba(0,212,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(0,212,255,1) 1px,transparent 1px)", backgroundSize: "60px 60px" }} />

      {/* Neural network */}
      <NeuralCanvas />

      {/* Scan line */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(transparent 50%,rgba(0,212,255,0.008) 50%)", backgroundSize: "100% 3px" }} />

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">

        {/* Status badge */}
        <div className={`flex items-center justify-center mb-8 transition-all duration-700 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-400/20 bg-cyan-400/5 backdrop-blur-sm">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono text-cyan-300/70 tracking-[0.2em] uppercase">YOANN CORE — System Online</span>
          </div>
        </div>

        {/* HUD corners */}
        <div className="absolute top-8 left-8 text-[10px] font-mono text-white/15 text-left hidden md:block">
          <div className="text-cyan-400/40">◈ YOANN.CORE.v1.0</div>
          <div className="mt-1">STATUS: <span className="text-emerald-400/60">ACTIVE</span></div>
          <div className="mt-1">MODULES: <span className="text-white/30">7/8</span></div>
        </div>
        <div className="absolute top-8 right-8 text-[10px] font-mono text-white/15 text-right hidden md:block">
          <div className="text-cyan-400/40">QUANT·AI·SWE</div>
          <div className="mt-1">ALGO: <span className="text-violet-400/60">RSI+DUAL-MOM</span></div>
          <div className="mt-1">ENV: <span className="text-yellow-400/60">PRODUCTION</span></div>
        </div>

        {/* Photo + Name layout */}
        <div className={`flex flex-col items-center gap-4 mb-6 transition-all duration-900 delay-100 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}>
          
          {/* Photo with HUD ring */}
          <div className="relative mb-2">
            {/* Rotating ring */}
            <div className="absolute inset-0 rounded-full" style={{ background: "conic-gradient(from 0deg, #00d4ff, #8b5cf6, #00d4ff)", animation: "spin 8s linear infinite", padding: 2, borderRadius: "50%", width: 100, height: 100, top: -4, left: -4 }}>
              <div style={{ background: "#030712", borderRadius: "50%", width: "100%", height: "100%", boxSizing: "border-box" }} />
            </div>
            <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-cyan-400/30">
              <Image src="/yoann.jpg" alt="Yoann Beugré" fill className="object-cover object-top" style={{ filter: "contrast(1.08) saturate(0.85)" }} priority />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 60%, rgba(3,7,18,0.6))" }} />
            </div>
            {/* HUD dots */}
            <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#030712]" style={{ animation: "pulse 2s infinite" }} />
          </div>

          {/* Name */}
          <div>
            <h1 className="text-5xl md:text-7xl lg:text-[8rem] font-black tracking-tighter leading-none" style={{ background: "linear-gradient(135deg, #ffffff 0%, rgba(255,255,255,0.7) 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              YOANN
            </h1>
            <h1 className="text-5xl md:text-7xl lg:text-[8rem] font-black tracking-tighter leading-none text-gradient">
              BEUGRÉ
            </h1>
          </div>
        </div>

        {/* Typed role */}
        <div className={`h-8 flex items-center justify-center mb-6 transition-all duration-700 delay-200 ${loaded ? "opacity-100" : "opacity-0"}`}>
          <span className="text-white/30 font-mono text-xl mr-2">{"<"}</span>
          <span className="text-xl font-mono font-semibold min-w-[280px] text-left"><TypedRole /></span>
          <span className="text-white/30 font-mono text-xl ml-2">{"/>"}</span>
        </div>

        {/* Tagline */}
        <p className={`max-w-2xl mx-auto text-white/40 text-base leading-relaxed mb-10 transition-all duration-700 delay-300 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          Je conçois des <span className="text-cyan-400">systèmes intelligents</span> à l&apos;intersection du code, des mathématiques,
          de l&apos;IA et de la <span className="text-violet-400">finance quantitative</span>. Chaque ligne de code est une démonstration mathématique appliquée.
        </p>

        {/* CTAs */}
        <div className={`flex flex-col sm:flex-row items-center justify-center gap-4 transition-all duration-700 delay-400 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <button
            onClick={() => document.querySelector("#trade")?.scrollIntoView({ behavior: "smooth" })}
            type="button" style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 28px", borderRadius: 14, fontWeight: 900, fontSize: 15, color: "#000", background: "linear-gradient(135deg,#00d4ff,#8b5cf6)", border: "none" }}
          >
            🚀 Start the mission
          </button>
          <button
            onClick={() => document.querySelector("#projects")?.scrollIntoView({ behavior: "smooth" })}
            type="button" style={{ cursor: "pointer", padding: "14px 28px", borderRadius: 14, fontWeight: 700, fontSize: 15, color: "rgba(255,255,255,0.65)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)" }}
          >
            View projects →
          </button>
        </div>

        {/* Scroll cue */}
        <div className={`absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 transition-all duration-700 delay-700 ${loaded ? "opacity-100" : "opacity-0"}`}>
          <span className="text-xs font-mono text-white/20 tracking-widest uppercase">Explore</span>
          <div className="w-px h-10 bg-gradient-to-b from-cyan-400/50 to-transparent" style={{ animation: "heroScroll 1.5s ease-in-out infinite" }} />
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes heroScroll { 0%,100%{opacity:0.3;transform:scaleY(1)} 50%{opacity:0.8;transform:scaleY(1.3)} }
      `}</style>
    </section>
  );
}
