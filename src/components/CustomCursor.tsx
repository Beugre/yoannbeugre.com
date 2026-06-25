"use client";

import { useEffect, useRef } from "react";

interface Trail {
  x: number;
  y: number;
  life: number; // 0→1
  size: number;
  symbol: string;
  rotation: number;
  rotSpeed: number;
}

const SYMBOLS = ["₿", "₿", "₿", "◆", "▲", "∑", "⚡"];

export default function CustomCursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trailRef = useRef<Trail[]>([]);
  const mouseRef = useRef({ x: -200, y: -200 });
  const animRef = useRef<number>(0);
  const lastPosRef = useRef({ x: -200, y: -200 });

  useEffect(() => {
    // Curseur natif sur mobile
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
      const { clientX: x, clientY: y } = e;
      mouseRef.current = { x, y };

      // Spawn trail particle si déplacement suffisant
      const dx = x - lastPosRef.current.x;
      const dy = y - lastPosRef.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 12) {
        lastPosRef.current = { x, y };
        trailRef.current.push({
          x,
          y,
          life: 1,
          size: 10 + Math.random() * 8,
          symbol: SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.12,
        });
        // Max 20 particules
        if (trailRef.current.length > 20) trailRef.current.shift();
      }
    };

    window.addEventListener("mousemove", onMove);

    const draw = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update & draw trail
      trailRef.current = trailRef.current.filter(p => p.life > 0);
      for (const p of trailRef.current) {
        p.life -= 0.04;
        p.y -= 0.6;
        p.x += Math.sin(p.rotation) * 0.3;
        p.rotation += p.rotSpeed;
        p.size *= 0.98;

        const alpha = p.life;
        ctx.save();
        ctx.globalAlpha = alpha * 0.8;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.font = `${p.size}px monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        // Couleur dégradée selon symbole
        if (p.symbol === "₿") {
          ctx.fillStyle = `rgba(247, 147, 26, ${alpha})`;
          ctx.shadowColor = "rgba(247,147,26,0.6)";
        } else if (p.symbol === "⚡") {
          ctx.fillStyle = `rgba(250, 204, 21, ${alpha})`;
          ctx.shadowColor = "rgba(250,204,21,0.6)";
        } else if (p.symbol === "∑") {
          ctx.fillStyle = `rgba(139, 92, 246, ${alpha})`;
          ctx.shadowColor = "rgba(139,92,246,0.6)";
        } else {
          ctx.fillStyle = `rgba(0, 212, 255, ${alpha})`;
          ctx.shadowColor = "rgba(0,212,255,0.6)";
        }
        ctx.shadowBlur = 8;
        ctx.fillText(p.symbol, 0, 0);
        ctx.restore();
      }

      animRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animRef.current);
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


export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const followerRef = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  const springConfig = { damping: 25, stiffness: 300, mass: 0.5 };
  const followerX = useSpring(mouseX, { damping: 35, stiffness: 150, mass: 0.8 });
  const followerY = useSpring(mouseY, { damping: 35, stiffness: 150, mass: 0.8 });

  useEffect(() => {
    // Ne s'affiche que sur desktop
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const onMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    const onEnterLink = () => {
      cursorRef.current?.classList.add("scale-150", "opacity-80");
      followerRef.current?.classList.add("scale-150", "border-cyan-400/80");
    };
    const onLeaveLink = () => {
      cursorRef.current?.classList.remove("scale-150", "opacity-80");
      followerRef.current?.classList.remove("scale-150", "border-cyan-400/80");
    };

    window.addEventListener("mousemove", onMove);

    const links = document.querySelectorAll("a, button, [data-cursor]");
    links.forEach((el) => {
      el.addEventListener("mouseenter", onEnterLink);
      el.addEventListener("mouseleave", onLeaveLink);
    });

    return () => {
      window.removeEventListener("mousemove", onMove);
    };
  }, [mouseX, mouseY]);

  return (
    <>
      {/* Dot */}
      <motion.div
        ref={cursorRef}
        className="fixed top-0 left-0 w-3 h-3 rounded-full bg-cyan-400 pointer-events-none z-[9999] mix-blend-difference transition-transform duration-100"
        style={{
          x: mouseX,
          y: mouseY,
          translateX: "-50%",
          translateY: "-50%",
        }}
      />
      {/* Ring follower */}
      <motion.div
        ref={followerRef}
        className="fixed top-0 left-0 w-9 h-9 rounded-full border border-cyan-400/40 pointer-events-none z-[9998] transition-all duration-200"
        style={{
          x: followerX,
          y: followerY,
          translateX: "-50%",
          translateY: "-50%",
        }}
      />
    </>
  );
}
