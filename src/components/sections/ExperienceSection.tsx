"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

// ── Company logos as inline SVG ──────────────────────────────────────────────
function LogoTouton() {
  return (
    <svg viewBox="0 0 120 32" height={22} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Touton wordmark — clean serif-inspired lettering */}
      <rect x="0" y="8" width="4" height="16" rx="2" fill="#d4a853"/>
      <rect x="0" y="8" width="16" height="4" rx="2" fill="#d4a853"/>
      <text x="22" y="24" fontFamily="Georgia, serif" fontSize="18" fontWeight="700" fill="#e8c47a" letterSpacing="2">
        TOUTON
      </text>
    </svg>
  );
}

function LogoCdiscount() {
  return (
    <svg viewBox="0 0 130 32" height={22} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Cdiscount — orange/red brand */}
      <rect x="0" y="4" width="26" height="24" rx="5" fill="#f04e23"/>
      <text x="6" y="22" fontFamily="Arial Black, sans-serif" fontSize="16" fontWeight="900" fill="white">C</text>
      <text x="32" y="24" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="700" fill="#f04e23" letterSpacing="0.5">
        discount
      </text>
    </svg>
  );
}

function LogoCreditAgricole() {
  return (
    <svg viewBox="0 0 160 32" height={22} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Crédit Agricole — iconic green squares logo */}
      <rect x="0" y="2" width="13" height="13" rx="1.5" fill="#009A44"/>
      <rect x="15" y="2" width="13" height="13" rx="1.5" fill="#009A44"/>
      <rect x="0" y="17" width="13" height="13" rx="1.5" fill="#009A44"/>
      <rect x="15" y="17" width="13" height="13" rx="1.5" fill="#009A44" opacity="0.4"/>
      <text x="34" y="24" fontFamily="Arial, sans-serif" fontSize="13" fontWeight="700" fill="#009A44" letterSpacing="0.3">
        Crédit Agricole
      </text>
    </svg>
  );
}

const COMPANY_LOGOS: Record<string, () => React.ReactElement> = {
  "Touton": LogoTouton,
  "Cdiscount": LogoCdiscount,
  "Crédit Agricole": LogoCreditAgricole,
};

const experiences = [
    {
        period: "2024 — Présent",
        role: "Projets R&D — Trading, IA & Algorithmes",
        company: "Projets Personnels",
        type: "Side Projects",
        description:
            "Développement de bots de trading crypto (RSI, Price Action, Binance API, Telegram). Création d'agents IA autonomes avec LLM. Analyse et automatisation de marchés prédictifs Polymarket. Algorithmes de paris sportifs avec value bets et critère de Kelly.",
        tech: ["Python", "Binance API", "LLM", "Polymarket API", "Streamlit", "Telegram Bot"],
        color: "cyan",
        icon: "🚀",
    },
    {
        period: "Jan 2022 — Présent",
        role: "CTO Adjoint / Scrum Master transverse",
        company: "Touton",
        type: "CDI",
        description:
            "Animation et gestion de deux équipes de développement. Pilotage d'un ERP low-code Appian from scratch (équipe de 4). Lead sur les projets RSE (équipe de 2). Choix des solutions technologiques, gestion des partenariats, participation aux COPIL/CODIR. Interlocuteur privilégié entre le métier et les équipes tech.",
        tech: ["Appian", "Node.js", "Scrum", "Architecture", "Leadership", "SQL"],
        color: "violet",
        icon: "🏗️",
    },
    {
        period: "Oct 2018 — Jan 2022",
        role: "Scrum Master",
        company: "Cdiscount",
        type: "CDI",
        description:
            "Animation de l'équipe COFI (3 personnes). MCO de l'ERP GENERIX puis migration vers SAP S4. Responsable d'une application interne NodeJS (surcouche ERP). Audit interne SOX. Astreintes sur les batchs critiques de paiement. Formation et accompagnement des utilisateurs sur SAP.",
        tech: ["SAP S4", "GENERIX", "Node.js", "SQL", "Agile / Scrum", "Audit SOX"],
        color: "blue",
        icon: "⚙️",
    },
    {
        period: "Mai 2017 — Sep 2018",
        role: "Développeur Full-Stack",
        company: "Crédit Agricole",
        type: "CDI",
        description:
            "Développement d'une application interne PHP. Amélioration et optimisation du framework interne. Rédaction de guides utilisateur et technique. Participation aux comités de GO / NO GO. Formation des utilisateurs finaux.",
        tech: ["PHP", "JavaScript", "MySQL", "Framework interne", "Documentation"],
        color: "emerald",
        icon: "💻",
    },
    {
        period: "2011 — 2025",
        role: "Professeur Particulier de Mathématiques",
        company: "Indépendant",
        type: "14 ans · Parallèle",
        description:
            "Enseignement des mathématiques pendant 14 ans en parallèle de ma carrière — de la 3ème jusqu'en 2ème année de licence maths (L2). Plus de 500 heures de cours, méthodes pédagogiques adaptées à chaque profil. Cette pratique intensive a forgé ma capacité à décomposer des problèmes complexes et à les expliquer avec précision.",
        tech: ["Algèbre", "Analyse", "Probabilités", "Géométrie", "Arithmétique", "Pédagogie"],
        color: "yellow",
        icon: "∑",
    },
];

const evolution = [
    { label: "Maths", icon: "∑" },
    { label: "Développeur", icon: "💻" },
    { label: "Lead Tech", icon: "⚡" },
    { label: "CTO Adj.", icon: "🏗️" },
    { label: "IA / Algo", icon: "🧠" },
    { label: "Quant", icon: "📈" },
];

const colorMap: Record<string, { border: string; text: string; bg: string; dot: string }> = {
    cyan: {
        border: "border-cyan-400/30",
        text: "text-cyan-400",
        bg: "bg-cyan-400/10",
        dot: "bg-cyan-400 shadow-cyan-400/50",
    },
    blue: {
        border: "border-blue-400/30",
        text: "text-blue-400",
        bg: "bg-blue-400/10",
        dot: "bg-blue-400 shadow-blue-400/50",
    },
    violet: {
        border: "border-violet-400/30",
        text: "text-violet-400",
        bg: "bg-violet-400/10",
        dot: "bg-violet-400 shadow-violet-400/50",
    },
    emerald: {
        border: "border-emerald-400/30",
        text: "text-emerald-400",
        bg: "bg-emerald-400/10",
        dot: "bg-emerald-400 shadow-emerald-400/50",
    },
    yellow: {
        border: "border-yellow-400/30",
        text: "text-yellow-400",
        bg: "bg-yellow-400/10",
        dot: "bg-yellow-400 shadow-yellow-400/50",
    },
};

export default function ExperienceSection() {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, amount: 0.1 });

    return (
        <section id="experience" className="relative py-32 px-6 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-950/5 to-transparent" />

            <div ref={ref} className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    className="mb-20"
                    initial={{ opacity: 0, y: 40 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.7 }}
                >
                    <div className="flex items-center gap-4 mb-4">
                        <div className="glow-line w-16" />
                        <span className="text-xs font-mono text-cyan-400 tracking-widest uppercase">
                            04 / Experience
                        </span>
                    </div>
                    <h2 className="text-4xl md:text-6xl font-black text-white/90 leading-tight">
                        Une évolution{" "}
                        <span className="text-gradient-static">logique</span>
                    </h2>
                    <p className="mt-4 text-white/40 max-w-2xl">
                        De développeur à architecte de systèmes quantitatifs — chaque étape
                        a construit les fondations de la suivante.
                    </p>
                </motion.div>

                {/* Evolution path */}
                <motion.div
                    className="mb-16 overflow-x-auto"
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6, delay: 0.2 }}
                >
                    <div className="flex items-center gap-0 min-w-max mx-auto justify-center">
                        {evolution.map((step, i) => (
                            <div key={step.label} className="flex items-center">
                                <motion.div
                                    className="flex flex-col items-center gap-2"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                                    transition={{ delay: 0.3 + i * 0.1 }}
                                >
                                    <div className="w-12 h-12 rounded-xl glass border border-white/10 flex items-center justify-center text-xl">
                                        {step.icon}
                                    </div>
                                    <span className="text-xs font-mono text-white/40 whitespace-nowrap">
                                        {step.label}
                                    </span>
                                </motion.div>
                                {i < evolution.length - 1 && (
                                    <motion.div
                                        className="w-12 h-px mx-1"
                                        initial={{ scaleX: 0 }}
                                        animate={isInView ? { scaleX: 1 } : {}}
                                        transition={{ delay: 0.4 + i * 0.1, duration: 0.3 }}
                                        style={{
                                            background: "linear-gradient(90deg, rgba(0,212,255,0.6), rgba(139,92,246,0.6))",
                                        }}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Timeline */}
                <div className="relative">
                    {/* Vertical line */}
                    <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-cyan-400/30 via-violet-400/20 to-transparent hidden md:block" />

                    <div className="space-y-8">
                        {experiences.map((exp, i) => {
                            const colors = colorMap[exp.color];
                            return (
                                <motion.div
                                    key={i}
                                    className="relative md:pl-16"
                                    initial={{ opacity: 0, x: -30 }}
                                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                                    transition={{ duration: 0.6, delay: i * 0.15 }}
                                >
                                    {/* Timeline dot */}
                                    <div
                                        className={`absolute left-4.5 top-6 w-3 h-3 rounded-full ${colors.dot} shadow-lg hidden md:block`}
                                        style={{ left: "18px" }}
                                    />

                                    <div className={`glass rounded-2xl p-6 border ${colors.border} hover:bg-white/[0.03] transition-all duration-300 group`}>
                                        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl">{exp.icon}</span>
                                                <div>
                                                    <h3 className="text-lg font-bold text-white/90">{exp.role}</h3>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        {COMPANY_LOGOS[exp.company] ? (
                                                            <div className="opacity-90 hover:opacity-100 transition-opacity">
                                                                {COMPANY_LOGOS[exp.company]()}
                                                            </div>
                                                        ) : (
                                                            <span className="text-white/50 text-sm">{exp.company}</span>
                                                        )}
                                                        <span className={`text-xs px-2 py-0.5 rounded ${colors.bg} ${colors.text} font-mono`}>
                                                            {exp.type}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <span className={`text-sm font-mono ${colors.text} whitespace-nowrap`}>
                                                {exp.period}
                                            </span>
                                        </div>

                                        <p className="text-white/50 text-sm leading-relaxed mb-4">
                                            {exp.description}
                                        </p>

                                        <div className="flex flex-wrap gap-2">
                                            {exp.tech.map((t) => (
                                                <span
                                                    key={t}
                                                    className="text-xs px-2 py-0.5 rounded bg-white/5 border border-white/8 text-white/40 font-mono"
                                                >
                                                    {t}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                {/* Formation */}
                <motion.div
                    className="mt-20"
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6, delay: 0.8 }}
                >
                    <div className="flex items-center gap-4 mb-8">
                        <div className="glow-line w-12" />
                        <span className="text-xs font-mono text-violet-400 tracking-widest uppercase">
                            Formation
                        </span>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                        {[
                            {
                                degree: "Master 1 & 2 MIAGE",
                                school: "Université de Bordeaux",
                                period: "2016 — 2018",
                                desc: "Méthodes Informatiques Appliquées à la Gestion des Entreprises — Double compétence mathématiques & informatique appliquée.",
                                color: "violet",
                            },
                            {
                                degree: "Licence MIAGE",
                                school: "Université de Bordeaux",
                                period: "2012 — 2015",
                                desc: "Fondamentaux en mathématiques, algorithmique, bases de données et développement logiciel.",
                                color: "blue",
                            },
                        ].map((edu) => (
                            <div
                                key={edu.degree}
                                className={`glass rounded-2xl p-6 border ${edu.color === "violet" ? "border-violet-400/20" : "border-blue-400/20"}`}
                            >
                                <div className="flex items-start justify-between gap-4 mb-3">
                                    <div>
                                        <h3 className={`font-bold text-white/90 ${edu.color === "violet" ? "text-violet-300" : "text-blue-300"}`}>
                                            {edu.degree}
                                        </h3>
                                        <p className="text-white/50 text-sm">{edu.school}</p>
                                    </div>
                                    <span className={`text-xs font-mono whitespace-nowrap ${edu.color === "violet" ? "text-violet-400" : "text-blue-400"}`}>
                                        {edu.period}
                                    </span>
                                </div>
                                <p className="text-white/40 text-sm leading-relaxed">{edu.desc}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
