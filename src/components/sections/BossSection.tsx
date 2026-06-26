"use client";

import { useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";

function confettiBurst() {
    const canvas = document.createElement("canvas");
    canvas.style.cssText = "position:fixed;inset:0;z-index:9999;pointer-events:none";
    document.body.appendChild(canvas);
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext("2d")!;
    const COLORS = ["#00d4ff", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#ffffff"];
    const particles = Array.from({ length: 200 }, () => ({
        x: window.innerWidth / 2, y: window.innerHeight / 2,
        vx: (Math.random() - 0.5) * 25, vy: -(Math.random() * 20 + 5),
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        w: Math.random() * 12 + 5, h: Math.random() * 6 + 3,
        rotation: Math.random() * Math.PI * 2, rotSpeed: (Math.random() - 0.5) * 0.4,
        life: 1,
    }));
    const frame = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let alive = false;
        particles.forEach((p) => {
            p.x += p.vx; p.y += p.vy; p.vy += 0.7; p.vx *= 0.97;
            p.life -= 0.011; p.rotation += p.rotSpeed;
            if (p.life > 0) {
                alive = true;
                ctx.save(); ctx.globalAlpha = p.life;
                ctx.translate(p.x, p.y); ctx.rotate(p.rotation);
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

export default function BossSection() {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, amount: 0.3 });
    const [hired, setHired] = useState(false);

    const handleHire = () => {
        confettiBurst();
        setHired(true);
        setTimeout(() => {
            document.querySelector("#contact")?.scrollIntoView({ behavior: "smooth" });
        }, 1500);
    };

    return (
        <section id="boss" className="relative py-16 md:py-32 px-4 md:px-6 overflow-hidden">
            {/* Deep background */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0015] to-[#030712] pointer-events-none" />

            {/* Radiating glow */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <motion.div
                    className="w-[600px] h-[600px] rounded-full"
                    animate={isInView ? { scale: [0.8, 1.1, 1], opacity: [0, 0.15, 0.1] } : {}}
                    transition={{ duration: 2 }}
                    style={{ background: "radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 70%)" }}
                />
            </div>

            <div ref={ref} className="max-w-4xl mx-auto relative z-10 text-center">

                {/* Mission complete badge */}
                <motion.div
                    className="flex justify-center mb-8"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={isInView ? { opacity: 1, scale: 1 } : {}}
                    transition={{ type: "spring", damping: 15, delay: 0.2 }}
                >
                    <div className="px-6 py-2 rounded-full border border-yellow-400/30 bg-yellow-400/5 flex items-center gap-2">
                        <span className="text-yellow-400">🏆</span>
                        <span className="text-xs font-mono text-yellow-400 tracking-widest uppercase">
                            Mission Complete
                        </span>
                    </div>
                </motion.div>

                {/* Main heading */}
                <motion.h2
                    className="text-3xl md:text-5xl lg:text-7xl font-black leading-none mb-6"
                    initial={{ opacity: 0, y: 40 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.8, delay: 0.3 }}
                >
                    <span className="text-gradient">Vous avez découvert</span>
                    <br />
                    <span className="text-white/90">l&apos;univers de Yoann.</span>
                </motion.h2>

                {/* Tagline */}
                <motion.p
                    className="text-white/50 text-lg max-w-xl mx-auto mb-10 leading-relaxed"
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6, delay: 0.5 }}
                >
                    Systèmes algorithmiques. Intelligence artificielle. Finance quantitative.
                    Le tout construit avec une rigueur mathématique de 14 ans.
                </motion.p>

                {/* Stats summary */}
                <motion.div
                    className="flex flex-wrap items-center justify-center gap-4 mb-12"
                    initial={{ opacity: 0 }}
                    animate={isInView ? { opacity: 1 } : {}}
                    transition={{ delay: 0.7 }}
                >
                    {[
                        { label: "5 projets actifs", icon: "🚀" },
                        { label: "8+ ans d'expérience", icon: "⚡" },
                        { label: "Master MIAGE", icon: "🎓" },
                        { label: "CTO Adjoint", icon: "🏗️" },
                        { label: "14 ans de maths", icon: "∑" },
                    ].map((item) => (
                        <div
                            key={item.label}
                            className="flex items-center gap-2 px-4 py-2 glass rounded-xl border border-white/8 text-sm text-white/60"
                        >
                            <span>{item.icon}</span>
                            <span>{item.label}</span>
                        </div>
                    ))}
                </motion.div>

                {/* THE Button */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={isInView ? { opacity: 1, scale: 1 } : {}}
                    transition={{ type: "spring", damping: 15, delay: 0.9 }}
                >
                    <AnimatePresence mode="wait">
                        {!hired ? (
                            <motion.button
                                key="hire"
                                onClick={handleHire}
                                className="relative group px-12 py-5 rounded-2xl font-black text-xl text-black overflow-hidden"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.97 }}
                                exit={{ scale: 0, opacity: 0 }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-violet-500 to-cyan-400 bg-[length:200%_100%] animate-shimmer" />
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-white/10" />
                                <span className="relative flex items-center gap-3">
                                    🚀 Hire Me
                                    <motion.span
                                        animate={{ x: [0, 5, 0] }}
                                        transition={{ repeat: Infinity, duration: 1 }}
                                    >
                                        →
                                    </motion.span>
                                </span>
                            </motion.button>
                        ) : (
                            <motion.div
                                key="hired"
                                className="text-center"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                            >
                                <div className="text-4xl mb-3">🎉</div>
                                <p className="text-emerald-400 font-bold text-lg">Excellente décision !</p>
                                <p className="text-white/40 text-sm mt-1">Redirection vers le formulaire de contact...</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Final glow line */}
                <motion.div
                    className="mt-16 glow-line"
                    initial={{ scaleX: 0, opacity: 0 }}
                    animate={isInView ? { scaleX: 1, opacity: 1 } : {}}
                    transition={{ duration: 1.2, delay: 1.2 }}
                />
            </div>
        </section>
    );
}
