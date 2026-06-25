"use client";

import { useRef, useEffect, useCallback } from "react";
import { motion, useInView } from "framer-motion";

interface Node {
    id: string;
    label: string;
    x: number;
    y: number;
    color: string;
    size: number;
    category: string;
}

interface Edge {
    from: string;
    to: string;
    color: string;
    animated?: boolean;
}

const NODES: Node[] = [
    // Core
    { id: "python", label: "Python", x: 50, y: 50, color: "#3b82f6", size: 14, category: "core" },
    // Trading
    { id: "binance", label: "Binance API", x: 20, y: 30, color: "#f59e0b", size: 11, category: "trading" },
    { id: "bot", label: "Trading Bot", x: 15, y: 55, color: "#00d4ff", size: 13, category: "trading" },
    { id: "websocket", label: "WebSocket", x: 25, y: 75, color: "#06b6d4", size: 10, category: "trading" },
    { id: "telegram", label: "Telegram", x: 5, y: 42, color: "#3b82f6", size: 9, category: "notify" },
    // Data
    { id: "firebase", label: "Firebase", x: 35, y: 20, color: "#f97316", size: 10, category: "db" },
    { id: "postgres", label: "PostgreSQL", x: 65, y: 20, color: "#64748b", size: 10, category: "db" },
    { id: "oracle", label: "Oracle", x: 80, y: 30, color: "#ef4444", size: 10, category: "db" },
    // AI
    { id: "llm", label: "LLM", x: 75, y: 55, color: "#8b5cf6", size: 13, category: "ai" },
    { id: "agents", label: "AI Agents", x: 85, y: 42, color: "#a78bfa", size: 11, category: "ai" },
    { id: "ml", label: "ML Models", x: 90, y: 65, color: "#7c3aed", size: 10, category: "ai" },
    // Polymarket
    { id: "polymarket", label: "Polymarket", x: 55, y: 78, color: "#10b981", size: 12, category: "quant" },
    { id: "dashboard", label: "Dashboard", x: 40, y: 85, color: "#6366f1", size: 9, category: "ui" },
    { id: "streamlit", label: "Streamlit", x: 30, y: 92, color: "#f43f5e", size: 9, category: "ui" },
];

const EDGES: Edge[] = [
    { from: "python", to: "bot", color: "#00d4ff", animated: true },
    { from: "python", to: "llm", color: "#8b5cf6", animated: true },
    { from: "python", to: "polymarket", color: "#10b981", animated: true },
    { from: "binance", to: "bot", color: "#f59e0b" },
    { from: "bot", to: "websocket", color: "#06b6d4" },
    { from: "bot", to: "telegram", color: "#3b82f6" },
    { from: "bot", to: "firebase", color: "#f97316" },
    { from: "python", to: "postgres", color: "#64748b" },
    { from: "python", to: "oracle", color: "#ef4444" },
    { from: "llm", to: "agents", color: "#a78bfa", animated: true },
    { from: "llm", to: "ml", color: "#7c3aed" },
    { from: "polymarket", to: "firebase", color: "#10b981" },
    { from: "polymarket", to: "telegram", color: "#10b981" },
    { from: "bot", to: "dashboard", color: "#6366f1" },
    { from: "dashboard", to: "streamlit", color: "#f43f5e" },
];

export default function ArchitectureSection() {
    const ref = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isInView = useInView(ref, { once: true, amount: 0.2 });
    const animRef = useRef<number>(0);
    const offsetRef = useRef(0);

    const drawGraph = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const W = canvas.width;
        const H = canvas.height;

        ctx.clearRect(0, 0, W, H);
        offsetRef.current += 0.01;

        // Map percentages to canvas coords
        const toX = (pct: number) => (pct / 100) * W;
        const toY = (pct: number) => (pct / 100) * H;

        // Draw edges
        EDGES.forEach((edge) => {
            const fromNode = NODES.find((n) => n.id === edge.from);
            const toNode = NODES.find((n) => n.id === edge.to);
            if (!fromNode || !toNode) return;

            const x1 = toX(fromNode.x);
            const y1 = toY(fromNode.y);
            const x2 = toX(toNode.x);
            const y2 = toY(toNode.y);

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);

            if (edge.animated) {
                const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
                gradient.addColorStop(0, `${edge.color}22`);
                gradient.addColorStop(0.5, `${edge.color}88`);
                gradient.addColorStop(1, `${edge.color}22`);
                ctx.strokeStyle = gradient;
                ctx.lineWidth = 1.5;
            } else {
                ctx.strokeStyle = `${edge.color}33`;
                ctx.lineWidth = 1;
            }

            ctx.stroke();

            // Animated dot along edge
            if (edge.animated) {
                const t = (offsetRef.current % 1 + 0.3 * EDGES.indexOf(edge)) % 1;
                const px = x1 + (x2 - x1) * t;
                const py = y1 + (y2 - y1) * t;

                ctx.beginPath();
                ctx.arc(px, py, 2.5, 0, Math.PI * 2);
                ctx.fillStyle = edge.color;
                ctx.shadowBlur = 8;
                ctx.shadowColor = edge.color;
                ctx.fill();
                ctx.shadowBlur = 0;
            }
        });

        // Draw nodes
        NODES.forEach((node) => {
            const x = toX(node.x);
            const y = toY(node.y);
            const s = node.size;

            // Glow
            ctx.beginPath();
            ctx.arc(x, y, s * 2, 0, Math.PI * 2);
            const glow = ctx.createRadialGradient(x, y, 0, x, y, s * 2);
            glow.addColorStop(0, `${node.color}22`);
            glow.addColorStop(1, "transparent");
            ctx.fillStyle = glow;
            ctx.fill();

            // Border circle
            ctx.beginPath();
            ctx.arc(x, y, s, 0, Math.PI * 2);
            ctx.strokeStyle = `${node.color}88`;
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Inner fill
            ctx.beginPath();
            ctx.arc(x, y, s * 0.7, 0, Math.PI * 2);
            ctx.fillStyle = `${node.color}33`;
            ctx.fill();

            // Label
            ctx.font = `bold ${Math.max(9, s * 0.75)}px 'JetBrains Mono', monospace`;
            ctx.fillStyle = "rgba(255,255,255,0.7)";
            ctx.textAlign = "center";
            ctx.fillText(node.label, x, y + s + 12);
        });

        animRef.current = requestAnimationFrame(drawGraph);
    }, []);

    useEffect(() => {
        if (!isInView) return;
        const canvas = canvasRef.current;
        if (!canvas) return;

        const resize = () => {
            const parent = canvas.parentElement;
            if (!parent) return;
            canvas.width = parent.clientWidth;
            canvas.height = parent.clientHeight;
        };
        resize();
        window.addEventListener("resize", resize);

        drawGraph();

        return () => {
            window.removeEventListener("resize", resize);
            cancelAnimationFrame(animRef.current);
        };
    }, [isInView, drawGraph]);

    return (
        <section id="architecture" className="relative py-32 px-6 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-950/5 to-transparent" />

            <div ref={ref} className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    className="mb-16"
                    initial={{ opacity: 0, y: 40 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.7 }}
                >
                    <div className="flex items-center gap-4 mb-4">
                        <div className="glow-line w-16" />
                        <span className="text-xs font-mono text-cyan-400 tracking-widest uppercase">
                            05 / Architecture
                        </span>
                    </div>
                    <h2 className="text-4xl md:text-6xl font-black text-white/90 leading-tight">
                        Mes systèmes,{" "}
                        <span className="text-gradient-static">en action</span>
                    </h2>
                    <p className="mt-4 text-white/40 max-w-2xl">
                        Visualisation en temps réel des flux de données entre les composants
                        de mes projets principaux.
                    </p>
                </motion.div>

                {/* Canvas container */}
                <motion.div
                    className="relative glass rounded-2xl border border-white/8 overflow-hidden"
                    style={{ height: "520px" }}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={isInView ? { opacity: 1, scale: 1 } : {}}
                    transition={{ duration: 0.7, delay: 0.2 }}
                >
                    <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

                    {/* Legend */}
                    <div className="absolute top-4 right-4 glass rounded-xl p-3 border border-white/8 space-y-1.5">
                        {[
                            { color: "#f59e0b", label: "Trading" },
                            { color: "#8b5cf6", label: "AI / LLM" },
                            { color: "#10b981", label: "Prédiction" },
                            { color: "#3b82f6", label: "Infrastructure" },
                        ].map((item) => (
                            <div key={item.label} className="flex items-center gap-2">
                                <div
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: item.color }}
                                />
                                <span className="text-[10px] font-mono text-white/40">
                                    {item.label}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Title overlay */}
                    <div className="absolute top-4 left-4">
                        <span className="text-xs font-mono text-white/20">
                            live • system architecture
                        </span>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
