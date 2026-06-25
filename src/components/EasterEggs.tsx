"use client";

import { useEffect } from "react";
import { unlockAchievement } from "@/lib/achievements";

// Confetti burst from center
function confettiBurst(x: number, y: number) {
    const canvas = document.createElement("canvas");
    canvas.style.cssText = "position:fixed;inset:0;z-index:9999;pointer-events:none";
    document.body.appendChild(canvas);
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext("2d")!;

    const COLORS = ["#00d4ff", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#ffffff"];
    const particles = Array.from({ length: 180 }, () => ({
        x,
        y,
        vx: (Math.random() - 0.5) * 22,
        vy: -(Math.random() * 18 + 4),
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        w: Math.random() * 10 + 4,
        h: Math.random() * 5 + 3,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.3,
        life: 1,
    }));

    const frame = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let alive = false;
        particles.forEach((p) => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.6;
            p.vx *= 0.98;
            p.life -= 0.013;
            p.rotation += p.rotSpeed;
            if (p.life > 0) {
                alive = true;
                ctx.save();
                ctx.globalAlpha = p.life;
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
                ctx.restore();
            }
        });
        if (alive) requestAnimationFrame(frame);
        else document.body.removeChild(canvas);
    };
    requestAnimationFrame(frame);
}

export default function EasterEggs() {
    useEffect(() => {
        // ── Konami code ──
        const KONAMI = [
            "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
            "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight",
            "b", "a",
        ];
        let kIdx = 0;

        const onKey = (e: KeyboardEvent) => {
            if (e.key === KONAMI[kIdx]) {
                kIdx++;
                if (kIdx === KONAMI.length) {
                    kIdx = 0;
                    unlockAchievement("KONAMI");
                    confettiBurst(window.innerWidth / 2, window.innerHeight / 2);
                    // Show a quick toast manually
                    const toast = document.createElement("div");
                    toast.textContent = "🎮 KONAMI CODE ACTIVATED !";
                    toast.style.cssText = `
            position:fixed; top:50%; left:50%; transform:translate(-50%,-50%);
            z-index:9998; font-family:monospace; font-size:1.5rem; font-weight:bold;
            color:#00d4ff; text-shadow:0 0 20px #00d4ff; pointer-events:none;
            animation: fadeOut 2s forwards;
          `;
                    document.body.appendChild(toast);
                    setTimeout(() => document.body.removeChild(toast), 2000);
                }
            } else {
                kIdx = e.key === KONAMI[0] ? 1 : 0;
            }
        };
        window.addEventListener("keydown", onKey);

        // ── Double-click on YOANN name → confetti ──
        let lastClick = 0;
        const onDblClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (target.tagName === "H1" || target.closest("h1")) {
                const now = Date.now();
                if (now - lastClick < 500) {
                    confettiBurst(e.clientX, e.clientY);
                }
                lastClick = now;
            }
        };
        window.addEventListener("click", onDblClick);

        // ── Secret: type "hire" anywhere ──
        let buffer = "";
        const onType = (e: KeyboardEvent) => {
            buffer += e.key.toLowerCase();
            buffer = buffer.slice(-6);
            if (buffer.includes("hire")) {
                confettiBurst(window.innerWidth / 2, window.innerHeight / 3);
                document.querySelector("#contact")?.scrollIntoView({ behavior: "smooth" });
                buffer = "";
            }
        };
        window.addEventListener("keydown", onType);

        return () => {
            window.removeEventListener("keydown", onKey);
            window.removeEventListener("click", onDblClick);
            window.removeEventListener("keydown", onType);
        };
    }, []);

    return null;
}
