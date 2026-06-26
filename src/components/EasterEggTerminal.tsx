"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Terminal } from "lucide-react";
import { unlockAchievement } from "@/lib/achievements";

interface Line {
  type: "input" | "output" | "error" | "success" | "system";
  text: string;
}

const RESPONSES: Record<string, string[]> = {
  help: [
    "Available commands:",
    "  whoami       — Who is Yoann?",
    "  skills       — Technical skills",
    "  projects     — Current projects",
    "  contact      — Get in touch",
    "  education    — Academic background",
    "  trade        — Launch trading game",
    "  matrix       — ...",
    "  sudo hire-me — 🚀 Make an offer",
    "  clear        — Clear the terminal",
    "  exit         — Close terminal",
  ],
  whoami: [
    "Yoann Beugré",
    "CTO Adjoint → Quant Developer → AI Engineer",
    "Master MIAGE — Université de Bordeaux",
    "14 ans de cours de maths (3ème → L2)",
    "Passionné par les algorithmes, l'IA et la finance quantitative.",
  ],
  skills: [
    "Languages  : Python · TypeScript · JavaScript · Java · SQL · C# · PHP",
    "AI / ML    : LLM · Agents IA · Prompt Engineering · Scikit-learn",
    "Trading    : Binance API · Polymarket · RSI · Price Action · Kelly Criterion",
    "Frontend   : React · Next.js · Tailwind CSS · Framer Motion",
    "Infra      : Docker · Linux · PostgreSQL · Oracle · Firebase",
    "Méthodo    : Scrum Master · Architecture · TDD · CI/CD",
  ],
  projects: [
    "1. Bot Trading Crypto   — RSI · Price Action · Binance API · Telegram",
    "2. Algo Paris Sportifs  — Value bets · Kelly · ML",
    "3. Polymarket Analyzer  — Marchés prédictifs · Automatisation",
    "4. Agents IA            — LLM · LangChain · Workflows",
    "5. SQL Engineering      — Oracle · Optimisation · ETL",
    "",
    "→ See /projects section for full details",
  ],
  contact: [
    "GitHub   : github.com/Beugre",
    "LinkedIn : linkedin.com/in/yoann-beugré-236b20153",
    "Email    : yoann.beugre1@gmail.com",
  ],
  education: [
    "2016 — 2018 | Master 1 & 2 MIAGE — Université de Bordeaux",
    "2012 — 2015 | Licence MIAGE       — Université de Bordeaux",
    "2011 — 2025 | Professeur de Maths — 3ème à L2 (14 ans)",
  ],
  "sudo hire-me": [
    "⚠️  Elevated privileges required.",
    "Authenticating...",
    "████████████████ 100%",
    "✅ Authentication successful.",
    "",
    "🚀 Initiating hire sequence...",
    "",
    "→ Send your best offer to: yoann.beugre1@gmail.com",
    "→ LinkedIn: linkedin.com/in/yoann-beugré-236b20153",
    "",
    "💡 Tip: Mention 'terminal' in your message for extra points.",
  ],
  matrix: [
    "Initiating matrix protocol...",
    "Wake up, Neo.",
    "Follow the white rabbit. 🐇",
  ],
  trade: [
    "Launching trading game...",
    "→ Scroll to the 'Trade Like Me' section",
    "→ Can you beat my algorithm?",
  ],
  clear: [],
  exit: ["Closing terminal..."],
};

const EASTER_EGGS: Record<string, string[]> = {
  konami: ["↑↑↓↓←→←→BA — Easter egg unlocked! 🎮", "You know your stuff. I like that."],
  matrix: ["Wake up, Neo...", "The Matrix has you.", "Follow the white rabbit. 🐇"],
  ls: ["drwxr-xr-x  projects/", "drwxr-xr-x  algorithms/", "-rw-r--r--  brain.py", "-rw-r--r--  trading_bot.py", "-rw-r--r--  polymarket_analyzer.py"],
  pwd: ["/home/yoann/systems/intelligent"],
  git: ["git log --oneline", "6319ad4 feat: portfolio initial", "a3f2c1b feat: trading bot v2", "9b1e3d7 feat: polymarket analyzer", "2c4a8f0 feat: AI agents workflow"],
  python: ["Python 3.11.0 — Ready.", ">>> import intelligence", ">>> intelligence.level", "9001"],
};

export default function EasterEggTerminal() {
  const [open, setOpen] = useState(false);
  const [lines, setLines] = useState<Line[]>([
    { type: "system", text: "Yoann Beugré Terminal v1.0.0" },
    { type: "system", text: 'Type "help" to see available commands.' },
    { type: "system", text: "" },
  ]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [typing, setTyping] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Open with Ctrl+K or `
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey && e.key === "k") || e.key === "`") {
        e.preventDefault();
        setOpen((o) => {
          if (!o) unlockAchievement("TERMINAL");
          return !o;
        });
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  const typeLines = useCallback((newLines: string[], type: Line["type"] = "output") => {
    setTyping(true);
    let i = 0;
    const next = () => {
      if (i >= newLines.length) { setTyping(false); return; }
      const text = newLines[i];
      setLines((prev) => [...prev, { type, text }]);
      i++;
      setTimeout(next, text === "" ? 50 : 60 + Math.random() * 40);
    };
    next();
  }, []);

  const runCommand = useCallback((cmd: string) => {
    const trimmed = cmd.trim().toLowerCase();
    setLines((prev) => [...prev, { type: "input", text: `> ${cmd}` }]);
    setHistory((h) => [cmd, ...h.slice(0, 49)]);
    setHistoryIdx(-1);

    if (trimmed === "clear") {
      setLines([{ type: "system", text: 'Terminal cleared. Type "help" for commands.' }]);
      return;
    }
    if (trimmed === "exit") {
      typeLines(["Goodbye! 👋"], "success");
      setTimeout(() => setOpen(false), 800);
      return;
    }

    const response = RESPONSES[trimmed] ?? EASTER_EGGS[trimmed];
    if (response) {
      if (trimmed === "sudo hire-me") {
        typeLines(response, "success");
      } else if (trimmed === "matrix") {
        typeLines(response, "output");
        unlockAchievement("MATRIX");
        setTimeout(() => window.dispatchEvent(new Event("matrixStart")), 800);
      } else if (trimmed === "trade") {
        typeLines(response, "output");
        setTimeout(() => {
          setOpen(false);
          document.querySelector("#trade")?.scrollIntoView({ behavior: "smooth" });
        }, 1200);
      } else {
        typeLines(response, "output");
      }
    } else {
      typeLines([`command not found: ${cmd}`, 'Type "help" to see available commands.'], "error");
    }
  }, [typeLines]);

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && input.trim() && !typing) {
      runCommand(input);
      setInput("");
    }
    if (e.key === "ArrowUp") {
      const idx = Math.min(historyIdx + 1, history.length - 1);
      setHistoryIdx(idx);
      setInput(history[idx] ?? "");
    }
    if (e.key === "ArrowDown") {
      const idx = Math.max(historyIdx - 1, -1);
      setHistoryIdx(idx);
      setInput(idx === -1 ? "" : history[idx]);
    }
  };

  const colorClass: Record<Line["type"], string> = {
    input: "text-cyan-400",
    output: "text-white/70",
    error: "text-red-400",
    success: "text-emerald-400",
    system: "text-violet-400",
  };

  return (
    <>
      {/* Floating hint badge */}
      <AnimatePresence>
        {!open && (
          <motion.button
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-3 py-2 glass border border-white/10 rounded-xl text-xs font-mono text-white/40 hover:text-white/80 hover:border-white/20 transition-all"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ delay: 2 }}
            onClick={() => { setOpen(true); unlockAchievement("TERMINAL"); }}
            title="Open terminal"
          >
            <Terminal size={13} />
            <span className="hidden sm:inline">ctrl+k</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Terminal modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />

            {/* Terminal window */}
            <motion.div
              className="relative w-full max-w-2xl glass border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Title bar */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/8 bg-white/[0.02]">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  <span className="ml-2 text-white/30 text-xs font-mono">yoann@portfolio:~</span>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="text-white/30 hover:text-white/70 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Output */}
              <div className="h-80 overflow-y-auto p-4 space-y-1 font-mono text-xs">
                {lines.map((line, i) => (
                  <div key={i} className={colorClass[line.type]}>
                    {line.text || "\u00a0"}
                  </div>
                ))}
                {typing && (
                  <div className="text-white/40 animate-pulse">█</div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="flex items-center gap-2 px-4 py-3 border-t border-white/8 bg-white/[0.02]">
                <span className="text-cyan-400 font-mono text-xs flex-shrink-0">{">"}</span>
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  disabled={typing}
                  placeholder={typing ? "" : "type a command..."}
                  className="flex-1 bg-transparent font-mono text-xs text-white/80 outline-none placeholder:text-white/20"
                  autoComplete="off"
                  spellCheck={false}
                />
                {typing && <div className="w-2 h-3 bg-cyan-400 animate-pulse" />}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
