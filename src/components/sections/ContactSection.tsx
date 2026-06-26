"use client";

import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Send, GitBranch, ExternalLink, Mail, FileText, CheckCircle, AlertCircle } from "lucide-react";

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
      const res = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      setStatus(res.ok ? "success" : "error");
      if (res.ok) setForm({ name: "", email: "", subject: "", message: "" });
    } catch { setStatus("error"); }
    setTimeout(() => setStatus("idle"), 4000);
  };

  return (
    <section id="contact" className="relative py-32 px-6 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-950/5 to-transparent pointer-events-none" />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-96 h-96 rounded-full opacity-5" style={{ background: "radial-gradient(circle, #00d4ff, transparent)" }} />
      </div>

      <div ref={ref} className="max-w-6xl mx-auto">
        {/* Header — Final Mission style */}
        <motion.div className="mb-16 text-center" initial={{ opacity: 0, y: 40 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7 }}>
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="glow-line w-16" />
            <span className="text-xs font-mono text-cyan-400 tracking-widest uppercase">Final Mission</span>
            <div className="glow-line w-16" />
          </div>
          <div className="inline-block px-4 py-1.5 rounded-full border border-cyan-400/20 bg-cyan-400/5 font-mono text-xs text-cyan-400/70 mb-4">
            MISSION COMPLETE — Système exploré
          </div>
          <h2 className="text-4xl md:text-6xl font-black text-white/90 leading-tight mb-3">
            Initiez le <span className="text-gradient-static">contact</span>
          </h2>
          <p className="text-white/40 max-w-xl mx-auto">
            Des systèmes conçus pour analyser, décider et agir. <span className="text-white/60">Si vous cherchez quelqu&apos;un qui pense en systèmes,</span> vous êtes au bon endroit.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Left: links + status */}
          <motion.div className="lg:col-span-2 space-y-4" initial={{ opacity: 0, x: -30 }} animate={isInView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.6, delay: 0.2 }}>

            {/* Status card */}
            <div className="glass rounded-2xl p-5 border border-emerald-400/20">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-400 text-sm font-semibold">Disponible</span>
              </div>
              <p className="text-white/50 text-sm">Ouvert aux opportunités — remote ou hybride Bordeaux / France. Domaines cibles : SWE + AI + Data + Quant.</p>
            </div>

            {/* Links */}
            <div className="space-y-3">
              {[
                { Icon: GitBranch, label: "GitHub", value: "github.com/Beugre", href: "https://github.com/Beugre", color: "text-white/70" },
                { Icon: ExternalLink, label: "LinkedIn", value: "Yoann Beugré", href: "https://www.linkedin.com/in/yoann-beugré-236b20153/", color: "text-blue-400" },
                { Icon: Mail, label: "Email", value: "yoann.beugre1@gmail.com", href: "mailto:yoann.beugre1@gmail.com", color: "text-cyan-400" },
              ].map(({ Icon, label, value, href, color }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-4 glass rounded-xl p-4 border border-white/5 hover:border-white/15 transition-all group">
                  <Icon size={18} className={`${color} flex-shrink-0`} />
                  <div>
                    <div className="text-xs text-white/30 font-mono">{label}</div>
                    <div className="text-sm text-white/60 group-hover:text-white/90 transition-colors">{value}</div>
                  </div>
                </a>
              ))}
            </div>

            {/* CV */}
            <motion.a href="/CV_Yoann_Beugre.pdf" download
              className="flex items-center justify-center gap-3 w-full py-4 rounded-xl border border-violet-400/30 text-violet-300 hover:bg-violet-400/10 transition-all font-medium text-sm group"
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <FileText size={18} />
              Télécharger le CV
              <motion.span animate={{ y: [0, 2, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>↓</motion.span>
            </motion.a>

            {/* Quote */}
            <div className="glass rounded-xl p-4 border border-white/5">
              <p className="text-white/30 text-xs font-mono leading-relaxed">
                &quot;Systems I designed to think, decide and execute.&quot;
                <br /><span className="text-white/20 mt-1 block">— Yoann Beugré</span>
              </p>
            </div>
          </motion.div>

          {/* Form */}
          <motion.div className="lg:col-span-3" initial={{ opacity: 0, x: 30 }} animate={isInView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.6, delay: 0.3 }}>
            <form onSubmit={handleSubmit} className="glass rounded-2xl p-8 border border-white/8 space-y-5">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-xs font-mono text-cyan-400/70 tracking-widest uppercase">Mission Briefing</span>
              </div>
              <div className="grid sm:grid-cols-2 gap-5">
                {[["name", "Nom", "text", "John Doe"], ["email", "Email", "email", "john@company.com"]].map(([k, l, t, p]) => (
                  <div key={k}>
                    <label className="block text-xs font-mono text-white/40 mb-2 uppercase tracking-wider">{l}</label>
                    <input type={t} name={k} value={form[k as keyof typeof form]} onChange={e => setForm(prev => ({ ...prev, [k]: e.target.value }))} required placeholder={p}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-cyan-400/40 focus:bg-white/8 transition-all" />
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-xs font-mono text-white/40 mb-2 uppercase tracking-wider">Sujet</label>
                <input type="text" name="subject" value={form.subject} onChange={e => setForm(prev => ({ ...prev, subject: e.target.value }))} required placeholder="Mission, collaboration, opportunité..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-cyan-400/40 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-mono text-white/40 mb-2 uppercase tracking-wider">Message</label>
                <textarea name="message" value={form.message} onChange={e => setForm(prev => ({ ...prev, message: e.target.value }))} required rows={5} placeholder="Décrivez votre mission ou opportunité..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-cyan-400/40 transition-all resize-none" />
              </div>
              <motion.button type="submit" disabled={status === "loading"} className="w-full py-4 rounded-xl font-semibold text-sm relative overflow-hidden group disabled:opacity-60"
                whileHover={status === "idle" ? { scale: 1.01 } : {}} whileTap={status === "idle" ? { scale: 0.99 } : {}}>
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-violet-500" />
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-violet-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="relative flex items-center justify-center gap-2 text-black font-bold">
                  {status === "loading" ? <><div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />Envoi...</>
                    : status === "success" ? <><CheckCircle size={16} />Message envoyé !</>
                      : status === "error" ? <><AlertCircle size={16} />Erreur — réessayez</>
                        : <><Send size={16} />INITIATE CONTACT</>}
                </span>
              </motion.button>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
