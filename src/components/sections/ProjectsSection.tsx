"use client";

import { useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";

const projects = [
    {
        id: 1,
        title: "Bot de Trading Crypto",
        subtitle: "Quantitative Trading System",
        description:
            "Système de trading automatique multi-actifs utilisant des stratégies quantitatives avancées (RSI, Price Action, momentum). Intégration complète avec Binance API pour l'exécution d'ordres en temps réel, gestion du risque dynamique avec Stop Loss / Take Profit adaptatifs, alertes Telegram instantanées et dashboard Streamlit pour le monitoring des performances.",
        technologies: ["Python", "Binance API", "Pandas", "NumPy", "Streamlit", "Telegram Bot API", "SQLite", "WebSocket"],
        architecture: ["Data Feed → WebSocket", "Signal Engine → RSI/MA/PA", "Risk Manager → SL/TP", "Order Executor → Binance API", "Alert System → Telegram", "Analytics → Streamlit Dashboard"],
        challenges: ["Latence minimale sur les données de marché", "Gestion des erreurs réseau en temps réel", "Backtesting robuste sur données historiques"],
        results: ["Automatisation complète 24/7", "Multi-assets simultanés", "Dashboard temps réel"],
        color: "cyan",
        gradient: "from-cyan-500/20 to-blue-500/20",
        border: "border-cyan-400/20 hover:border-cyan-400/40",
        tag: "Trading",
        status: "Production",
    },
    {
        id: 2,
        title: "Algorithme Paris Sportifs",
        subtitle: "Sports Betting Prediction Engine",
        description:
            "Moteur de prédiction sophistiqué analysant des statistiques sportives, les cotes des bookmakers et les probabilités implicites pour identifier des value bets. Gestion de bankroll selon le critère de Kelly, automatisation des paris et suivi des performances sur différentes ligues.",
        technologies: ["Python", "Scikit-learn", "BeautifulSoup", "Selenium", "PostgreSQL", "Matplotlib", "Odds API"],
        architecture: ["Scraper → Statistiques & Cotes", "Value Calculator → Prob. implicite", "Kelly Criterion → Sizing", "Bet Tracker → PostgreSQL", "Performance Report → Matplotlib"],
        challenges: ["Modélisation des probabilités réelles vs implicites", "Gestion des changements de cotes", "Détection des value bets fiables"],
        results: ["Détection automatique de value bets", "Gestion de bankroll optimisée", "Reporting performances"],
        color: "violet",
        gradient: "from-violet-500/20 to-purple-500/20",
        border: "border-violet-400/20 hover:border-violet-400/40",
        tag: "ML / Prédiction",
        status: "Active",
    },
    {
        id: 3,
        title: "Polymarket Analyzer",
        subtitle: "Prediction Markets Intelligence",
        description:
            "Système automatisé d'analyse et d'exploitation des marchés prédictifs Polymarket. Extraction temps réel des données de marchés, calcul de probabilités, détection d'opportunités d'arbitrage et d'inefficiences de prix, avec automatisation des positions.",
        technologies: ["Python", "Polymarket API", "Web3.py", "asyncio", "Firebase", "Telegram Bot API", "Pandas"],
        architecture: ["Polymarket API → Market Data", "Probability Engine → Analyse", "Opportunity Detector → Alertes", "Position Manager → Automation", "Firebase → Persistance"],
        challenges: ["Intégration blockchain Polygon", "Analyse en temps réel de centaines de marchés", "Gestion des positions décentralisées"],
        results: ["Surveillance 24/7 de marchés prédictifs", "Alertes opportunités en temps réel", "Automatisation des positions"],
        color: "emerald",
        gradient: "from-emerald-500/20 to-green-500/20",
        border: "border-emerald-400/20 hover:border-emerald-400/40",
        tag: "DeFi / Prediction",
        status: "Active",
    },
    {
        id: 4,
        title: "Agents IA & Automatisation",
        subtitle: "AI Agents & Workflow Automation",
        description:
            "Développement d'agents IA autonomes utilisant des LLM (GPT-4, Claude) pour automatiser des workflows complexes. Création d'assistants spécialisés avec Prompt Engineering avancé, chaînes de raisonnement (Chain of Thought) et orchestration multi-agents.",
        technologies: ["Python", "OpenAI API", "LangChain", "Anthropic", "FastAPI", "Docker", "Celery", "Redis"],
        architecture: ["LLM Router → Model Selection", "Agent Orchestrator → Task Flow", "Memory System → Context", "Tool Executor → External APIs", "Output Formatter → Structured"],
        challenges: ["Gestion du contexte longue durée", "Orchestration de plusieurs agents en parallèle", "Réduction des hallucinations"],
        results: ["Automatisation de workflows complets", "Assistants IA sur mesure", "Réduction du temps manuel"],
        color: "yellow",
        gradient: "from-yellow-500/20 to-orange-500/20",
        border: "border-yellow-400/20 hover:border-yellow-400/40",
        tag: "AI / LLM",
        status: "Active",
    },
    {
        id: 5,
        title: "SQL Engineering & Optimisation",
        subtitle: "Database Performance Engineering",
        description:
            "Optimisation avancée de bases de données Oracle et SQL Server. Réécriture de procédures stockées critiques, optimisation de requêtes complexes, création de rapports automatisés et migration de données entre systèmes hétérogènes.",
        technologies: ["Oracle SQL", "SQL Server", "PL/SQL", "T-SQL", "SSRS", "Python", "ETL", "Power BI"],
        architecture: ["Query Analyzer → Plan d'exécution", "Index Optimizer → Performances", "Stored Procs → Business Logic", "ETL Pipeline → Migration", "SSRS → Reporting automatisé"],
        challenges: ["Optimisation de requêtes sur millions de lignes", "Migration sans interruption de service", "Maintien de la cohérence des données"],
        results: ["Réduction latence requêtes -70%", "Rapports automatisés quotidiens", "Migrations réussies sans downtime"],
        color: "blue",
        gradient: "from-blue-500/20 to-indigo-500/20",
        border: "border-blue-400/20 hover:border-blue-400/40",
        tag: "Database / SQL",
        status: "Production",
    },
];

const colorMap: Record<string, { text: string; dot: string; tag: string }> = {
    cyan: { text: "text-cyan-400", dot: "bg-cyan-400", tag: "bg-cyan-400/10 text-cyan-300 border-cyan-400/20" },
    violet: { text: "text-violet-400", dot: "bg-violet-400", tag: "bg-violet-400/10 text-violet-300 border-violet-400/20" },
    emerald: { text: "text-emerald-400", dot: "bg-emerald-400", tag: "bg-emerald-400/10 text-emerald-300 border-emerald-400/20" },
    yellow: { text: "text-yellow-400", dot: "bg-yellow-400", tag: "bg-yellow-400/10 text-yellow-300 border-yellow-400/20" },
    blue: { text: "text-blue-400", dot: "bg-blue-400", tag: "bg-blue-400/10 text-blue-300 border-blue-400/20" },
};

export default function ProjectsSection() {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, amount: 0.05 });
    const [selected, setSelected] = useState<number | null>(null);

    return (
        <section id="projects" className="relative py-32 px-6 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-950/5 to-transparent" />

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
                            03 / Projects
                        </span>
                    </div>
                    <h2 className="text-4xl md:text-6xl font-black text-white/90 leading-tight">
                        Ce que j&apos;ai{" "}
                        <span className="text-gradient-static">construit</span>
                    </h2>
                    <p className="mt-4 text-white/40 max-w-2xl">
                        Chaque projet est une solution à un problème réel — des systèmes
                        qui tournent en production, pas des side projects abandonnés.
                    </p>
                </motion.div>

                {/* Projects Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map((project, i) => {
                        const colors = colorMap[project.color];
                        const isActive = selected === project.id;
                        return (
                            <motion.div
                                key={project.id}
                                className={`glass rounded-2xl border overflow-hidden cursor-pointer transition-all duration-300 ${project.border} group`}
                                initial={{ opacity: 0, y: 50 }}
                                animate={isInView ? { opacity: 1, y: 0 } : {}}
                                transition={{ duration: 0.5, delay: i * 0.1 }}
                                whileHover={{ y: -6 }}
                                onClick={() => setSelected(isActive ? null : project.id)}
                            >
                                {/* Top gradient band */}
                                <div className={`h-1 w-full bg-gradient-to-r ${project.gradient}`} />

                                <div className="p-6">
                                    {/* Header */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`text-xs font-mono px-2 py-0.5 rounded border ${colors.tag}`}>
                                                    {project.tag}
                                                </span>
                                                <span className="text-xs text-white/30 font-mono">
                                                    {project.status}
                                                </span>
                                            </div>
                                            <h3 className="text-lg font-bold text-white/90 mt-2">
                                                {project.title}
                                            </h3>
                                            <p className={`text-xs font-mono ${colors.text} mt-0.5`}>
                                                {project.subtitle}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <p className="text-white/50 text-sm leading-relaxed line-clamp-3">
                                        {project.description}
                                    </p>

                                    {/* Technologies */}
                                    <div className="mt-4 flex flex-wrap gap-1.5">
                                        {project.technologies.slice(0, 4).map((tech) => (
                                            <span
                                                key={tech}
                                                className="text-xs px-2 py-0.5 rounded bg-white/5 border border-white/8 text-white/40 font-mono"
                                            >
                                                {tech}
                                            </span>
                                        ))}
                                        {project.technologies.length > 4 && (
                                            <span className="text-xs px-2 py-0.5 rounded bg-white/5 border border-white/8 text-white/30 font-mono">
                                                +{project.technologies.length - 4}
                                            </span>
                                        )}
                                    </div>

                                    {/* Expand button */}
                                    <div className={`mt-4 text-xs font-mono transition-colors ${colors.text} flex items-center gap-1`}>
                                        <span>{isActive ? "Réduire" : "Voir l'architecture"}</span>
                                        <motion.span
                                            animate={{ rotate: isActive ? 180 : 0 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            ↓
                                        </motion.span>
                                    </div>

                                    {/* Expanded content */}
                                    <AnimatePresence>
                                        {isActive && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.3 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="pt-4 border-t border-white/5 mt-4 space-y-4">
                                                    {/* Architecture */}
                                                    <div>
                                                        <h4 className={`text-xs font-mono uppercase tracking-wider ${colors.text} mb-2`}>
                                                            Architecture
                                                        </h4>
                                                        <div className="space-y-1">
                                                            {project.architecture.map((step, si) => (
                                                                <div key={si} className="flex items-center gap-2 text-xs text-white/40 font-mono">
                                                                    <div className={`w-1.5 h-1.5 rounded-full ${colors.dot} flex-shrink-0`} />
                                                                    {step}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Results */}
                                                    <div>
                                                        <h4 className={`text-xs font-mono uppercase tracking-wider ${colors.text} mb-2`}>
                                                            Résultats
                                                        </h4>
                                                        <div className="space-y-1">
                                                            {project.results.map((result, ri) => (
                                                                <div key={ri} className="text-xs text-white/50 flex items-center gap-2">
                                                                    <span className="text-emerald-400">✓</span>
                                                                    {result}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* All technologies */}
                                                    <div>
                                                        <h4 className={`text-xs font-mono uppercase tracking-wider ${colors.text} mb-2`}>
                                                            Stack complète
                                                        </h4>
                                                        <div className="flex flex-wrap gap-1">
                                                            {project.technologies.map((tech) => (
                                                                <span
                                                                    key={tech}
                                                                    className="text-xs px-2 py-0.5 rounded bg-white/5 border border-white/8 text-white/50 font-mono"
                                                                >
                                                                    {tech}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
