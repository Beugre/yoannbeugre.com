"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { X, Send, Volume2, VolumeX } from "lucide-react";
import { unlockAchievement } from "@/lib/achievements";

interface Message { role: "user" | "ai"; text: string; }

const SUGGESTIONS = [
  "Pourquoi recruter Yoann ?",
  "Comment fonctionne ton bot Binance ?",
  "Explique-moi Polymarket",
  "Tu es disponible ?",
  "5 raisons de t'appeler",
];

function speak(text: string) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text.slice(0, 200));
  u.lang = "fr-FR"; u.rate = 1.05; u.pitch = 1.0; u.volume = 0.8;
  window.speechSynthesis.speak(u);
}

export default function AIAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [started, setStarted] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const historyRef = useRef<{ role: "user" | "assistant"; content: string }[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, typing]);

  const openChat = () => {
    setOpen(true);
    if (!started) {
      setStarted(true);
      unlockAchievement("AI_CHAT");
      setTimeout(() => {
        setMessages([{ role: "ai", text: "👋 Salut ! Je suis l'IA de Yoann. Posez-moi n'importe quelle question sur son profil, ses projets ou ses compétences. Je suis alimenté par GPT-4o-mini avec son vrai contexte." }]);
      }, 300);
    }
    setTimeout(() => inputRef.current?.focus(), 400);
  };

  const sendMessage = async (text?: string) => {
    const msg = text ?? input.trim();
    if (!msg || typing) return;
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: msg }]);
    setTyping(true);
    historyRef.current = [...historyRef.current, { role: "user", content: msg }];

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: historyRef.current }),
      });
      const data = await res.json();
      const aiText = data.text ?? "Je n'ai pas pu répondre. Réessayez.";
      historyRef.current = [...historyRef.current, { role: "assistant", content: aiText }];
      setMessages(prev => [...prev, { role: "ai", text: aiText }]);
      if (ttsEnabled) speak(aiText);
    } catch {
      setMessages(prev => [...prev, { role: "ai", text: "Erreur de connexion. Réessayez. 🔄" }]);
    } finally {
      setTyping(false);
    }
  };

  return (
    <>
      {/* Floating button — bigger and more visible */}
      <AnimatePresence>
        {!open && (
          <motion.button
            className="fixed bottom-6 left-6 z-[120] flex items-center gap-3 px-4 py-3 rounded-2xl border border-violet-400/30 bg-violet-950/60 backdrop-blur-xl text-sm font-medium shadow-2xl"
            style={{ cursor: "pointer", boxShadow: "0 0 30px rgba(139,92,246,0.25)" }}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ delay: 3 }}
            onClick={openChat}
          >
            <div className="relative flex-shrink-0">
              <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-violet-400/40">
                <Image src="/yoann.jpg" alt="Yoann AI" width={36} height={36} className="object-cover object-top w-full h-full" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#030712]" />
            </div>
            <div className="hidden sm:block">
              <div className="text-white/90 font-semibold leading-none mb-0.5">Ask Yoann AI</div>
              <div className="text-violet-300/70 text-xs font-mono">GPT-4o · Répond maintenant</div>
            </div>
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat modal — larger */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed bottom-6 left-6 z-[130] w-[360px] sm:w-[420px]"
            initial={{ opacity: 0, scale: 0.88, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 20 }}
            transition={{ type: "spring", damping: 22, stiffness: 280 }}
          >
            <div className="glass rounded-2xl border border-violet-400/25 overflow-hidden shadow-2xl flex flex-col" style={{ maxHeight: "560px", boxShadow: "0 0 40px rgba(139,92,246,0.15)" }}>
              {/* Header */}
              <div className="flex items-center gap-3 p-4 border-b border-white/8 bg-violet-500/5 flex-shrink-0">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-violet-400/35">
                    <Image src="/yoann.jpg" alt="Yoann" width={40} height={40} className="object-cover object-top w-full h-full" />
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#030712]" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-white/92">Yoann AI</div>
                  <div className="text-[10px] text-emerald-400 font-mono">en ligne · GPT-4o-mini · contexte complet</div>
                </div>
                <button
                  type="button"
                  onClick={() => setTtsEnabled(v => !v)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                  style={{ cursor: "pointer", color: ttsEnabled ? "#a78bfa" : "rgba(255,255,255,0.3)" }}
                  title={ttsEnabled ? "Désactiver la voix" : "Activer la voix"}
                >
                  {ttsEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
                </button>
                <button type="button" onClick={() => setOpen(false)} className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white/70 transition-colors" style={{ cursor: "pointer" }}>
                  <X size={16} />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
                {messages.map((msg, i) => (
                  <motion.div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <div className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-violet-500/30 text-white/90 rounded-br-sm"
                        : "bg-white/5 border border-white/8 text-white/75 rounded-bl-sm"
                    }`}>
                      {msg.text}
                    </div>
                  </motion.div>
                ))}

                {typing && (
                  <div className="flex justify-start">
                    <div className="bg-white/5 border border-white/8 px-4 py-2.5 rounded-2xl rounded-bl-sm">
                      <div className="flex gap-1.5">
                        {[0,1,2].map(i => (
                          <motion.div key={i} className="w-1.5 h-1.5 bg-violet-400 rounded-full" animate={{ y: [0,-4,0] }} transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }} />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {messages.length <= 1 && !typing && (
                  <div className="space-y-1.5 mt-2">
                    {SUGGESTIONS.map(s => (
                      <button key={s} type="button" onClick={() => sendMessage(s)} style={{ cursor: "pointer" }}
                        className="block w-full text-left text-xs px-3 py-2 rounded-xl border border-white/8 text-white/40 hover:text-white/75 hover:border-violet-400/35 hover:bg-violet-400/5 transition-all">
                        {s}
                      </button>
                    ))}
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="flex items-center gap-2 p-3 border-t border-white/8 flex-shrink-0">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && sendMessage()}
                  placeholder="Posez votre question..."
                  className="flex-1 bg-white/5 border border-white/8 rounded-xl px-3 py-2 text-sm text-white/85 placeholder:text-white/22 outline-none focus:border-violet-400/45 transition-colors"
                />
                <button type="button" onClick={() => sendMessage()} disabled={typing} style={{ cursor: typing ? "not-allowed" : "pointer" }}
                  className="w-9 h-9 rounded-xl bg-violet-500/45 flex items-center justify-center text-violet-200 hover:bg-violet-500/65 transition-colors flex-shrink-0 disabled:opacity-40">
                  <Send size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
