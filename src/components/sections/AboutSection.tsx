"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

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
    const isInView = useInView(ref, { once: true, amount: 0.2 });

    return (
        <section id="about" className="relative py-32 px-6 overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-950/5 to-transparent" />
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-px h-2/3 bg-gradient-to-b from-transparent via-cyan-400/20 to-transparent" />

            <div ref={ref} className="max-w-7xl mx-auto">
                {/* Section header */}
                <motion.div
                    className="mb-20"
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

                <div className="grid lg:grid-cols-2 gap-16 items-start">
                    {/* Story Text */}
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
                            (Méthodes Informatiques Appliquées à la Gestion des Entreprises)
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
                            bots de trading qui lisent les marchés en temps réel,
                            agents IA qui orchestrent des workflows complexes,
                            algorithmes qui transforment la probabilité en décision.
                            Chaque ligne de code est une{" "}
                            <span className="text-yellow-400 font-medium">démonstration mathématique</span>{" "}
                            appliquée au monde réel.
                        </p>

                        {/* Code snippet décoration */}
                        <div className="glass rounded-xl p-4 font-mono text-sm border border-white/5 mt-8">
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

                    {/* Story Cards + Stats */}
                    <div className="space-y-6">
                        {/* Story items */}
                        <div className="grid grid-cols-2 gap-4">
                            {storyItems.map((item, i) => (
                                <motion.div
                                    key={item.label}
                                    className="glass rounded-xl p-5 border border-white/5 glass-hover group cursor-default"
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                                    transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
                                    whileHover={{ y: -4 }}
                                >
                                    <div className="text-2xl mb-3">{item.icon}</div>
                                    <div className="font-semibold text-white/90 text-sm mb-1">
                                        {item.label}
                                    </div>
                                    <div className="text-white/40 text-xs leading-relaxed">
                                        {item.desc}
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Stats */}
                        <motion.div
                            className="grid grid-cols-4 gap-3"
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
