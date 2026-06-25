"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

const navLinks = [
    { label: "About", href: "#about" },
    { label: "Expertise", href: "#expertise" },
    { label: "Projects", href: "#projects" },
    { label: "Experience", href: "#experience" },
    { label: "Architecture", href: "#architecture" },
    { label: "Contact", href: "#contact" },
];

export default function Navigation() {
    const { scrollY } = useScroll();
    const [isOpen, setIsOpen] = useState(false);
    const [activeSection, setActiveSection] = useState("");

    const bgOpacity = useTransform(scrollY, [0, 100], [0, 1]);

    useEffect(() => {
        const sections = navLinks.map((l) => l.href.slice(1));
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveSection(entry.target.id);
                    }
                });
            },
            { threshold: 0.4 }
        );

        sections.forEach((id) => {
            const el = document.getElementById(id);
            if (el) observer.observe(el);
        });

        return () => observer.disconnect();
    }, []);

    const handleClick = (href: string) => {
        setIsOpen(false);
        const el = document.querySelector(href) as HTMLElement | null;
        if (!el) return;
        // Use Lenis if available, fallback to scrollIntoView
        const lenisEvent = new CustomEvent("lenis:scrollTo", { detail: { target: el, offset: -64 } });
        if (!window.dispatchEvent(lenisEvent)) {
            el.scrollIntoView({ behavior: "smooth" });
        } else {
            el.scrollIntoView({ behavior: "smooth" });
        }
    };

    return (
        <>
            <motion.nav
                className="fixed top-0 left-0 right-0 z-50"
                style={{}}
            >
                <motion.div
                    className="absolute inset-0 border-b border-white/5"
                    style={{ opacity: bgOpacity, backgroundColor: "rgba(3,7,18,0.85)", backdropFilter: "blur(20px)" }}
                />
                <div className="relative max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
                    {/* Logo */}
                    <motion.a
                        href="#"
                        className="flex items-center gap-2 group"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                        onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                    >
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-violet-600 flex items-center justify-center font-mono font-bold text-sm text-black">
                            YB
                        </div>
                        <span className="font-mono text-sm text-white/60 group-hover:text-white/90 transition-colors">
                            yoann.dev
                        </span>
                    </motion.a>

                    {/* Desktop Links */}
                    <motion.ul
                        className="hidden md:flex items-center gap-1"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        {navLinks.map((link, i) => (
                            <li key={link.href}>
                                <motion.button
                                    onClick={() => handleClick(link.href)}
                                    className={`px-4 py-2 text-sm rounded-lg transition-all duration-200 font-medium ${activeSection === link.href.slice(1)
                                        ? "text-cyan-400 bg-cyan-400/10"
                                        : "text-white/50 hover:text-white/90 hover:bg-white/5"
                                        }`}
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 + i * 0.05 }}
                                >
                                    {link.label}
                                </motion.button>
                            </li>
                        ))}
                    </motion.ul>

                    {/* CTA */}
                    <motion.div
                        className="hidden md:flex items-center gap-3"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        <button
                            onClick={() => handleClick("#contact")}
                            className="px-4 py-2 text-sm font-medium rounded-lg border border-cyan-400/30 text-cyan-400 hover:bg-cyan-400/10 transition-all duration-200 hover:border-cyan-400/60"
                        >
                            Let&apos;s talk
                        </button>
                    </motion.div>

                    {/* Mobile Menu Toggle */}
                    <button
                        className="md:hidden text-white/70 hover:text-white"
                        onClick={() => setIsOpen(!isOpen)}
                        aria-label="Toggle menu"
                    >
                        {isOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </motion.nav>

            {/* Mobile Menu */}
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-40 bg-[#030712]/95 backdrop-blur-xl md:hidden"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <div className="flex flex-col items-center justify-center h-full gap-6">
                        {navLinks.map((link, i) => (
                            <motion.button
                                key={link.href}
                                onClick={() => handleClick(link.href)}
                                className="text-2xl font-medium text-white/70 hover:text-white transition-colors"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                            >
                                {link.label}
                            </motion.button>
                        ))}
                        <motion.button
                            onClick={() => handleClick("#contact")}
                            className="mt-4 px-8 py-3 rounded-xl border border-cyan-400/40 text-cyan-400 text-lg font-medium"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.35 }}
                        >
                            Let&apos;s talk
                        </motion.button>
                    </div>
                </motion.div>
            )}
        </>
    );
}
