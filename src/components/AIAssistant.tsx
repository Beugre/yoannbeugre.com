"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { X, Send } from "lucide-react";
import { unlockAchievement } from "@/lib/achievements";

interface Message {
    role: "user" | "ai";
    text: string;
}

const QA = [
    {
        patterns: ["trading", "bot", "binance", "crypto", "rsi", "price action"],
        answer: "Mon trading bot Python tourne 24/7 sur Binance. Il combine RSI, Price Action et gestion dynamique du risque (SL/TP adaptatifs). Chaque signal déclenche automatiquement un ordre + une alerte Telegram. Le dashboard Streamlit affiche les performances en temps réel. Résultat : automatisation complète, sans surveillance.",
    },
    {
        patterns: ["polymarket", "prediction", "marché", "prédictif"],
        answer: "Polymarket, c'est de la finance décentralisée appliquée aux événements réels (élections, sport, macro). Mon système scrape les marchés en temps réel, calcule les probabilités implicites vs réelles, et détecte les inefficiences. Quand la probabilité réelle > cote du marché → alerte automatique + position.",
    },
    {
        patterns: ["ai", "ia", "llm", "agent", "gpt", "claude", "langchain"],
        answer: "Je développe des agents IA autonomes avec LangChain et les API OpenAI/Anthropic. Mes agents orchestrent des workflows complexes, utilisent des outils externes (APIs, databases, web), et maintiennent un contexte long. La clé de tout : le Prompt Engineering — formuler les bonnes instructions pour obtenir des comportements fiables.",
    },
    {
        patterns: ["sql", "oracle", "database", "base", "procédure"],
        answer: "J'ai optimisé des bases Oracle et SQL Server pour de grandes entreprises. Migration vers SAP S4, réécriture de procédures stockées critiques, réduction des temps de requête jusqu'à -70%. Les bases de données bien tuées sont souvent le bottleneck invisible des systèmes. Je diagnostique avec les plans d'exécution et des index stratégiques.",
    },
    {
        patterns: ["maths", "math", "mathématiques", "enseigner", "cours", "professeur"],
        answer: "J'ai donné des cours de maths pendant 14 ans (2011-2025), de la 3ème à la 2ème année de licence. Cette pratique m'a formé à décomposer des problèmes complexes et à les expliquer avec précision. Aujourd'hui, cette rigueur se retrouve dans mes algorithmes : chaque stratégie est une démonstration mathématique appliquée.",
    },
    {
        patterns: ["miage", "bordeaux", "formation", "étude", "université", "master"],
        answer: "Master MIAGE (Méthodes Informatiques Appliquées à la Gestion des Entreprises) à l'Université de Bordeaux — double compétence maths + informatique + gestion. C'est cette formation à l'intersection de la rigueur mathématique et de l'informatique qui me permet d'aborder aussi bien l'algorithmique que la finance quantitative.",
    },
    {
        patterns: ["expérience", "experience", "parcours", "cv", "carrière", "cto", "scrum"],
        answer: "Développeur Full-Stack (PHP) → Scrum Master (GENERIX, migration SAP S4, 3 ans) → CTO Adjoint (2 équipes, ERP Appian from scratch) → Quant/AI Developer (side projects). Chaque étape a posé une brique : la base technique, le leadership, l'architecture, et maintenant les systèmes algorithmiques autonomes.",
    },
    {
        patterns: ["paris sportifs", "betting", "sport", "pari", "value bet", "kelly"],
        answer: "Mon algo de paris sportifs analyse les cotes pour détecter des value bets : cas où la probabilité réelle d'un événement est supérieure à la probabilité implicite dans les cotes. Le sizing utilise le critère de Kelly pour maximiser la croissance du capital à long terme. C'est de la statistique appliquée à la finance alternative.",
    },
    {
        patterns: ["disponible", "hire", "embauche", "recrutement", "poste", "emploi", "available", "opportunity"],
        answer: "Oui, je suis ouvert aux opportunités — remote ou hybride Paris/IDF. Je cherche des postes qui combinent ingénierie logicielle avec data, AI ou finance quantitative. Contactez-moi : contact@yoannbeugre.dev ou LinkedIn linkedin.com/in/yoann-beugré-236b20153. Je réponds vite.",
    },
    {
        patterns: ["stack", "technologie", "python", "react", "typescript", "outil"],
        answer: "Stack principale : Python (algo, ML, bots) • TypeScript/React/Next.js (frontend) • Oracle/PostgreSQL (data) • Docker/Linux (infra). Côté AI : LangChain, OpenAI API, Anthropic Claude. Trading : Binance API, Polymarket API, WebSocket temps réel. Je choisis toujours l'outil le plus adapté au problème.",
    },
];

const SUGGESTIONS = [
    "Comment fonctionne ton bot Binance ?",
    "C'est quoi Polymarket ?",
    "Quel est ton parcours ?",
    "Tu es disponible pour une mission ?",
    "Explique-moi les agents IA",
];

function findAnswer(input: string): string {
    const lower = input.toLowerCase();
    for (const qa of QA) {
        if (qa.patterns.some((p) => lower.includes(p))) {
            return qa.answer;
        }
    }
    return "Je ne suis pas sûr de comprendre la question. Tu peux me demander : le bot de trading, les agents IA, Polymarket, mon parcours, mes cours de maths, ou si je suis disponible. 🤖";
}

export default function AIAssistant() {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [typing, setTyping] = useState(false);
    const [started, setStarted] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, typing]);

    const openChat = () => {
        setOpen(true);
        if (!started) {
            setStarted(true);
            unlockAchievement("AI_CHAT");
            setTimeout(() => {
                setMessages([
                    {
                        role: "ai",
                        text: "👋 Salut ! Je suis l'IA de Yoann. Pose-moi n'importe quelle question sur son profil, ses projets ou ses compétences.",
                    },
                ]);
            }, 300);
        }
    };

    const sendMessage = (text?: string) => {
        const msg = text ?? input.trim();
        if (!msg) return;
        setInput("");
        setMessages((prev) => [...prev, { role: "user", text: msg }]);
        setTyping(true);

        setTimeout(() => {
            setTyping(false);
            setMessages((prev) => [...prev, { role: "ai", text: findAnswer(msg) }]);
        }, 800 + Math.random() * 600);
    };

    return (
        <>
            {/* Floating button */}
            <AnimatePresence>
                {!open && (
                    <motion.button
                        className="fixed bottom-6 left-6 z-[120] flex items-center gap-2 px-3 py-2.5 glass border border-violet-400/25 rounded-xl text-xs font-mono text-violet-300 hover:border-violet-400/50 hover:bg-violet-400/10 transition-all"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ delay: 3 }}
                        onClick={openChat}
                    >
                        <span className="text-base">🤖</span>
                        <span className="hidden sm:inline">Ask Yoann&apos;s AI</span>
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Chat modal */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        className="fixed bottom-6 left-6 z-[130] w-80 sm:w-96"
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    >
                        <div className="glass rounded-2xl border border-violet-400/20 overflow-hidden shadow-2xl flex flex-col" style={{ maxHeight: "480px" }}>
                            {/* Header */}
                            <div className="flex items-center gap-3 p-4 border-b border-white/8 bg-violet-400/5 flex-shrink-0">
                                <div className="relative">
                                    <Image
                                        src="/yoann.jpg"
                                        alt="Yoann"
                                        width={36}
                                        height={36}
                                        className="rounded-full object-cover object-top border border-violet-400/30"
                                    />
                                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#030712]" />
                                </div>
                                <div>
                                    <div className="text-sm font-semibold text-white/90">Yoann&apos;s AI</div>
                                    <div className="text-xs text-emerald-400 font-mono">en ligne · répond instantanément</div>
                                </div>
                                <button
                                    className="ml-auto text-white/30 hover:text-white/70 transition-colors"
                                    onClick={() => setOpen(false)}
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
                                {messages.map((msg, i) => (
                                    <motion.div
                                        key={i}
                                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                    >
                                        <div
                                            className={`max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed ${msg.role === "user"
                                                    ? "bg-violet-500/30 text-white/90 rounded-br-sm"
                                                    : "bg-white/5 border border-white/8 text-white/70 rounded-bl-sm"
                                                }`}
                                        >
                                            {msg.text}
                                        </div>
                                    </motion.div>
                                ))}

                                {typing && (
                                    <div className="flex justify-start">
                                        <div className="bg-white/5 border border-white/8 px-4 py-2.5 rounded-xl rounded-bl-sm">
                                            <div className="flex gap-1">
                                                {[0, 1, 2].map((i) => (
                                                    <motion.div
                                                        key={i}
                                                        className="w-1.5 h-1.5 bg-violet-400 rounded-full"
                                                        animate={{ y: [0, -4, 0] }}
                                                        transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Suggestions */}
                                {messages.length <= 1 && !typing && (
                                    <div className="space-y-1.5">
                                        {SUGGESTIONS.map((s) => (
                                            <button
                                                key={s}
                                                onClick={() => sendMessage(s)}
                                                className="block w-full text-left text-xs px-3 py-1.5 rounded-lg border border-white/8 text-white/40 hover:text-white/70 hover:border-violet-400/30 hover:bg-violet-400/5 transition-all"
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                <div ref={bottomRef} />
                            </div>

                            {/* Input */}
                            <div className="flex items-center gap-2 p-3 border-t border-white/8 flex-shrink-0">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                                    placeholder="Pose ta question..."
                                    className="flex-1 bg-white/5 border border-white/8 rounded-lg px-3 py-2 text-sm text-white/80 placeholder:text-white/20 outline-none focus:border-violet-400/40 transition-colors"
                                />
                                <button
                                    onClick={() => sendMessage()}
                                    className="w-8 h-8 rounded-lg bg-violet-500/40 flex items-center justify-center text-violet-300 hover:bg-violet-500/60 transition-colors flex-shrink-0"
                                >
                                    <Send size={13} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
