"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { unlockAchievement } from "@/lib/achievements";

const SECTIONS = ["about", "expertise", "projects", "experience", "architecture", "techstack", "github", "contact"];

export default function ProgressTracker() {
    const [visited, setVisited] = useState<Set<string>>(new Set());
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        // Show after scroll
        const onScroll = () => setVisible(window.scrollY > 200);
        window.addEventListener("scroll", onScroll);

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setVisited((prev) => {
                            const next = new Set(prev);
                            next.add(entry.target.id);

                            // Unlock Explorer at 50%
                            if (next.size >= Math.ceil(SECTIONS.length * 0.5)) {
                                unlockAchievement("EXPLORER");
                            }
                            // Unlock BOSS at end
                            if (next.size >= SECTIONS.length - 1) {
                                unlockAchievement("BOSS");
                            }
                            return next;
                        });
                    }
                });
            },
            { threshold: 0.3 }
        );

        SECTIONS.forEach((id) => {
            const el = document.getElementById(id);
            if (el) observer.observe(el);
        });

        return () => {
            window.removeEventListener("scroll", onScroll);
            observer.disconnect();
        };
    }, []);

    const pct = Math.round((visited.size / SECTIONS.length) * 100);

    return (
        <motion.div
            className="fixed top-0 left-0 right-0 z-[60] pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: visible ? 1 : 0 }}
            transition={{ duration: 0.3 }}
        >
            {/* Progress bar */}
            <div className="h-0.5 bg-white/5">
                <motion.div
                    className="h-full bg-gradient-to-r from-cyan-400 via-violet-400 to-cyan-400"
                    style={{ width: `${pct}%` }}
                    transition={{ type: "spring", stiffness: 100 }}
                />
            </div>

            {/* Percentage badge */}
            {visible && pct > 5 && (
                <div
                    className="absolute top-1 font-mono text-[9px] text-white/20 transition-all"
                    style={{ left: `${Math.min(pct, 90)}%` }}
                >
                    {pct}%
                </div>
            )}
        </motion.div>
    );
}
