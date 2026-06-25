"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { unlockAchievement } from "@/lib/achievements";

const BOOT_LINES = [
    { text: "YOANN BEUGRÉ // COMMAND CENTER v2.0", color: "text-cyan-400 font-bold text-lg", delay: 0 },
    { text: "", delay: 200 },
    { text: "INITIALIZING...", color: "text-green-400/80", delay: 400 },
    { text: "  [OK] Loading kernel modules", color: "text-green-400/60", delay: 700 },
    { text: "  [OK] Mounting /dev/brain", color: "text-green-400/60", delay: 950 },
    { text: "  [OK] Starting neural engine", color: "text-green-400/60", delay: 1150 },
    { text: "", delay: 1300 },
    { text: "SCANNING CANDIDATE PROFILE...", color: "text-yellow-400/90", delay: 1500 },
    { text: "  → Name         : Yoann Beugré", color: "text-cyan-300", delay: 1750 },
    { text: "  → Role         : Software Eng. / AI / Quant", color: "text-cyan-300", delay: 1950 },
    { text: "  → Education    : Master MIAGE — Bordeaux", color: "text-cyan-300", delay: 2150 },
    { text: "  → Teaching     : Mathematics (2011 — 2025)", color: "text-cyan-300", delay: 2350 },
    { text: "  → Clearance    : LEVEL 5 — AUTHORIZED", color: "text-emerald-400", delay: 2550 },
    { text: "", delay: 2750 },
    { text: "LOADING PROJECTS DATABASE...", color: "text-yellow-400/90", delay: 2950 },
    { text: "  [ACTIVE] Trading Bot Crypto     — Binance API", color: "text-violet-300", delay: 3150 },
    { text: "  [ACTIVE] Algo Paris Sportifs    — Value Bets", color: "text-violet-300", delay: 3300 },
    { text: "  [ACTIVE] Polymarket Analyzer   — DeFi", color: "text-violet-300", delay: 3450 },
    { text: "  [ACTIVE] AI Agents             — LLM", color: "text-violet-300", delay: 3600 },
    { text: "  [ACTIVE] SQL Engineering       — Oracle", color: "text-violet-300", delay: 3750 },
    { text: "", delay: 3900 },
    { text: "DECRYPTING PORTFOLIO...", color: "text-yellow-400/90", delay: 4050 },
    { text: "  ████████████████████████ 100%", color: "text-violet-400", delay: 4300 },
    { text: "", delay: 4500 },
    { text: "✓ SYSTEM READY.", color: "text-emerald-400 font-bold text-base", delay: 4600 },
    { text: "", delay: 4750 },
    { text: "[ Press ENTER or click anywhere to continue ]", color: "text-cyan-400/70 animate-pulse", delay: 4900 },
];

export default function BootScreen() {
    const [visible, setVisible] = useState<number[]>([]);
    const [done, setDone] = useState(false);
    const [exiting, setExiting] = useState(false);
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined") return;
        if (sessionStorage.getItem("boot_seen")) return;
        setShow(true);

        BOOT_LINES.forEach((line, i) => {
            setTimeout(() => {
                setVisible((prev) => [...prev, i]);
                if (i === BOOT_LINES.length - 1) setDone(true);
            }, line.delay);
        });
    }, []);

    useEffect(() => {
        if (!done) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Enter") dismiss();
        };
        window.addEventListener("keydown", handler);
        // Auto-dismiss 1.5s after boot complete
        const t = setTimeout(dismiss, 1500);
        return () => {
            window.removeEventListener("keydown", handler);
            clearTimeout(t);
        };
    }, [done]);

    const dismiss = () => {
        if (exiting) return;
        setExiting(true);
        sessionStorage.setItem("boot_seen", "1");
        unlockAchievement("BOOT");
        setTimeout(() => setShow(false), 700);
    };

    // Legacy name kept for onClick
    const handleContinue = dismiss;

    if (!show) return null;

    return (
        <AnimatePresence>
            {!exiting && (
                <motion.div
                    className="fixed inset-0 z-[300] bg-black flex items-start justify-start cursor-pointer overflow-hidden"
                    onClick={handleContinue}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6 }}
                    style={exiting ? { pointerEvents: "none" } : {}}
                >
                    {/* CRT scanlines overlay */}
                    <div
                        className="absolute inset-0 pointer-events-none opacity-10"
                        style={{
                            background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,70,0.15) 2px, rgba(0,255,70,0.15) 4px)",
                        }}
                    />

                    {/* Terminal content */}
                    <div className="relative z-10 p-8 md:p-16 max-w-3xl w-full mt-8 md:mt-16">
                        <div className="font-mono text-sm space-y-0.5">
                            {BOOT_LINES.map((line, i) =>
                                visible.includes(i) ? (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -8 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.08 }}
                                        className={line.color ?? "text-green-400/80"}
                                    >
                                        {line.text || "\u00a0"}
                                    </motion.div>
                                ) : null
                            )}

                            {/* Blinking cursor */}
                            {visible.length > 0 && !done && (
                                <motion.span
                                    className="inline-block w-2 h-4 bg-green-400 align-middle"
                                    animate={{ opacity: [1, 0] }}
                                    transition={{ duration: 0.6, repeat: Infinity }}
                                />
                            )}
                        </div>
                    </div>

                    {/* Skip button */}
                    <button
                        className="absolute top-4 right-4 text-xs font-mono text-white/20 hover:text-white/50 transition-colors z-20"
                        onClick={(e) => { e.stopPropagation(); dismiss(); }}
                    >
                        SKIP →
                    </button>

                    {/* Version tag */}
                    <div className="absolute bottom-4 right-4 text-xs font-mono text-green-400/20">
                        SYS:OK MEM:OK NET:OK
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
