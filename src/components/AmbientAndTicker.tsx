"use client";

import { useEffect, useRef, useState } from "react";

// Gymnopedie No.1 — Erik Satie (1888) — domaine public absolu
// Notes en Hz, durée en secondes
const GYMNOPEDIE: [number, number][] = [
  // Mélodie principale (simplifiée, mesures 1-8)
  [329.63,1.5],[293.66,0.75],[261.63,0.75], // E4 D4 C4
  [293.66,1.5],[261.63,0.75],[246.94,0.75], // D4 C4 B3
  [261.63,1.5],[246.94,0.75],[220.00,0.75], // C4 B3 A3
  [246.94,1.5],[220.00,0.75],[196.00,0.75], // B3 A3 G3
  [220.00,1.5],[196.00,0.75],[174.61,0.75], // A3 G3 F3
  [196.00,2.0],[0,1.0],                     // G3 rest
  [261.63,1.5],[293.66,0.75],[329.63,0.75], // C4 D4 E4
  [293.66,1.5],[329.63,0.75],[349.23,0.75], // D4 E4 F4
  [329.63,2.5],[0,1.5],                     // E4 rest
];

// Accompagnement basse (waltz 3/4)
const BASS: [number,number][] = [
  [65.41,0.5],[0,2.5], // C2
  [73.42,0.5],[0,2.5], // D2
  [65.41,0.5],[0,2.5],
  [73.42,0.5],[0,2.5],
  [55.00,0.5],[0,2.5], // A1
  [65.41,0.5],[0,2.5],
  [65.41,0.5],[0,2.5],
  [73.42,0.5],[0,2.5],
];

class AmbientEngine {
    private ctx: AudioContext | null = null;
    private running = false;
    private noteIdx = 0;
    private bassIdx = 0;

    private playNote(freq: number, dur: number, vol: number, type: OscillatorType = "sine") {
        const ctx = this.ctx!;
        if (freq === 0) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        // Soft reverb via convolver-like approach with delay
        const delay = ctx.createDelay(0.4);
        delay.delayTime.value = 0.25;
        const delayGain = ctx.createGain();
        delayGain.gain.value = 0.18;
        osc.connect(gain); gain.connect(ctx.destination);
        gain.connect(delay); delay.connect(delayGain); delayGain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = type;
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.04);
        gain.gain.setValueAtTime(vol, ctx.currentTime + dur * 0.7);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + dur);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + dur + 0.1);
    }

    private scheduleNext() {
        if (!this.running || !this.ctx) return;
        const [freq, dur] = GYMNOPEDIE[this.noteIdx % GYMNOPEDIE.length];
        const [bassFreq, bassDur] = BASS[this.bassIdx % BASS.length];
        this.playNote(freq, dur, 0.06, "sine");
        this.playNote(bassFreq, bassDur, 0.04, "sine");
        this.noteIdx++;
        this.bassIdx++;
        setTimeout(() => this.scheduleNext(), dur * 1000);
    }

    start() {
        if (this.running) return;
        try {
            this.ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
            this.running = true;
            this.noteIdx = 0; this.bassIdx = 0;
            this.scheduleNext();
        } catch { /* noop */ }
    }

    stop() {
        this.running = false;
        this.ctx?.close();
        this.ctx = null;
    }
}

const engine = new AmbientEngine();

export function AmbientSoundToggle() {
    const [on, setOn] = useState(false);

    const toggle = () => {
        if (on) { engine.stop(); setOn(false); }
        else { engine.start(); setOn(true); }
    };

    return (
        <button
            type="button"
            onClick={toggle}
            title={on ? "Couper la musique (Gymnopedie — Satie)" : "Activer la musique (Gymnopedie — Satie)"}
            className="fixed bottom-[52px] right-4 z-[120] w-9 h-9 glass border border-white/10 rounded-xl flex items-center justify-center transition-all hover:border-white/25"
            style={{ cursor: "pointer", color: on ? "#00d4ff" : "rgba(255,255,255,0.3)" }}
        >
            {on ? "🔊" : "🔇"}
        </button>
    );
}

// Bloomberg-style live ticker
const TICKER_ITEMS = [
    { label: "BTC/USDT", value: "", change: "", live: true },
    { label: "ALGO RUNNING", value: "RSI+PA", change: "ACTIVE", color: "#10b981" },
    { label: "BOTS DEPLOYED", value: "5", change: "24/7", color: "#00d4ff" },
    { label: "ETH/USDT", value: "", change: "", live: true, sym: "ETHUSDT" },
    { label: "WIN RATE", value: "68%", change: "+2.1%", color: "#10b981" },
    { label: "TRADES TODAY", value: "14", change: "+3", color: "#f0b90b" },
    { label: "POLYMARKET", value: "ACTIVE", change: "LIVE", color: "#8b5cf6" },
    { label: "SQL QUERIES", value: "1,205,112", change: "OPT", color: "#00d4ff" },
    { label: "AI AGENTS", value: "5", change: "DEPLOYED", color: "#a78bfa" },
];

function useLivePrice(sym: string) {
    const [price, setPrice] = useState<string>("");
    const [change, setChange] = useState<string>("");
    const wsRef = useRef<WebSocket | null>(null);
    const fallbackRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        let base = sym === "BTCUSDT" ? 59400 : 3200;
        let prev = base;

        const connect = () => {
            try {
                const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${sym.toLowerCase()}@miniTicker`);
                wsRef.current = ws;
                ws.onmessage = (e) => {
                    try {
                        const d = JSON.parse(e.data);
                        const cur = parseFloat(d.c);
                        const open = parseFloat(d.o);
                        const pct = ((cur - open) / open) * 100;
                        setPrice(cur.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ","));
                        setChange(`${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`);
                    } catch { /* noop */ }
                };
                ws.onerror = () => startFallback();
                ws.onclose = () => { if (fallbackRef.current === null) startFallback(); };
            } catch { startFallback(); }
        };

        const startFallback = () => {
            if (fallbackRef.current) return;
            fallbackRef.current = setInterval(() => {
                const change = (Math.random() - 0.48) * (sym === "BTCUSDT" ? 80 : 8);
                base = Math.max(base * 0.85, base + change);
                const pct = ((base - prev) / prev) * 100;
                setPrice(base.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ","));
                setChange(`${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`);
                prev = base;
            }, 3000);
        };

        connect();

        return () => {
            wsRef.current?.close();
            if (fallbackRef.current) clearInterval(fallbackRef.current);
            fallbackRef.current = null;
        };
    }, [sym]);

    return { price, change };
}

function LivePriceItem({ label, sym }: { label: string; sym: string }) {
    const { price, change } = useLivePrice(sym);
    const up = !change.startsWith("-");
    return (
        <>
            <span style={{ color: "rgba(255,255,255,0.45)", marginRight: 6 }}>{label}</span>
            <span style={{ color: up ? "#10b981" : "#ef4444", fontWeight: 700 }}>
                {price ? `$${price}` : "···"}
            </span>
            {change && (
                <span style={{ color: up ? "#10b981" : "#ef4444", fontSize: 9, marginLeft: 4 }}>
                    {change}
                </span>
            )}
        </>
    );
}

export function BloombergTicker() {
    const trackRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = trackRef.current;
        if (!el) return;
        let x = 0;
        let raf: number;
        const speed = 0.5;
        const animate = () => {
            x -= speed;
            const half = el.scrollWidth / 2;
            if (Math.abs(x) >= half) x = 0;
            el.style.transform = `translateX(${x}px)`;
            raf = requestAnimationFrame(animate);
        };
        raf = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(raf);
    }, []);

    const items = [...TICKER_ITEMS, ...TICKER_ITEMS]; // duplicate for seamless loop

    return (
        <div
            className="fixed top-14 left-0 right-0 z-[45] overflow-hidden"
            style={{
                background: "rgba(3,7,18,0.92)",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                backdropFilter: "blur(10px)",
                height: 26,
            }}
        >
            <div ref={trackRef} className="flex items-center gap-0 whitespace-nowrap" style={{ display: "inline-flex", willChange: "transform" }}>
                {items.map((item, i) => (
                    <span key={i} className="flex items-center gap-1 text-[10px] font-mono" style={{ padding: "0 20px", borderRight: "1px solid rgba(255,255,255,0.06)", lineHeight: "26px" }}>
                        {item.live ? (
                            <LivePriceItem label={item.label} sym={item.sym || (item.label === "BTC/USDT" ? "BTCUSDT" : "ETHUSDT")} />
                        ) : (
                            <>
                                <span style={{ color: "rgba(255,255,255,0.45)", marginRight: 6 }}>{item.label}</span>
                                <span style={{ color: item.color || "#ffffff", fontWeight: 700 }}>{item.value}</span>
                                {item.change && <span style={{ color: item.color || "#10b981", fontSize: 9, marginLeft: 4 }}>{item.change}</span>}
                            </>
                        )}
                        <span style={{ color: "rgba(0,212,255,0.3)", margin: "0 8px" }}>◆</span>
                    </span>
                ))}
            </div>
        </div>
    );
}
