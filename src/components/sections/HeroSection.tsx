"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import ParticleCanvas from "../ParticleCanvas";

const roles = ["Software Engineer", "AI Engineer", "Quant Developer", "Algorithm Designer"];

export default function HeroSection() {
    const nameRef = useRef<HTMLHeadingElement>(null);

    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
            {/* Background gradient layers */}
            <div className="absolute inset-0 bg-[#030712]" />
            <div className="absolute inset-0 bg-gradient-radial from-cyan-950/30 via-transparent to-transparent" />
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-pulse-glow" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: "1s" }} />

            {/* Grid pattern */}
            <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: `
            linear-gradient(rgba(0,212,255,1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,212,255,1) 1px, transparent 1px)
          `,
                    backgroundSize: "60px 60px",
                }}
            />

            {/* Particle Canvas */}
            <ParticleCanvas />

            {/* Scan line effect */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background:
                        "linear-gradient(transparent 50%, rgba(0,212,255,0.01) 50%)",
                    backgroundSize: "100% 4px",
                }}
            />

            {/* Content */}
            <div className="relative z-10 text-center px-6 max-w-6xl mx-auto">
                {/* Status badge */}
                <motion.div
                    className="flex items-center justify-center mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-400/20 bg-cyan-400/5 backdrop-blur-sm">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-xs font-mono text-cyan-300/70 tracking-widest uppercase">
                            Open to opportunities
                        </span>
                    </div>
                </motion.div>

                {/* Main name */}
                <div className="overflow-hidden mb-4">
                    <motion.h1
                        ref={nameRef}
                        className="text-6xl md:text-8xl lg:text-[10rem] font-black tracking-tighter leading-none"
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <span className="text-gradient">YOANN</span>
                    </motion.h1>
                </div>
                <div className="overflow-hidden mb-8">
                    <motion.h1
                        className="text-6xl md:text-8xl lg:text-[10rem] font-black tracking-tighter leading-none text-white/90"
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    >
                        BEUGRÉ
                    </motion.h1>
                </div>

                {/* Roles */}
                <motion.div
                    className="flex flex-wrap items-center justify-center gap-3 mb-10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                >
                    {roles.map((role, i) => (
                        <motion.span
                            key={role}
                            className="px-4 py-2 rounded-lg text-sm font-mono font-medium border border-white/10 bg-white/5 text-white/70 backdrop-blur-sm"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.4, delay: 0.5 + i * 0.08 }}
                            whileHover={{ scale: 1.05, borderColor: "rgba(0,212,255,0.4)", color: "#00d4ff" }}
                        >
                            {role}
                        </motion.span>
                    ))}
                </motion.div>

                {/* Subtitle */}
                <motion.p
                    className="max-w-2xl mx-auto text-white/40 text-lg leading-relaxed mb-12"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.7 }}
                >
                    Architecte de systèmes complexes. Je construis des algorithmes de trading,
                    des agents IA et des infrastructures haute performance qui opèrent
                    à la frontière de la technologie et de la finance.
                </motion.p>

                {/* CTA Buttons */}
                <motion.div
                    className="flex flex-col sm:flex-row items-center justify-center gap-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.85 }}
                >
                    <motion.button
                        onClick={() => document.querySelector("#projects")?.scrollIntoView({ behavior: "smooth" })}
                        className="group relative px-8 py-4 rounded-xl font-semibold text-black overflow-hidden"
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-violet-500" />
                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-300 to-violet-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <span className="relative flex items-center gap-2">
                            Explore my work
                            <motion.span
                                animate={{ x: [0, 4, 0] }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                            >
                                →
                            </motion.span>
                        </span>
                    </motion.button>

                    <motion.button
                        onClick={() => document.querySelector("#contact")?.scrollIntoView({ behavior: "smooth" })}
                        className="px-8 py-4 rounded-xl font-semibold border border-white/15 text-white/70 hover:text-white hover:border-white/30 hover:bg-white/5 transition-all duration-300"
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        Get in touch
                    </motion.button>
                </motion.div>

                {/* Scroll indicator */}
                <motion.div
                    className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5 }}
                >
                    <span className="text-xs font-mono text-white/30 tracking-widest uppercase">Scroll</span>
                    <motion.div
                        className="w-px h-12 bg-gradient-to-b from-cyan-400/60 to-transparent"
                        animate={{ scaleY: [1, 0.4, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                    />
                </motion.div>
            </div>

            {/* Corner decorations */}
            <div className="absolute top-20 left-6 text-xs font-mono text-white/15">
                <div>01 / PORTFOLIO</div>
                <div className="mt-1">v2.0.25</div>
            </div>
            <div className="absolute top-20 right-6 text-xs font-mono text-white/15 text-right">
                <div>YOANN BEUGRÉ</div>
                <div className="mt-1">SWE · AI · QUANT</div>
            </div>
        </section>
    );
}
