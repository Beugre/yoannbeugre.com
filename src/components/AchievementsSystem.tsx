"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy } from "lucide-react";
import {
    subscribeAchievement,
    ACHIEVEMENTS,
    isUnlocked,
    AchievementId,
} from "@/lib/achievements";

function getAll(): AchievementId[] {
    if (typeof window === "undefined") return [];
    return (Object.keys(ACHIEVEMENTS) as AchievementId[]).filter(isUnlocked);
}

export default function AchievementsSystem() {
    const [queue, setQueue] = useState<AchievementId[]>([]);
    const [panelOpen, setPanelOpen] = useState(false);
    const [unlocked, setUnlocked] = useState<AchievementId[]>([]);

    useEffect(() => {
        // Load initially unlocked achievements
        setUnlocked(getAll());

        const unsub = subscribeAchievement((id) => {
            setQueue((q) => [...q, id]);
            setUnlocked(getAll());
        });
        return unsub;
    }, []);

    // Auto-dismiss toast
    useEffect(() => {
        if (queue.length === 0) return;
        const t = setTimeout(() => setQueue((q) => q.slice(1)), 3500);
        return () => clearTimeout(t);
    }, [queue]);

    const current = queue[0] ? ACHIEVEMENTS[queue[0]] : null;

    return (
        <>
            {/* Toast notification */}
            <AnimatePresence mode="wait">
                {current && (
                    <motion.div
                        key={current.id}
                        className="fixed top-20 right-4 z-[150] glass border border-white/10 rounded-xl p-4 flex items-center gap-3 max-w-xs shadow-2xl"
                        initial={{ opacity: 0, x: 60, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 60, scale: 0.9 }}
                        transition={{ type: "spring", damping: 20, stiffness: 300 }}
                    >
                        {current.rare && (
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-400/10 to-violet-400/10 animate-pulse pointer-events-none" />
                        )}
                        <div className="text-2xl flex-shrink-0">{current.icon}</div>
                        <div>
                            <div className="text-[10px] font-mono text-yellow-400 uppercase tracking-widest mb-0.5">
                                🏆 Achievement unlocked{current.rare ? " — RARE" : ""}
                            </div>
                            <div className="text-sm font-bold text-white/90">{current.title}</div>
                            <div className="text-xs text-white/40">{current.desc}</div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Trophy panel button */}
            <motion.button
                className="fixed bottom-6 right-4 z-[120] w-10 h-10 glass border border-white/10 rounded-xl flex items-center justify-center text-white/40 hover:text-yellow-400 hover:border-yellow-400/30 transition-all"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setPanelOpen(true)}
                title="Achievements"
            >
                <Trophy size={16} />
                {unlocked.length > 0 && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-yellow-400 flex items-center justify-center text-[9px] font-bold text-black">
                        {unlocked.length}
                    </div>
                )}
            </motion.button>

            {/* Achievement panel */}
            <AnimatePresence>
                {panelOpen && (
                    <motion.div
                        className="fixed inset-0 z-[140] flex items-center justify-center p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setPanelOpen(false)}
                    >
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
                        <motion.div
                            className="relative glass rounded-2xl border border-white/10 p-6 w-full max-w-sm z-10"
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-white/90 flex items-center gap-2">
                                    <Trophy size={16} className="text-yellow-400" />
                                    Achievements
                                </h3>
                                <span className="text-xs font-mono text-white/40">
                                    {unlocked.length}/{Object.keys(ACHIEVEMENTS).length}
                                </span>
                            </div>

                            {/* Progress bar */}
                            <div className="h-1 bg-white/5 rounded-full mb-4 overflow-hidden">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-yellow-400 to-violet-400 rounded-full"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(unlocked.length / Object.keys(ACHIEVEMENTS).length) * 100}%` }}
                                    transition={{ duration: 0.6 }}
                                />
                            </div>

                            <div className="space-y-2 max-h-80 overflow-y-auto">
                                {(Object.values(ACHIEVEMENTS) as typeof ACHIEVEMENTS[AchievementId][]).map((ach) => {
                                    const isUnlocked = unlocked.includes(ach.id);
                                    return (
                                        <div
                                            key={ach.id}
                                            className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${isUnlocked
                                                ? "border-white/10 bg-white/5"
                                                : "border-white/5 bg-white/[0.02] opacity-40"
                                                }`}
                                        >
                                            <div className="text-xl">{isUnlocked ? ach.icon : "🔒"}</div>
                                            <div>
                                                <div className={`text-sm font-medium ${isUnlocked ? "text-white/90" : "text-white/30"}`}>
                                                    {ach.title}
                                                    {ach.rare && isUnlocked && (
                                                        <span className="ml-2 text-[9px] text-yellow-400 font-mono">RARE</span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-white/30">{isUnlocked ? ach.desc : "???"}</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
