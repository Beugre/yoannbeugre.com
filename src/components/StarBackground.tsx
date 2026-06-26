"use client";

import { useEffect, useRef } from "react";

interface Star {
    x: number;
    y: number;
    r: number;
    alpha: number;
    phase: number;
    speed: number;
    color: string;
}

export default function StarBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener("resize", resize);

        const COLORS = ["255,255,255", "0,212,255", "139,92,246", "255,255,255", "255,255,255"];
        const stars: Star[] = Array.from({ length: 600 }, () => ({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            r: Math.random() * 1.4 + 0.15,
            alpha: Math.random() * 0.55 + 0.08,
            phase: Math.random() * Math.PI * 2,
            speed: Math.random() * 0.005 + 0.001,
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
        }));

        let t = 0;
        let raf: number;
        let lastTime = 0;
        const FPS = 30;
        const INTERVAL = 1000 / FPS;

        const draw = (now: number) => {
            raf = requestAnimationFrame(draw);
            if (now - lastTime < INTERVAL) return;
            lastTime = now;
            t += 1;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (const s of stars) {
                const a = s.alpha * (0.6 + 0.4 * Math.sin(t * s.speed + s.phase));
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${s.color},${a.toFixed(3)})`;
                ctx.fill();
            }
        };

        draw(0);

        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener("resize", resize);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 z-0 pointer-events-none"
            style={{ opacity: 0.7 }}
        />
    );
}

