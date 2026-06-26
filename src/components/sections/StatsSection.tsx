"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useInView, useMotionValue, useSpring } from "framer-motion";

const STATS = [
    { value: 50000, suffix: "+", label: "Lignes de code", sublabel: "production" },
    { value: 1200, suffix: "+", label: "Heures de maths", sublabel: "14 ans d'enseignement" },
    { value: 8, suffix: "+", label: "Ans d'expérience", sublabel: "dev → CTO → quant" },
    { value: 500, suffix: "+", label: "Stratégies testées", sublabel: "trading & prédiction" },
    { value: 5, suffix: "", label: "Bots déployés", sublabel: "24/7 en production" },
    { value: 20, suffix: "+", label: "Technologies maîtrisées", sublabel: "full-stack + AI + data" },
    { value: 200, suffix: "+", label: "Notebooks Python", sublabel: "analyse & machine learning" },
    { value: 100, suffix: "+", label: "Procédures SQL", sublabel: "Oracle & SQL Server" },
];

function Counter({ target, suffix, active }: { target: number; suffix: string; active: boolean }) {
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (!active) return;
        const duration = 1800;
        const steps = 60;
        const stepTime = duration / steps;
        let current = 0;

        const timer = setInterval(() => {
            current += 1;
            const progress = current / steps;
            const ease = 1 - Math.pow(1 - progress, 4);
            setCount(Math.floor(ease * target));
            if (current >= steps) {
                clearInterval(timer);
                setCount(target);
            }
        }, stepTime);

        return () => clearInterval(timer);
    }, [target, active]);

    return (
        <span>
            {count.toLocaleString("fr-FR")}
            {suffix}
        </span>
    );
}

export default function StatsSection() {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, amount: 0.2 });

    return (
        <section id="stats" className="relative py-12 md:py-24 px-4 md:px-6 overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-950/10 to-transparent pointer-events-none" />

            {/* Horizontal glow line top */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent" />

            <div ref={ref} className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    className="text-center mb-14"
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                >
                    <div className="flex items-center justify-center gap-4 mb-3">
                        <div className="glow-line w-12" />
                        <span className="text-xs font-mono text-cyan-400 tracking-widest uppercase">
                            Metrics
                        </span>
                        <div className="glow-line w-12" />
                    </div>
                    <p className="text-white/30 font-mono text-sm">
                        system.stats — live compilation
                    </p>
                </motion.div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {STATS.map((stat, i) => (
                        <motion.div
                            key={stat.label}
                            className="glass rounded-2xl p-5 border border-white/5 hover:border-cyan-400/20 transition-all duration-300 group relative overflow-hidden"
                            initial={{ opacity: 0, y: 40 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.5, delay: i * 0.07 }}
                            whileHover={{ y: -4, scale: 1.02 }}
                        >
                            {/* Hover glow */}
                            <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/0 to-violet-400/0 group-hover:from-cyan-400/5 group-hover:to-violet-400/5 transition-all duration-500 rounded-2xl" />

                            <div className="relative">
                                <div className="text-3xl font-black text-gradient-static tabular-nums mb-1">
                                    <Counter target={stat.value} suffix={stat.suffix} active={isInView} />
                                </div>
                                <div className="text-white/80 text-sm font-semibold">{stat.label}</div>
                                <div className="text-white/30 text-xs font-mono mt-0.5">{stat.sublabel}</div>

                                {/* Progress bar decoration */}
                                <div className="mt-3 h-0.5 bg-white/5 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-cyan-400 to-violet-400 rounded-full"
                                        initial={{ width: 0 }}
                                        animate={isInView ? { width: `${Math.min(100, (stat.value / Math.max(...STATS.map((s) => s.value))) * 100)}%` } : {}}
                                        transition={{ duration: 1.4, delay: 0.2 + i * 0.07, ease: "easeOut" }}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Bottom separator */}
                <motion.div
                    className="mt-12 text-center"
                    initial={{ opacity: 0 }}
                    animate={isInView ? { opacity: 1 } : {}}
                    transition={{ delay: 0.8 }}
                >
                    <span className="text-white/20 font-mono text-xs">
                        — stats compilées depuis 2016 —
                    </span>
                </motion.div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-400/20 to-transparent" />
        </section>
    );
}
