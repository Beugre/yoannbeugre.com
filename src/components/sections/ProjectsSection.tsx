"use client";

import { useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { unlockAchievement } from "@/lib/achievements";

interface Project {
    id: string; title: string; subtitle: string; tag: string; status: string;
    color: string; border: string; gradient: string;
    description: string; tech: string[]; architecture: string[];
    challenges: string[]; results: string[]; difficulty: number;
    code: { file: string; lang: string; snippet: string }[];
}

const PROJECTS: Project[] = [
    {
        id: "trading",
        title: "Quant Trading Engine",
        subtitle: "Crypto Algorithmic Trading Bot",
        tag: "Trading", status: "Production",
        color: "#f0b90b", border: "border-yellow-400/20 hover:border-yellow-400/40",
        gradient: "from-yellow-500/20 to-orange-500/10",
        description: "Système de trading automatique multi-actifs sur Binance. Stratégies quantitatives RSI + Price Action avec gestion adaptative du risque. Dashboard Streamlit pour monitoring temps réel. Alertes Telegram instantanées.",
        tech: ["Python", "Binance API", "WebSocket", "Pandas", "NumPy", "Streamlit", "Telegram Bot API", "SQLite"],
        architecture: ["WebSocket → Binance Feed", "Signal Engine (RSI/PA/Momentum)", "Risk Manager (SL/TP adaptatif)", "Order Executor", "Alert System → Telegram", "Analytics → Streamlit"],
        challenges: ["Latence sub-seconde sur données de marché", "Gestion déconnexions WebSocket en production", "Slippage et market impact", "Backtesting robuste sans look-ahead bias"],
        results: ["Bot 24/7 multi-assets simultanés", "Dashboard performances temps réel", "Système d'alertes Telegram instantanées", "Risk management automatisé"],
        difficulty: 5,
        code: [
            {
                file: "signal_engine.py", lang: "python", snippet: `def compute_rsi(prices, period=14):
    deltas = np.diff(prices)
    gain = np.where(deltas > 0, deltas, 0)
    loss = np.where(deltas < 0, -deltas, 0)
    avg_gain = np.convolve(gain, np.ones(period)/period, 'valid')
    avg_loss = np.convolve(loss, np.ones(period)/period, 'valid')
    rs = avg_gain / (avg_loss + 1e-10)
    return 100 - (100 / (1 + rs))` },
            {
                file: "risk_manager.py", lang: "python", snippet: `def compute_position_size(capital, risk_pct, entry, stop_loss):
    risk_amount = capital * (risk_pct / 100)
    pip_distance = abs(entry - stop_loss)
    return round(risk_amount / pip_distance, 6)` },
        ]
    },
    {
        id: "betting",
        title: "Sports Betting Engine",
        subtitle: "Algorithmic Value Bet Detector",
        tag: "ML / Prédiction", status: "Active",
        color: "#8b5cf6", border: "border-violet-400/20 hover:border-violet-400/40",
        gradient: "from-violet-500/20 to-purple-500/10",
        description: "Moteur de prédiction analysant statistiques sportives et cotes bookmakers pour détecter des value bets. Sizing optimal via critère de Kelly. Pipeline ML d'estimation des probabilités réelles vs implicites.",
        tech: ["Python", "Scikit-learn", "BeautifulSoup", "PostgreSQL", "Matplotlib", "Odds API", "Kelly Criterion"],
        architecture: ["Scraper → Stats + Cotes", "Feature Engineering", "Probability Model (ML)", "Value Calculator (Edge)", "Kelly Criterion (Sizing)", "Performance Tracker → DB"],
        challenges: ["Modélisation des probabilités réelles vs implicites", "Gestion du drift de cotes en temps réel", "Validation out-of-sample rigoureuse", "Éviter le surapprentissage"],
        results: ["Détection automatique value bets", "Gestion bankroll optimisée (Kelly)", "Pipeline ML de prédiction", "Reporting performance hebdomadaire"],
        difficulty: 4,
        code: [
            {
                file: "value_bet.py", lang: "python", snippet: `def kelly_fraction(p_real, odds_decimal):
    """Fraction de Kelly pour mise optimale"""
    b = odds_decimal - 1  # profit par unité risquée
    q = 1 - p_real
    kelly = (b * p_real - q) / b
    return max(0, min(kelly, 0.25))  # Cap à 25% du capital` },
        ]
    },
    {
        id: "polymarket",
        title: "Polymarket Analyzer",
        subtitle: "Prediction Markets Intelligence System",
        tag: "DeFi / Prédiction", status: "Active",
        color: "#10b981", border: "border-emerald-400/20 hover:border-emerald-400/40",
        gradient: "from-emerald-500/20 to-green-500/10",
        description: "Système automatisé d'analyse des marchés prédictifs Polymarket sur Polygon. Extraction temps réel, calcul probabilités implicites vs réelles, détection d'inefficiences. Alertes automatiques sur opportunités.",
        tech: ["Python", "Polymarket API", "Web3.py", "asyncio", "Firebase", "Telegram Bot API"],
        architecture: ["Polymarket API → Marchés", "Probability Engine (Bayesian)", "Opportunity Detector (Edge > 10%)", "Position Manager", "Firebase → Persistance", "Telegram → Alertes"],
        challenges: ["Intégration blockchain Polygon / USDC", "Calcul probabilités Bayésiennes en temps réel", "Gestion liquidité décentralisée", "Analyse de centaines de marchés simultanément"],
        results: ["Surveillance 24/7 marchés prédictifs", "Alertes value bets en temps réel", "Position management automatisé", "Dashboard performances blockchain"],
        difficulty: 5,
        code: [
            {
                file: "analyzer.py", lang: "python", snippet: `async def detect_opportunities(markets, threshold=0.08):
    ops = []
    for mkt in markets:
        prob_real = await estimate_real_probability(mkt)
        prob_impl = mkt['outcomePrices'][0]  # USDC price ≈ probability
        edge = prob_real - prob_impl
        if abs(edge) > threshold:
            ops.append({
                'market': mkt['question'],
                'edge': edge,
                'kelly': kelly_fraction(prob_real, 1/prob_impl)
            })
    return sorted(ops, key=lambda x: abs(x['edge']), reverse=True)` },
        ]
    },
    {
        id: "ai",
        title: "AI Agents & Automation",
        subtitle: "Autonomous LLM Workflow System",
        tag: "AI / LLM", status: "Active",
        color: "#f59e0b", border: "border-yellow-400/20 hover:border-yellow-400/40",
        gradient: "from-yellow-500/20 to-amber-500/10",
        description: "Développement d'agents IA autonomes utilisant LangChain + OpenAI. Orchestration de workflows complexes, chaînes de raisonnement, mémoire persistante. Prompt Engineering avancé pour comportements fiables.",
        tech: ["Python", "LangChain", "OpenAI API", "Anthropic", "FastAPI", "Redis", "Docker", "Celery"],
        architecture: ["LLM Router (model selection)", "Agent Orchestrator (task decomposition)", "Tool Registry (APIs/DB/Web)", "Memory System (Redis)", "Output Formatter", "Celery Queue (async tasks)"],
        challenges: ["Gestion contexte longue durée (> 100k tokens)", "Agents parallèles sans race conditions", "Réduction des hallucinations par grounding", "Latence acceptable pour production"],
        results: ["Agents autonomes multi-tools", "Workflows automatisés bout en bout", "RAG system pour knowledge base", "API REST pour intégration externe"],
        difficulty: 4,
        code: [
            {
                file: "agent.py", lang: "python", snippet: `from langchain.agents import AgentExecutor, create_openai_tools_agent

def build_quant_agent(tools, memory):
    prompt = ChatPromptTemplate.from_messages([
        ("system", QUANT_SYSTEM_PROMPT),
        MessagesPlaceholder("chat_history"),
        ("human", "{input}"),
        MessagesPlaceholder("agent_scratchpad"),
    ])
    agent = create_openai_tools_agent(llm, tools, prompt)
    return AgentExecutor(agent=agent, tools=tools, memory=memory, verbose=True)` },
        ]
    },
    {
        id: "sql",
        title: "SQL Performance Lab",
        subtitle: "Database Optimization & Architecture",
        tag: "Database / SQL", status: "Production",
        color: "#3b82f6", border: "border-blue-400/20 hover:border-blue-400/40",
        gradient: "from-blue-500/20 to-indigo-500/10",
        description: "Optimisation avancée Oracle et SQL Server pour systèmes critiques d'entreprise. Réécriture procédures stockées, ETL pipelines, migration SAP. Réduction latence jusqu'à -70% sur certaines requêtes.",
        tech: ["Oracle SQL", "SQL Server", "PL/SQL", "T-SQL", "SSRS", "ETL", "SAP S4", "Power BI"],
        architecture: ["Query Analyzer (plans d'exécution)", "Index Optimizer", "Stored Procs (business logic)", "ETL Pipeline (migration)", "SSRS Reports (automatisés)", "Monitoring (alertes perf)"],
        challenges: ["Optimisation requêtes sur tables >50M lignes", "Migration sans interruption de service", "Cohérence transactionnelle pendant migration", "Reverse engineering legacy code (PL/SQL)"],
        results: ["Latence réduite jusqu'à -70%", "Rapports automatisés quotidiens", "0 downtime migration SAP", "Documentation architecture complète"],
        difficulty: 4,
        code: [
            {
                file: "optimization.sql", lang: "sql", snippet: `-- Before: Full table scan 8.2s
SELECT * FROM orders WHERE customer_id = :id AND status = 'ACTIVE';

-- Analysis: missing composite index
-- After: Index creation + query rewrite
CREATE INDEX idx_orders_cust_status 
  ON orders(customer_id, status) 
  INCLUDE (order_date, total_amount);

-- Result: 0.12s (-98.5% latency)
SELECT order_id, order_date, total_amount 
FROM orders 
WHERE customer_id = :id AND status = 'ACTIVE';` },
        ]
    },
];

function DifficultyBar({ level }: { level: number }) {
    return (
        <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="w-3 h-1.5 rounded-sm" style={{ background: i < level ? "#f0b90b" : "rgba(255,255,255,0.1)" }} />
            ))}
        </div>
    );
}

function ProjectModal({ p, onClose }: { p: Project; onClose: () => void }) {
    const [tab, setTab] = useState<"overview" | "arch" | "code">("overview");

    return (
        <motion.div className="fixed inset-0 z-[200] flex items-stretch justify-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}>
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div
                className="relative w-full max-w-4xl m-4 md:m-8 glass border border-white/10 rounded-2xl overflow-hidden flex flex-col"
                initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className={`bg-gradient-to-r ${p.gradient} px-6 py-5 flex items-start justify-between flex-shrink-0`}>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: `${p.color}20`, color: p.color, border: `1px solid ${p.color}40` }}>{p.tag}</span>
                            <span className="text-xs font-mono text-white/40">{p.status}</span>
                        </div>
                        <h2 className="text-2xl font-black text-white/95">{p.title}</h2>
                        <p className="text-sm font-mono mt-0.5" style={{ color: p.color }}>{p.subtitle}</p>
                    </div>
                    <button type="button" onClick={onClose} className="text-white/40 hover:text-white transition-colors p-1" style={{ cursor: "pointer" }}>
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-white/8 flex-shrink-0">
                    {([["overview", "Overview"], ["arch", "Architecture"], ["code", "Code"]] as const).map(([k, l]) => (
                        <button key={k} type="button" onClick={() => setTab(k)} style={{ cursor: "pointer" }}
                            className={`px-5 py-3 text-sm font-mono transition-all border-b-2 ${tab === k ? "border-cyan-400 text-cyan-400" : "border-transparent text-white/40 hover:text-white/70"}`}>
                            {l}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {tab === "overview" && (
                        <div className="space-y-5">
                            <p className="text-white/65 leading-relaxed">{p.description}</p>
                            <div>
                                <h3 className="text-xs font-mono text-white/30 uppercase tracking-widest mb-3">Tech Stack</h3>
                                <div className="flex flex-wrap gap-2">
                                    {p.tech.map(t => <span key={t} className="text-xs px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-white/60 font-mono">{t}</span>)}
                                </div>
                            </div>
                            <div>
                                <h3 className="text-xs font-mono text-white/30 uppercase tracking-widest mb-3">Résultats</h3>
                                <div className="space-y-2">
                                    {p.results.map(r => (
                                        <div key={r} className="flex items-center gap-2 text-sm text-white/60">
                                            <span className="text-emerald-400 flex-shrink-0">✓</span> {r}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h3 className="text-xs font-mono text-white/30 uppercase tracking-widest mb-3">Challenges techniques</h3>
                                <div className="space-y-2">
                                    {p.challenges.map(c => (
                                        <div key={c} className="flex items-center gap-2 text-sm text-white/50">
                                            <span className="text-yellow-400 flex-shrink-0">→</span> {c}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-mono text-white/30">Complexité :</span>
                                <DifficultyBar level={p.difficulty} />
                            </div>
                        </div>
                    )}

                    {tab === "arch" && (
                        <div className="space-y-4">
                            <p className="text-white/40 text-sm font-mono mb-4">Pipeline de données — {p.architecture.length} composants</p>
                            <div className="space-y-2">
                                {p.architecture.map((step, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className="flex-shrink-0 flex flex-col items-center">
                                            <div className="w-6 h-6 rounded-full border flex items-center justify-center text-xs font-mono font-bold" style={{ borderColor: `${p.color}60`, color: p.color }}>{i + 1}</div>
                                            {i < p.architecture.length - 1 && <div className="w-px h-4" style={{ background: `${p.color}30` }} />}
                                        </div>
                                        <div className="glass rounded-lg px-4 py-2.5 border border-white/5 text-sm text-white/70 font-mono flex-1">{step}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {tab === "code" && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                                <span className="text-xs font-mono text-white/30">No secrets · Production-ready · Architecture sample</span>
                            </div>
                            {p.code.map((c, i) => (
                                <div key={i} className="rounded-xl overflow-hidden border border-white/8">
                                    <div className="flex items-center gap-3 px-4 py-2 bg-white/5 border-b border-white/8">
                                        <div className="flex gap-1.5">
                                            <div className="w-3 h-3 rounded-full bg-red-500/60" />
                                            <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                                            <div className="w-3 h-3 rounded-full bg-green-500/60" />
                                        </div>
                                        <span className="text-xs font-mono text-white/40">{c.file}</span>
                                    </div>
                                    <pre className="p-4 text-xs font-mono text-white/70 leading-relaxed overflow-x-auto bg-black/40" style={{ whiteSpace: "pre-wrap" }}>
                                        <code>{c.snippet}</code>
                                    </pre>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}

export default function ProjectsSection() {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, amount: 0.05 });
    const [selected, setSelected] = useState<Project | null>(null);

    const openProject = (p: Project) => {
        setSelected(p);
        unlockAchievement("ALL_PROJECTS");
    };

    return (
        <section id="projects" className="relative py-32 px-6 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-950/5 to-transparent pointer-events-none" />

            <div ref={ref} className="max-w-7xl mx-auto">
                <motion.div className="mb-16" initial={{ opacity: 0, y: 40 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7 }}>
                    <div className="flex items-center gap-4 mb-3">
                        <div className="glow-line w-12" />
                        <span className="text-xs font-mono text-cyan-400 tracking-widest uppercase">03 / Research Lab</span>
                    </div>
                    <h2 className="text-4xl md:text-6xl font-black text-white/90 leading-tight">
                        Systems I designed to<br />
                        <span className="text-gradient-static">think, decide and execute.</span>
                    </h2>
                    <p className="mt-3 text-white/40 text-sm font-mono">Click "Open module" for full architecture · code · results</p>
                </motion.div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {PROJECTS.map((p, i) => (
                        <motion.div key={p.id}
                            className={`glass rounded-2xl border overflow-hidden group transition-all duration-300 ${p.border}`}
                            initial={{ opacity: 0, y: 50 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: i * 0.08 }}
                            whileHover={{ y: -5 }}>
                            <div className={`h-1 w-full bg-gradient-to-r ${p.gradient}`} />
                            <div className="p-5">
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <span className="text-xs font-mono px-2 py-0.5 rounded border" style={{ background: `${p.color}15`, color: p.color, borderColor: `${p.color}30` }}>{p.tag}</span>
                                            <span className="text-xs font-mono text-white/25">{p.status}</span>
                                        </div>
                                        <h3 className="text-base font-bold text-white/90">{p.title}</h3>
                                        <p className="text-xs font-mono mt-0.5" style={{ color: p.color }}>{p.subtitle}</p>
                                    </div>
                                </div>

                                <p className="text-white/50 text-xs leading-relaxed line-clamp-2 mb-3">{p.description}</p>

                                <div className="flex flex-wrap gap-1.5 mb-4">
                                    {p.tech.slice(0, 4).map(t => (
                                        <span key={t} className="text-[10px] px-2 py-0.5 rounded bg-white/5 border border-white/8 text-white/40 font-mono">{t}</span>
                                    ))}
                                    {p.tech.length > 4 && <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 border border-white/8 text-white/25 font-mono">+{p.tech.length - 4}</span>}
                                </div>

                                <div className="flex items-center justify-between">
                                    <DifficultyBar level={p.difficulty} />
                                    <button type="button" onClick={() => openProject(p)}
                                        style={{ cursor: "pointer", borderColor: `${p.color}40`, color: p.color, background: `${p.color}10`, fontSize: 12, fontFamily: "monospace", padding: "4px 12px", borderRadius: 8, border: `1px solid ${p.color}40` } as React.CSSProperties}>
                                        Open module →
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            <AnimatePresence>
                {selected && <ProjectModal p={selected} onClose={() => setSelected(null)} />}
            </AnimatePresence>
        </section>
    );
}
