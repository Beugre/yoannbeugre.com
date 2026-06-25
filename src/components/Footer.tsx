"use client";

import { motion } from "framer-motion";
import { GitBranch, ExternalLink, Mail, ArrowUp } from "lucide-react";

export default function Footer() {
    return (
        <footer className="relative border-t border-white/5 py-12 px-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    {/* Brand */}
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-violet-600 flex items-center justify-center font-mono font-bold text-sm text-black">
                            YB
                        </div>
                        <div>
                            <div className="text-sm font-semibold text-white/80">Yoann Beugré</div>
                            <div className="text-xs text-white/30 font-mono">Software Engineer · AI · Quant</div>
                        </div>
                    </div>

                    {/* Links */}
                    <div className="flex items-center gap-4">
                        <a
                            href="https://github.com/Beugre"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-9 h-9 rounded-lg glass border border-white/10 flex items-center justify-center text-white/40 hover:text-white/90 hover:border-white/25 transition-all duration-200"
                            aria-label="GitHub"
                        >
                            <GitBranch size={16} />
                        </a>
                        <a
                            href="https://linkedin.com/in/yoann-beugré-236b20153"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-9 h-9 rounded-lg glass border border-white/10 flex items-center justify-center text-white/40 hover:text-blue-400 hover:border-blue-400/30 transition-all duration-200"
                            aria-label="LinkedIn"
                        >
                            <ExternalLink size={16} />
                        </a>
                        <a
                            href="mailto:contact@yoannbeugre.dev"
                            className="w-9 h-9 rounded-lg glass border border-white/10 flex items-center justify-center text-white/40 hover:text-cyan-400 hover:border-cyan-400/30 transition-all duration-200"
                            aria-label="Email"
                        >
                            <Mail size={16} />
                        </a>
                    </div>

                    {/* Right */}
                    <div className="flex items-center gap-4">
                        <p className="text-xs text-white/20 font-mono">
                            © {new Date().getFullYear()} Yoann Beugré
                        </p>
                        <motion.button
                            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                            className="w-9 h-9 rounded-lg glass border border-white/10 flex items-center justify-center text-white/40 hover:text-white/90 hover:border-white/25 transition-all duration-200"
                            whileHover={{ y: -2 }}
                            aria-label="Retour en haut"
                        >
                            <ArrowUp size={16} />
                        </motion.button>
                    </div>
                </div>
            </div>
        </footer>
    );
}
