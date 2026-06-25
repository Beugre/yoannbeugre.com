"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number; y: number;
  life: number;
  size: number;
  symbol: string;
  rotation: number;
  rotSpeed: number;
  vx: number; vy: number;
}

const SYMBOLS = ["₿", "₿", "₿", "◆", "▲", "∑", "⚡"];

export default function CustomCursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const mouse = useRef({ x: -300, y: -300 });
  const lastSpawn = useRef({ x: -300, y: -300 });
  const raf = useRef<number>(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const onMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY };
      const dx = e.clientX - lastSpawn.current.x;
      const dy = e.clientY - lastSpawn.current.y;
      if (Math.sqrt(dx * dx + dy * dy) > 14) {
        lastSpawn.current = { x: e.clientX, y: e.clientY };
        particles.current.push({
          x: e.clientX,
          y: e.clientY,
          life: 1,
          size: 10 + Math.random() * 7,
          symbol: SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.1,
          vx: (Math.random() - 0.5) * 1.2,
          vy: -(Math.random() * 1.5 + 0.5),
        });
        if (particles.current.length > 22) particles.current.shift();
      }
    };

    window.addEventListener("mousemove", onMove);

    const draw = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) { raf.current = requestAnimationFrame(draw); return; }
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.current = particles.current.filter(p => p.life > 0.01);

      for (const p of particles.current) {
        p.life -= 0.035;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotSpeed;
        p.size *= 0.985;

        ctx.save();
        ctx.globalAlpha = p.life * 0.85;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.font = `${Math.max(6, p.size)}px monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        if (p.symbol === "₿") {
          ctx.fillStyle = "#f7931a";
          ctx.shadowColor = "rgba(247,147,26,0.7)";
        } else if (p.symbol === "⚡") {
          ctx.fillStyle = "#facc15";
          ctx.shadowColor = "rgba(250,204,21,0.7)";
        } else if (p.symbol === "∑") {
          ctx.fillStyle = "#8b5cf6";
          ctx.shadowColor = "rgba(139,92,246,0.7)";
        } else {
          ctx.fillStyle = "#00d4ff";
          ctx.shadowColor = "rgba(0,212,255,0.7)";
        }
        ctx.shadowBlur = 10;
        ctx.fillText(p.symbol, 0, 0);
        ctx.restore();
      }

      raf.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[9998]"
      style={{ mixBlendMode: "screen" }}
    />
  );
}
