"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Image from "next/image";

const storyItems = [
    {
        icon: "∑",
        label: "Mathématiques",
        desc: "14 ans de cours particuliers — de la 3ème à la L2. Les maths sont l'ADN de tout ce que je construis.",
    },
    {
        icon: "⚡",
        label: "Algorithmique",
        desc: "De la théorie mathématique à l'implémentation — conception d'algorithmes de trading, prédiction et optimisation.",
    },
    {
        icon: "🧠",
        label: "Intelligence Artificielle",
        desc: "Agents IA, LLM, automatisation de workflows complexes avec des modèles de langage avancés.",
    },
    {
        icon: "📈",
        label: "Finance Quantitative",
        desc: "Modèles probabilistes, value bets, stratégies RSI/Price Action sur marchés crypto et prédictifs.",
    },
];

const stats = [
    { value: "8+", label: "ans d'expérience" },
    { value: "14", label: "ans de cours de maths" },
    { value: "Bac+5", label: "Master MIAGE" },
    { value: "∞", label: "problèmes résolus" },
];

export default function AboutSection() {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, amount: 0.15 });

    return (
        <section id="about" className="relative py-32 px-6 overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-950/5 to-transparent" />
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-px h-2/3 bg-gradient-to-b from-transparent via-cyan-400/20 to-transparent" />

            <div ref={ref} className="max-w-7xl mx-auto">
                {/* Section header */}
                <motion.div
                    className="mb-16"
                    initial={{ opacity: 0, y: 40 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.7 }}
                >
                    <div className="flex items-center gap-4 mb-4">
                        <div className="glow-line w-16" />
                        <span className="text-xs font-mono text-cyan-400 tracking-widest uppercase">
                            01 / About
                        </span>
                    </div>
                    <h2 className="text-4xl md:text-6xl font-black text-white/90 leading-tight">
                        Les maths m&apos;ont appris{" "}
                        <span className="text-gradient-static">à penser.</span>
                        <br />
                        Le code m&apos;a appris à construire.
                    </h2>
                </motion.div>

                {/* 3-col layout: text | photo | cards */}
                <div className="grid lg:grid-cols-[1fr_auto_1fr] gap-12 items-start">

                    {/* ── Col 1 : Story Text ── */}
                    <motion.div
                        className="space-y-6"
                        initial={{ opacity: 0, x: -40 }}
                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 0.7, delay: 0.2 }}
                    >
                        <p className="text-white/60 text-lg leading-relaxed">
                            Tout a commencé par une passion profonde pour les{" "}
                            <span className="text-cyan-400 font-medium">mathématiques</span> —
                            une discipline qui enseigne avant tout une façon de penser.
                            De 2011 à 2025, j&apos;ai transmis cette passion en donnant
                            des cours particuliers, de la 3ème jusqu&apos;en L2 maths.
                            Quatorze ans à décomposer des concepts abstraits pour les rendre
                            accessibles : la meilleure école d&apos;ingénierie logicielle qui soit.
                        </p>
                        <p className="text-white/60 text-lg leading-relaxed">
                            Titulaire d&apos;un{" "}
                            <span className="text-violet-400 font-medium">Master MIAGE</span>{" "}
                            à l&apos;Université de Bordeaux, ma formation est à l&apos;intersection
                            exacte des maths, de l&apos;informatique et de la modélisation.
                            Après avoir évolué de développeur à CTO Adjoint, j&apos;ai
                            naturellement orienté mon expertise vers{" "}
                            <span className="text-emerald-400 font-medium">l&apos;algorithmique,
                                l&apos;IA et le trading quantitatif</span> — des domaines où
                            la rigueur mathématique fait toute la différence.
                        </p>
                        <p className="text-white/60 text-lg leading-relaxed">
                            Aujourd&apos;hui, je conçois des systèmes qui pensent :
                            bots de trading, agents IA, algorithmes qui transforment la{" "}
                            <span className="text-yellow-400 font-medium">probabilité en décision.</span>
                        </p>

                        {/* Code snippet */}
                        <div className="glass rounded-xl p-4 font-mono text-sm border border-white/5">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                                <div className="w-3 h-3 rounded-full bg-green-500/60" />
                                <span className="ml-2 text-white/20 text-xs">profile.py</span>
                            </div>
                            <div className="space-y-1">
                                <div>
                                    <span className="text-violet-400">class </span>
                                    <span className="text-cyan-400">YoannBeugre</span>
                                    <span className="text-white/60">:</span>
                                </div>
                                <div className="pl-4">
                                    <span className="text-violet-400">def </span>
                                    <span className="text-yellow-400">__init__</span>
                                    <span className="text-white/60">(self):</span>
                                </div>
                                <div className="pl-8 text-white/40">
                                    self.education = <span className="text-yellow-400">&quot;Master MIAGE — Bordeaux&quot;</span>
                                </div>
                                <div className="pl-8 text-white/40">
                                    self.teaching = <span className="text-emerald-400">&quot;Maths 3ème → L2 (2011-2025)&quot;</span>
                                </div>
                                <div className="pl-8 text-white/40">
                                    self.focus = [<span className="text-cyan-400">&quot;quant&quot;</span>,{" "}
                                    <span className="text-cyan-400">&quot;AI&quot;</span>,{" "}
                                    <span className="text-cyan-400">&quot;algorithms&quot;</span>]
                                </div>
                                <div className="pl-8 text-white/40">
                                    self.status = <span className="text-violet-400">&quot;building intelligent systems&quot;</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* ── Col 2 : Photo ── */}
                    <motion.div
                        className="flex flex-col items-center gap-4"
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={isInView ? { opacity: 1, scale: 1 } : {}}
                        transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    >
                        {/* Photo container */}
                        <div className="relative group">
                            {/* Animated glow ring */}
                            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-cyan-400 via-violet-500 to-cyan-400 opacity-60 blur-sm animate-border-glow" />

                            {/* Scan line overlay */}
                            <div
                                className="absolute inset-0 rounded-2xl pointer-events-none z-10 overflow-hidden"
                                style={{
                                    background: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,212,255,0.03) 3px, rgba(0,212,255,0.03) 4px)",
                                }}
                            />

                            {/* Corner decorations */}
                            <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-cyan-400 z-20 rounded-tl" />
                            <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-cyan-400 z-20 rounded-tr" />
                            <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-violet-400 z-20 rounded-bl" />
                            <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-violet-400 z-20 rounded-br" />

                            {/* Glitch effect on hover */}
                            <motion.div
                                className="relative rounded-2xl overflow-hidden"
                                style={{ width: 260, height: 340 }}
                                whileHover={{ scale: 1.02 }}
                                transition={{ duration: 0.3 }}
                            >
                                <Image
                                    src="/yoann.jpg"
                                    alt="Yoann Beugré"
                                    fill
                                    className="object-cover object-top transition-all duration-500 group-hover:scale-105"
                                    style={{ filter: "contrast(1.05) saturate(0.9)" }}
                                    priority
                                />
                                {/* Color overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-[#030712]/80 via-transparent to-transparent" />
                                {/* Holographic sheen on hover */}
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-cyan-400/10 via-transparent to-violet-400/10" />
                            </motion.div>
                        </div>

                        {/* Name badge below photo */}
                        <div className="glass rounded-xl px-5 py-3 border border-white/10 text-center">
                            <div className="text-white/90 font-bold text-sm">Yoann Beugré</div>
                            <div className="text-cyan-400 text-xs font-mono mt-0.5">CTO Adj. · Algo · AI · Quant</div>
                        </div>
                    </motion.div>

                    {/* ── Col 3 : Cards + Stats ── */}
                    <div className="space-y-5">
                        <div className="grid grid-cols-2 gap-3">
                            {storyItems.map((item, i) => (
                                <motion.div
                                    key={item.label}
                                    className="glass rounded-xl p-4 border border-white/5 glass-hover group cursor-default"
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                                    transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
                                    whileHover={{ y: -4 }}
                                >
                                    <div className="text-xl mb-2">{item.icon}</div>
                                    <div className="font-semibold text-white/90 text-xs mb-1">
                                        {item.label}
                                    </div>
                                    <div className="text-white/40 text-[11px] leading-relaxed">
                                        {item.desc}
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Stats */}
                        <motion.div
                            className="grid grid-cols-2 gap-3"
                            initial={{ opacity: 0, y: 20 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.5, delay: 0.7 }}
                        >
                            {stats.map((stat) => (
                                <div
                                    key={stat.label}
                                    className="glass rounded-xl p-4 text-center border border-white/5"
                                >
                                    <div className="text-2xl font-black text-gradient-static mb-1">
                                        {stat.value}
                                    </div>
                                    <div className="text-white/40 text-[10px] leading-tight">
                                        {stat.label}
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    </div>
                </div>
            </div>
        </section>
    );
}
