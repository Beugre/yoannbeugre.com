"use client";

import { useEffect, useRef } from "react";

interface Star {
    x: number;
    y: number;
    r: number;
    baseAlpha: number;
    phase: number;
    speed: number;
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

        // Generate stars spread over 3x the viewport height for depth
        const COUNT = 280;
        const stars: Star[] = Array.from({ length: COUNT }, () => ({
            x: Math.random(),
            y: Math.random(),
            r: Math.random() * 1.2 + 0.2,
            baseAlpha: Math.random() * 0.45 + 0.05,
            phase: Math.random() * Math.PI * 2,
            speed: Math.random() * 0.004 + 0.001,
        }));

        // A few brighter accent stars (cyan/violet tint)
        const accentStars: Star[] = Array.from({ length: 18 }, () => ({
            x: Math.random(),
            y: Math.random(),
            r: Math.random() * 1.8 + 0.8,
            baseAlpha: Math.random() * 0.3 + 0.1,
            phase: Math.random() * Math.PI * 2,
            speed: Math.random() * 0.002 + 0.0005,
        }));

        let t = 0;
        let raf: number;

        const draw = () => {
            t += 1;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // White stars
            for (const s of stars) {
                const alpha = s.baseAlpha * (0.6 + 0.4 * Math.sin(t * s.speed + s.phase));
                ctx.beginPath();
                ctx.arc(s.x * canvas.width, s.y * canvas.height, s.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255,255,255,${alpha.toFixed(3)})`;
                ctx.fill();
            }

            // Accent stars (cyan/violet)
            for (const s of accentStars) {
                const alpha = s.baseAlpha * (0.5 + 0.5 * Math.sin(t * s.speed + s.phase));
                const isCyan = s.phase < Math.PI;
                const color = isCyan ? `rgba(0,212,255,${alpha.toFixed(3)})` : `rgba(139,92,246,${alpha.toFixed(3)})`;
                ctx.beginPath();
                ctx.arc(s.x * canvas.width, s.y * canvas.height, s.r, 0, Math.PI * 2);
                ctx.fillStyle = color;
                ctx.shadowBlur = 6;
                ctx.shadowColor = isCyan ? "#00d4ff" : "#8b5cf6";
                ctx.fill();
                ctx.shadowBlur = 0;
            }

            raf = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener("resize", resize);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 z-0 pointer-events-none"
            style={{ opacity: 0.55 }}
        />
    );
}
