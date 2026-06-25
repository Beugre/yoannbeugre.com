"use client";

import { useEffect, useRef } from "react";

export default function MatrixRain() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const activeRef = useRef(false);
    const animRef = useRef<number>(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const CHARS = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン01アBCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*";
        const FONT_SIZE = 14;
        let cols: number[] = [];

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            const numCols = Math.floor(canvas.width / FONT_SIZE);
            cols = new Array(numCols).fill(1);
        };

        const draw = () => {
            if (!activeRef.current) return;

            ctx.fillStyle = "rgba(0, 0, 0, 0.04)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = "#00ff41";
            ctx.font = `${FONT_SIZE}px monospace`;

            cols.forEach((y, i) => {
                const char = CHARS[Math.floor(Math.random() * CHARS.length)];
                const x = i * FONT_SIZE;
                ctx.fillStyle = y === 1 ? "#ffffff" : `rgba(0, 255, 65, ${Math.random() * 0.8 + 0.2})`;
                ctx.fillText(char, x, y * FONT_SIZE);

                if (y * FONT_SIZE > canvas.height && Math.random() > 0.975) {
                    cols[i] = 0;
                }
                cols[i]++;
            });

            animRef.current = requestAnimationFrame(draw);
        };

        const startMatrix = () => {
            if (activeRef.current) return;
            activeRef.current = true;
            resize();
            canvas.style.display = "block";
            draw();

            // Auto-stop after 6 seconds
            setTimeout(stopMatrix, 6000);
        };

        const stopMatrix = () => {
            activeRef.current = false;
            cancelAnimationFrame(animRef.current);
            // Fade out
            let opacity = 1;
            const fade = () => {
                opacity -= 0.05;
                canvas.style.opacity = String(Math.max(0, opacity));
                if (opacity > 0) requestAnimationFrame(fade);
                else {
                    canvas.style.display = "none";
                    canvas.style.opacity = "1";
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                }
            };
            fade();
        };

        window.addEventListener("resize", resize);
        window.addEventListener("matrixStart", startMatrix as EventListener);
        window.addEventListener("matrixStop", stopMatrix as EventListener);

        return () => {
            window.removeEventListener("resize", resize);
            window.removeEventListener("matrixStart", startMatrix as EventListener);
            window.removeEventListener("matrixStop", stopMatrix as EventListener);
            cancelAnimationFrame(animRef.current);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 z-[250] pointer-events-none"
            style={{ display: "none", mixBlendMode: "screen" }}
        />
    );
}
