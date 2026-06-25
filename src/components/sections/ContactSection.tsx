"use client";

import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Send, GitBranch, FileText, Mail, CheckCircle, AlertCircle, ExternalLink } from "lucide-react";

type Status = "idle" | "loading" | "success" | "error";

export default function ContactSection() {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, amount: 0.1 });

    const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
    const [status, setStatus] = useState<Status>("idle");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus("loading");

        try {
            const res = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });

            if (res.ok) {
                setStatus("success");
                setForm({ name: "", email: "", subject: "", message: "" });
            } else {
                setStatus("error");
            }
        } catch {
            setStatus("error");
        }

        setTimeout(() => setStatus("idle"), 4000);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    return (
        <section id="contact" className="relative py-32 px-6 overflow-hidden">
            {/* Background decorations */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-950/5 to-transparent" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent" />

            <div ref={ref} className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    className="mb-16 text-center"
                    initial={{ opacity: 0, y: 40 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.7 }}
                >
                    <div className="flex items-center justify-center gap-4 mb-4">
                        <div className="glow-line w-16" />
                        <span className="text-xs font-mono text-cyan-400 tracking-widest uppercase">
                            08 / Contact
                        </span>
                        <div className="glow-line w-16" />
                    </div>
                    <h2 className="text-4xl md:text-6xl font-black text-white/90 leading-tight mb-4">
                        Construisons quelque chose{" "}
                        <span className="text-gradient-static">ensemble</span>
                    </h2>
                    <p className="text-white/40 max-w-xl mx-auto">
                        Disponible pour des missions freelance, des opportunités full-time
                        et des collaborations sur des projets techniques ambitieux.
                    </p>
                </motion.div>

                <div className="grid lg:grid-cols-5 gap-8">
                    {/* Contact info */}
                    <motion.div
                        className="lg:col-span-2 space-y-5"
                        initial={{ opacity: 0, x: -30 }}
                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        {/* Status */}
                        <div className="glass rounded-2xl p-6 border border-cyan-400/15">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                <span className="text-emerald-400 text-sm font-medium">Disponible</span>
                            </div>
                            <p className="text-white/50 text-sm">
                                Ouvert aux opportunités — remote ou hybride (Paris/IDF).
                            </p>
                        </div>

                        {/* Links */}
                        <div className="space-y-3">
                            {[
                                {
                                    icon: GitBranch,
                                    label: "GitHub",
                                    value: "github.com/Beugre",
                                    href: "https://github.com/Beugre",
                                    color: "text-white/60",
                                },
                                {
                                    icon: ExternalLink,
                                    label: "LinkedIn",
                                    value: "linkedin.com/in/yoann-beugré-236b20153",
                                    href: "https://linkedin.com/in/yoann-beugré-236b20153",
                                    color: "text-blue-400",
                                },
                                {
                                    icon: Mail,
                                    label: "Email",
                                    value: "contact@yoannbeugre.dev",
                                    href: "mailto:contact@yoannbeugre.dev",
                                    color: "text-cyan-400",
                                },
                            ].map((link) => (
                                <a
                                    key={link.label}
                                    href={link.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-4 glass rounded-xl p-4 border border-white/5 hover:border-white/15 transition-all duration-200 group"
                                >
                                    <link.icon size={18} className={`${link.color} flex-shrink-0`} />
                                    <div>
                                        <div className="text-xs text-white/30 font-mono">{link.label}</div>
                                        <div className="text-sm text-white/60 group-hover:text-white/90 transition-colors">
                                            {link.value}
                                        </div>
                                    </div>
                                </a>
                            ))}
                        </div>

                        {/* CV Download */}
                        <motion.a
                            href="/cv-yoann-beugre.pdf"
                            download
                            className="flex items-center justify-center gap-3 w-full py-4 rounded-xl border border-violet-400/30 text-violet-300 hover:bg-violet-400/10 transition-all duration-200 font-medium text-sm group"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <FileText size={18} />
                            Télécharger mon CV
                            <motion.span
                                animate={{ y: [0, 2, 0] }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                            >
                                ↓
                            </motion.span>
                        </motion.a>
                    </motion.div>

                    {/* Form */}
                    <motion.div
                        className="lg:col-span-3"
                        initial={{ opacity: 0, x: 30 }}
                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 0.6, delay: 0.3 }}
                    >
                        <form
                            onSubmit={handleSubmit}
                            className="glass rounded-2xl p-8 border border-white/8 space-y-5"
                        >
                            <div className="grid sm:grid-cols-2 gap-5">
                                {/* Name */}
                                <div>
                                    <label className="block text-xs font-mono text-white/40 mb-2 uppercase tracking-wider">
                                        Nom
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={form.name}
                                        onChange={handleChange}
                                        required
                                        placeholder="John Doe"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-cyan-400/40 focus:bg-white/8 transition-all duration-200"
                                    />
                                </div>
                                {/* Email */}
                                <div>
                                    <label className="block text-xs font-mono text-white/40 mb-2 uppercase tracking-wider">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={form.email}
                                        onChange={handleChange}
                                        required
                                        placeholder="john@company.com"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-cyan-400/40 focus:bg-white/8 transition-all duration-200"
                                    />
                                </div>
                            </div>

                            {/* Subject */}
                            <div>
                                <label className="block text-xs font-mono text-white/40 mb-2 uppercase tracking-wider">
                                    Sujet
                                </label>
                                <input
                                    type="text"
                                    name="subject"
                                    value={form.subject}
                                    onChange={handleChange}
                                    required
                                    placeholder="Collaboration, mission, opportunité..."
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-cyan-400/40 focus:bg-white/8 transition-all duration-200"
                                />
                            </div>

                            {/* Message */}
                            <div>
                                <label className="block text-xs font-mono text-white/40 mb-2 uppercase tracking-wider">
                                    Message
                                </label>
                                <textarea
                                    name="message"
                                    value={form.message}
                                    onChange={handleChange}
                                    required
                                    rows={5}
                                    placeholder="Décrivez votre projet ou votre opportunité..."
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-cyan-400/40 focus:bg-white/8 transition-all duration-200 resize-none"
                                />
                            </div>

                            {/* Submit */}
                            <motion.button
                                type="submit"
                                disabled={status === "loading"}
                                className="w-full py-4 rounded-xl font-semibold text-sm relative overflow-hidden group disabled:opacity-60"
                                whileHover={status === "idle" ? { scale: 1.01 } : {}}
                                whileTap={status === "idle" ? { scale: 0.99 } : {}}
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-violet-500" />
                                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-violet-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <span className="relative flex items-center justify-center gap-2 text-black font-bold">
                                    {status === "loading" ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                            Envoi en cours...
                                        </>
                                    ) : status === "success" ? (
                                        <>
                                            <CheckCircle size={16} />
                                            Message envoyé !
                                        </>
                                    ) : status === "error" ? (
                                        <>
                                            <AlertCircle size={16} />
                                            Erreur — réessayez
                                        </>
                                    ) : (
                                        <>
                                            <Send size={16} />
                                            Envoyer le message
                                        </>
                                    )}
                                </span>
                            </motion.button>
                        </form>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
