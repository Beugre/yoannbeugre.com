"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const categories = [
    {
        name: "Languages",
        color: "cyan",
        items: ["Python", "JavaScript", "TypeScript", "Java", "C#", "PHP", "SQL"],
    },
    {
        name: "Frontend & Framework",
        color: "violet",
        items: ["React", "Next.js", "Node.js", "Tailwind CSS"],
    },
    {
        name: "Data & AI",
        color: "emerald",
        items: ["Machine Learning", "Deep Learning", "LLM", "Prompt Engineering", "Data Analysis"],
    },
    {
        name: "Trading & Finance",
        color: "yellow",
        items: ["Quantitative Trading", "Binance API", "Polymarket API", "Algorithm Design", "Risk Management"],
    },
    {
        name: "Infrastructure & Data",
        color: "blue",
        items: ["Docker", "Linux", "PostgreSQL", "Oracle", "Firebase", "REST API", "WebSocket"],
    },
    {
        name: "Automation",
        color: "pink",
        items: ["Automation", "Telegram API", "Streamlit", "GitHub Actions"],
    },
];

const colorMap: Record<string, string> = {
    cyan: "border-cyan-400/20 bg-cyan-400/5 text-cyan-300 hover:bg-cyan-400/15 hover:border-cyan-400/40",
    violet: "border-violet-400/20 bg-violet-400/5 text-violet-300 hover:bg-violet-400/15 hover:border-violet-400/40",
    emerald: "border-emerald-400/20 bg-emerald-400/5 text-emerald-300 hover:bg-emerald-400/15 hover:border-emerald-400/40",
    yellow: "border-yellow-400/20 bg-yellow-400/5 text-yellow-300 hover:bg-yellow-400/15 hover:border-yellow-400/40",
    blue: "border-blue-400/20 bg-blue-400/5 text-blue-300 hover:bg-blue-400/15 hover:border-blue-400/40",
    pink: "border-pink-400/20 bg-pink-400/5 text-pink-300 hover:bg-pink-400/15 hover:border-pink-400/40",
};

const headerColorMap: Record<string, string> = {
    cyan: "text-cyan-400",
    violet: "text-violet-400",
    emerald: "text-emerald-400",
    yellow: "text-yellow-400",
    blue: "text-blue-400",
    pink: "text-pink-400",
};

export default function ExpertiseSection() {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, amount: 0.1 });

    return (
        <section id="expertise" className="relative py-32 px-6 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-950/5 to-transparent" />

            <div ref={ref} className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    className="mb-20 text-center"
                    initial={{ opacity: 0, y: 40 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.7 }}
                >
                    <div className="flex items-center justify-center gap-4 mb-4">
                        <div className="glow-line w-16" />
                        <span className="text-xs font-mono text-cyan-400 tracking-widest uppercase">
                            02 / Expertise
                        </span>
                        <div className="glow-line w-16" />
                    </div>
                    <h2 className="text-4xl md:text-6xl font-black text-white/90 leading-tight mb-4">
                        Stack technique
                    </h2>
                    <p className="text-white/40 max-w-xl mx-auto">
                        Un arsenal technologique soigneusement construit autour de la
                        performance, de la scalabilité et de l&apos;intelligence.
                    </p>
                </motion.div>

                {/* Categories Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categories.map((cat, ci) => (
                        <motion.div
                            key={cat.name}
                            className="glass rounded-2xl p-6 border border-white/5 hover:border-white/10 transition-all duration-300 group"
                            initial={{ opacity: 0, y: 40 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.5, delay: ci * 0.08 }}
                            whileHover={{ y: -4, boxShadow: "0 20px 40px rgba(0,0,0,0.3)" }}
                        >
                            <h3 className={`text-xs font-mono tracking-widest uppercase mb-4 ${headerColorMap[cat.color]}`}>
                                {cat.name}
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {cat.items.map((item, ii) => (
                                    <motion.span
                                        key={item}
                                        className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-all duration-200 cursor-default ${colorMap[cat.color]}`}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={isInView ? { opacity: 1, scale: 1 } : {}}
                                        transition={{ duration: 0.3, delay: ci * 0.08 + ii * 0.04 }}
                                        whileHover={{ scale: 1.08 }}
                                    >
                                        {item}
                                    </motion.span>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Bottom highlight */}
                <motion.div
                    className="mt-16 glass rounded-2xl p-8 border border-cyan-400/10 text-center"
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.6 }}
                >
                    <p className="text-white/50 text-sm font-mono">
                        <span className="text-cyan-400">const</span>{" "}
                        <span className="text-white/80">philosophy</span>{" "}
                        <span className="text-white/50">= </span>
                        <span className="text-emerald-400">
                            &quot;The right tool for the right problem, always.&quot;
                        </span>
                    </p>
                </motion.div>
            </div>
        </section>
    );
}
