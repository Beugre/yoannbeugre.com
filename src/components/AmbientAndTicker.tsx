"use client";

import { useEffect, useRef, useState } from "react";

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
