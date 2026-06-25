"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useEffect, useState } from "react";
import { Menu, X, Search } from "lucide-react";

const NAV_LINKS = [
  { label: "Core",     id: "about",         system: "Memory Core" },
  { label: "Matrix",   id: "expertise",     system: "Skill Matrix" },
  { label: "Lab",      id: "projects",      system: "Research Lab" },
  { label: "Timeline", id: "experience",    system: "Career Timeline" },
  { label: "Graph",    id: "architecture",  system: "System Graph" },
  { label: "Vault",    id: "github",        system: "Source Vault" },
  { label: "Mission",  id: "contact",       system: "Final Mission" },
];

const PALETTE_CMDS = [
  { icon: "📈", label: "Go to Trading Challenge", action: () => document.querySelector("#trade")?.scrollIntoView({ behavior: "smooth" }) },
  { icon: "🤖", label: "Open AI Assistant",       action: () => (window as unknown as { __openAI?: () => void }).__openAI?.() },
  { icon: "🔬", label: "Show Research Lab",       action: () => document.querySelector("#projects")?.scrollIntoView({ behavior: "smooth" }) },
  { icon: "📊", label: "Skill Matrix",            action: () => document.querySelector("#expertise")?.scrollIntoView({ behavior: "smooth" }) },
  { icon: "🗺️", label: "System Graph",            action: () => document.querySelector("#architecture")?.scrollIntoView({ behavior: "smooth" }) },
  { icon: "🎮", label: "BTC Prediction Challenge",action: () => document.querySelector("#trade")?.scrollIntoView({ behavior: "smooth" }) },
  { icon: "🏗️", label: "Build The Bot",           action: () => document.querySelector("#buildbot")?.scrollIntoView({ behavior: "smooth" }) },
  { icon: "🐛", label: "Debug The System",        action: () => document.querySelector("#debug")?.scrollIntoView({ behavior: "smooth" }) },
  { icon: "📩", label: "Contact Yoann",           action: () => document.querySelector("#contact")?.scrollIntoView({ behavior: "smooth" }) },
  { icon: "🌐", label: "Open GitHub",             action: () => window.open("https://github.com/Beugre", "_blank") },
  { icon: "💼", label: "Open LinkedIn",           action: () => window.open("https://www.linkedin.com/in/yoann-beugré-236b20153/", "_blank") },
  { icon: "🔃", label: "Restart Mission",         action: () => { sessionStorage.removeItem("boot_seen"); window.location.reload(); } },
  { icon: "🟢", label: "Toggle Matrix Mode",      action: () => window.dispatchEvent(new Event("matrixStart")) },
];

export default function Navigation() {
  const { scrollY } = useScroll();
  const bgOpacity = useTransform(scrollY, [0, 100], [0, 1]);
  const [isOpen, setIsOpen] = useState(false);
  const [active, setActive] = useState("");
  const [palette, setPalette] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id); }),
      { threshold: 0.4 }
    );
    NAV_LINKS.forEach(l => { const el = document.getElementById(l.id); if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") { e.preventDefault(); setPalette(p => !p); }
      if (e.key === "Escape") { setPalette(false); setIsOpen(false); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const scrollTo = (id: string) => {
    setIsOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const filtered = PALETTE_CMDS.filter(c =>
    !query || c.label.toLowerCase().includes(query.toLowerCase())
  );

  const execCmd = (cmd: typeof PALETTE_CMDS[0]) => {
    cmd.action(); setPalette(false); setQuery("");
  };

  return (
    <>
      <motion.nav className="fixed top-0 left-0 right-0 z-50">
        <motion.div className="absolute inset-0 border-b border-white/5"
          style={{ opacity: bgOpacity, backgroundColor: "rgba(3,7,18,0.9)", backdropFilter: "blur(20px)" }} />

        <div className="relative max-w-7xl mx-auto px-6 flex items-center justify-between h-14">
          {/* Logo */}
          <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} style={{ cursor: "pointer" }}
            className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-400 to-violet-600 flex items-center justify-center font-mono font-bold text-xs text-black">◈</div>
            <span className="font-mono text-xs text-white/50 group-hover:text-white/90 transition-colors hidden sm:block">YOANN.CORE</span>
          </button>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-0.5">
            {NAV_LINKS.map(link => (
              <button key={link.id} type="button" onClick={() => scrollTo(link.id)} style={{ cursor: "pointer" }}
                className={`relative px-3 py-2 text-xs rounded-lg transition-all font-mono group ${active === link.id ? "text-cyan-400 bg-cyan-400/8" : "text-white/40 hover:text-white/80 hover:bg-white/4"}`}>
                {link.label}
                {/* Tooltip */}
                <span className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 px-2 py-0.5 bg-black/80 border border-white/10 rounded text-[9px] font-mono text-white/50 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                  {link.system}
                </span>
              </button>
            ))}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Command Palette trigger */}
            <button type="button" onClick={() => setPalette(true)} style={{ cursor: "pointer" }}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 text-white/30 hover:text-white/70 hover:border-white/20 transition-all text-xs font-mono">
              <Search size={12} />
              <span className="hidden lg:block">Ctrl+K</span>
            </button>
            {/* Mobile toggle */}
            <button type="button" className="md:hidden text-white/60 hover:text-white" onClick={() => setIsOpen(!isOpen)} style={{ cursor: "pointer" }}>
              {isOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile menu */}
      {isOpen && (
        <motion.div className="fixed inset-0 z-40 bg-[#030712]/96 backdrop-blur-xl md:hidden"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="flex flex-col items-center justify-center h-full gap-5">
            {NAV_LINKS.map((link, i) => (
              <motion.button key={link.id} type="button" onClick={() => scrollTo(link.id)} style={{ cursor: "pointer" }}
                className="text-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <div className="text-xl font-black text-white/80 hover:text-white">{link.label}</div>
                <div className="text-xs font-mono text-white/25">{link.system}</div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Command Palette */}
      {palette && (
        <motion.div className="fixed inset-0 z-[180] flex items-start justify-center pt-24 px-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => { setPalette(false); setQuery(""); }}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div className="relative w-full max-w-lg glass border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
            initial={{ scale: 0.95, y: -10 }} animate={{ scale: 1, y: 0 }}
            onClick={e => e.stopPropagation()}>
            {/* Search */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/8">
              <Search size={16} className="text-white/30 flex-shrink-0" />
              <input autoFocus type="text" value={query} onChange={e => setQuery(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && filtered.length > 0) execCmd(filtered[0]); }}
                placeholder="Chercher une commande..." className="flex-1 bg-transparent text-sm text-white/80 placeholder:text-white/25 outline-none font-mono" />
              <span className="text-[10px] font-mono text-white/20 border border-white/10 px-1.5 py-0.5 rounded">ESC</span>
            </div>

            {/* Commands */}
            <div className="max-h-80 overflow-y-auto py-2">
              {filtered.length === 0 ? (
                <div className="px-4 py-8 text-center text-white/30 text-sm font-mono">Aucune commande trouvée</div>
              ) : filtered.map((cmd, i) => (
                <button key={i} type="button" onClick={() => execCmd(cmd)} style={{ cursor: "pointer" }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors group text-left">
                  <span className="text-lg flex-shrink-0">{cmd.icon}</span>
                  <span className="text-sm text-white/65 group-hover:text-white/90 font-mono transition-colors">{cmd.label}</span>
                  <span className="ml-auto text-[10px] font-mono text-white/20 border border-white/8 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">↵</span>
                </button>
              ))}
            </div>

            <div className="px-4 py-2 border-t border-white/5 text-[10px] font-mono text-white/20 flex gap-4">
              <span>↑↓ Naviguer</span><span>↵ Sélectionner</span><span>Échap Fermer</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </>
  );
}
