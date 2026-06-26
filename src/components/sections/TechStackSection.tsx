"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const techStack = [
    // Languages
    { name: "Python", icon: "🐍", color: "#3b82f6", level: 95 },
    { name: "TypeScript", icon: "TS", color: "#3178c6", level: 88 },
    { name: "JavaScript", icon: "JS", color: "#f7df1e", level: 90 },
    { name: "Java", icon: "☕", color: "#f89820", level: 80 },
    { name: "SQL", icon: "🗄️", color: "#336791", level: 92 },
    { name: "C#", icon: "C#", color: "#9b4f96", level: 75 },
    { name: "PHP", icon: "🐘", color: "#777bb4", level: 70 },
    // Frameworks
    { name: "React", icon: "⚛️", color: "#61dafb", level: 88 },
    { name: "Next.js", icon: "▲", color: "#ffffff", level: 85 },
    { name: "Node.js", icon: "🟢", color: "#339933", level: 82 },
    // Data / AI
    { name: "ML/Deep Learning", icon: "🧠", color: "#ff6b6b", level: 80 },
    { name: "LLM / Agents", icon: "🤖", color: "#8b5cf6", level: 85 },
    { name: "Pandas / NumPy", icon: "📊", color: "#150458", level: 90 },
    // Infra
    { name: "Docker", icon: "🐳", color: "#2496ed", level: 78 },
    { name: "PostgreSQL", icon: "🐘", color: "#336791", level: 88 },
    { name: "Firebase", icon: "🔥", color: "#ffca28", level: 80 },
    { name: "Linux", icon: "🐧", color: "#fcc624", level: 80 },
    // Trading
    { name: "Binance API", icon: "₿", color: "#f0b90b", level: 92 },
    { name: "Polymarket API", icon: "📈", color: "#10b981", level: 85 },
    { name: "WebSocket", icon: "⚡", color: "#00d4ff", level: 87 },
];

export default function TechStackSection() {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, amount: 0.1 });

    return (
        <section id="techstack" className="relative py-32 px-6 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-950/5 to-transparent pointer-events-none" />

            <div ref={ref} className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    className="mb-16 text-center"
                    initial={{ opacity: 0, y: 40 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.7 }}
                >
                    <div className="flex items-center justify-center gap-4 mb-4">
                        <div className="glow-line w-16" />
                        <span className="text-xs font-mono text-cyan-400 tracking-widest uppercase">
                            06 / Tech Stack
                        </span>
                        <div className="glow-line w-16" />
                    </div>
                    <h2 className="text-4xl md:text-6xl font-black text-white/90 leading-tight">
                        L&apos;arsenal technique
                    </h2>
                </motion.div>

                {/* Tech cards masonry */}
                <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
                    {techStack.map((tech, i) => (
                        <motion.div
                            key={tech.name}
                            className="break-inside-avoid glass rounded-xl p-4 border border-white/5 hover:border-white/15 transition-all duration-300 group cursor-default mb-4"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={isInView ? { opacity: 1, scale: 1 } : {}}
                            transition={{ duration: 0.4, delay: i * 0.04 }}
                            whileHover={{ scale: 1.03, y: -3 }}
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <div
                                    className="w-9 h-9 rounded-lg flex items-center justify-center text-lg font-bold"
                                    style={{ backgroundColor: `${tech.color}18`, border: `1px solid ${tech.color}30` }}
                                >
                                    {tech.icon.length > 2 ? (
                                        <span className="text-xs font-mono font-bold" style={{ color: tech.color }}>
                                            {tech.icon}
                                        </span>
                                    ) : (
                                        tech.icon
                                    )}
                                </div>
                                <span className="text-sm font-medium text-white/80 group-hover:text-white/95 transition-colors">
                                    {tech.name}
                                </span>
                            </div>

                            {/* Progress bar */}
                            <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                                <motion.div
                                    className="h-full rounded-full"
                                    style={{ backgroundColor: tech.color }}
                                    initial={{ width: 0 }}
                                    animate={isInView ? { width: `${tech.level}%` } : {}}
                                    transition={{ duration: 0.8, delay: 0.2 + i * 0.03, ease: "easeOut" }}
                                />
                            </div>
                            <div className="flex justify-between mt-1">
                                <span className="text-[9px] font-mono text-white/20">proficiency</span>
                                <span className="text-[9px] font-mono" style={{ color: `${tech.color}88` }}>
                                    {tech.level}%
                                </span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
