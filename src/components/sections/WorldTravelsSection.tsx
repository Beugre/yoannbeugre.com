"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

const CITIES = [
    { name: "Bordeaux", lat: 44.8378, lng: -0.5792, home: true, continent: "EU" },
    { name: "Abidjan", lat: 5.3599, lng: -4.0082, home: true, continent: "AF" },
    { name: "Paris", lat: 48.8566, lng: 2.3522, continent: "EU" },
    { name: "Yamoussoukro", lat: 6.8276, lng: -5.2893, continent: "AF" },
    { name: "Grand Bassam", lat: 5.1966, lng: -3.7377, continent: "AF" },
    { name: "Barcelone", lat: 41.3851, lng: 2.1734, continent: "EU" },
    { name: "Madrid", lat: 40.4168, lng: -3.7038, continent: "EU" },
    { name: "San Sebastián", lat: 43.3183, lng: -1.9812, continent: "EU" },
    { name: "Bilbao", lat: 43.2627, lng: -2.9253, continent: "EU" },
    { name: "Biarritz", lat: 43.4832, lng: -1.5586, continent: "EU" },
    { name: "Toulouse", lat: 43.6047, lng: 1.4442, continent: "EU" },
    { name: "Rennes", lat: 48.1173, lng: -1.6778, continent: "EU" },
    { name: "Poitiers", lat: 46.5802, lng: 0.3404, continent: "EU" },
    { name: "Londres", lat: 51.5074, lng: -0.1278, continent: "EU" },
    { name: "Bruxelles", lat: 50.8503, lng: 4.3517, continent: "EU" },
    { name: "Lausanne", lat: 46.5197, lng: 6.6323, continent: "EU" },
    { name: "Milan", lat: 45.4654, lng: 9.1859, continent: "EU" },
    { name: "Faro", lat: 37.0193, lng: -7.9304, continent: "EU" },
    { name: "Porto", lat: 41.1579, lng: -8.6291, continent: "EU" },
    { name: "Istanbul", lat: 41.0082, lng: 28.9784, continent: "AS" },
    { name: "Dubai", lat: 25.2048, lng: 55.2708, continent: "AS" },
    { name: "Abu Dhabi", lat: 24.4539, lng: 54.3773, continent: "AS" },
    { name: "Singapour", lat: 1.3521, lng: 103.8198, continent: "AS" },
    { name: "Bali", lat: -8.3405, lng: 115.0920, continent: "AS" },
    { name: "New York", lat: 40.7128, lng: -74.0060, continent: "AM" },
    { name: "Toronto", lat: 43.6532, lng: -79.3832, continent: "AM" },
    { name: "Montréal", lat: 45.5017, lng: -73.5673, continent: "AM" },
    { name: "Niagara Falls", lat: 43.0896, lng: -79.0849, continent: "AM" },
    { name: "Marrakech", lat: 31.6295, lng: -7.9811, continent: "AF" },
    { name: "Casablanca", lat: 33.5731, lng: -7.5898, continent: "AF" },
    { name: "Rabat", lat: 34.0209, lng: -6.8416, continent: "AF" },
    { name: "Accra", lat: 5.6037, lng: -0.1870, continent: "AF" },
    { name: "La Réunion", lat: -21.1151, lng: 55.5364, continent: "AF" },
    { name: "Île Maurice", lat: -20.3484, lng: 57.5522, continent: "AF" },
];

const CONTINENT_COLORS: Record<string, string> = {
    EU: "#00d4ff",
    AF: "#f97316",
    AS: "#8b5cf6",
    AM: "#10b981",
};

function latLngToXYZ(lat: number, lng: number, radius: number): [number, number, number] {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);
    return [
        -radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta),
    ];
}

function hexToRgb(hex: string): [number, number, number] {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return [r, g, b];
}

export default function WorldTravelsSection() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [hovered, setHovered] = useState<string | null>(null);
    const rotRef = useRef(0);
    const isDragging = useRef(false);
    const lastX = useRef(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const W = canvas.width;
        const H = canvas.height;
        const R = Math.min(W, H) * 0.38;
        let raf: number;
        let autoRot = true;

        const project = (x: number, y: number, z: number): [number, number, number] => {
            const cosR = Math.cos(rotRef.current);
            const sinR = Math.sin(rotRef.current);
            const rx = x * cosR - z * sinR;
            const rz = x * sinR + z * cosR;
            const scale = (rz + R * 2) / (R * 3);
            return [W / 2 + rx * scale, H / 2 - y * scale, rz];
        };

        const drawGlobe = () => {
            ctx.clearRect(0, 0, W, H);

            // Glow background
            const grad = ctx.createRadialGradient(W / 2, H / 2, R * 0.2, W / 2, H / 2, R * 1.2);
            grad.addColorStop(0, "rgba(0,30,60,0.6)");
            grad.addColorStop(1, "rgba(3,7,18,0)");
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, W, H);

            // Globe sphere
            const sphereGrad = ctx.createRadialGradient(W / 2 - R * 0.2, H / 2 - R * 0.2, R * 0.1, W / 2, H / 2, R);
            sphereGrad.addColorStop(0, "rgba(0,40,80,0.7)");
            sphereGrad.addColorStop(0.5, "rgba(0,20,50,0.85)");
            sphereGrad.addColorStop(1, "rgba(0,5,20,0.9)");
            ctx.beginPath();
            ctx.arc(W / 2, H / 2, R, 0, Math.PI * 2);
            ctx.fillStyle = sphereGrad;
            ctx.fill();

            // Grid lines (latitude)
            for (let lat = -60; lat <= 60; lat += 30) {
                ctx.beginPath();
                let first = true;
                for (let lng = -180; lng <= 180; lng += 5) {
                    const [x, y, z] = latLngToXYZ(lat, lng, R);
                    const [px, py, pz] = project(x, y, z);
                    if (pz > -R * 0.5) {
                        if (first) { ctx.moveTo(px, py); first = false; }
                        else ctx.lineTo(px, py);
                    } else first = true;
                }
                ctx.strokeStyle = "rgba(0,212,255,0.08)";
                ctx.lineWidth = 0.5;
                ctx.stroke();
            }

            // Grid lines (longitude)
            for (let lng = -180; lng < 180; lng += 30) {
                ctx.beginPath();
                let first = true;
                for (let lat = -90; lat <= 90; lat += 5) {
                    const [x, y, z] = latLngToXYZ(lat, lng, R);
                    const [px, py, pz] = project(x, y, z);
                    if (pz > -R * 0.5) {
                        if (first) { ctx.moveTo(px, py); first = false; }
                        else ctx.lineTo(px, py);
                    } else first = true;
                }
                ctx.strokeStyle = "rgba(0,212,255,0.06)";
                ctx.lineWidth = 0.5;
                ctx.stroke();
            }

            // City dots
            const projected = CITIES.map(city => {
                const [x, y, z] = latLngToXYZ(city.lat, city.lng, R);
                const [px, py, pz] = project(x, y, z);
                const visible = pz > -R * 0.3;
                const depth = (pz + R) / (2 * R);
                return { ...city, px, py, pz, visible, depth };
            }).sort((a, b) => a.pz - b.pz);

            // Draw arcs between key cities
            const arcPairs = [
                ["Bordeaux", "Abidjan"],
                ["Bordeaux", "New York"],
                ["Bordeaux", "Dubai"],
                ["Abidjan", "Accra"],
                ["Dubai", "Singapour"],
                ["New York", "Toronto"],
            ];
            for (const [src, dst] of arcPairs) {
                const a = projected.find(c => c.name === src);
                const b = projected.find(c => c.name === dst);
                if (!a || !b || !a.visible || !b.visible) continue;
                const mx = (a.px + b.px) / 2;
                const my = (a.py + b.py) / 2 - Math.abs(a.px - b.px) * 0.3;
                ctx.beginPath();
                ctx.moveTo(a.px, a.py);
                ctx.quadraticCurveTo(mx, my, b.px, b.py);
                ctx.strokeStyle = "rgba(0,212,255,0.2)";
                ctx.lineWidth = 0.8;
                ctx.setLineDash([4, 6]);
                ctx.stroke();
                ctx.setLineDash([]);
            }

            // Draw city dots
            for (const city of projected) {
                if (!city.visible) continue;
                const col = CONTINENT_COLORS[city.continent] || "#00d4ff";
                const r = city.home ? 7 : 4;
                const alpha = 0.4 + city.depth * 0.6;

                // Glow
                if (city.home) {
                    const [rr, gg, bb] = hexToRgb(col);
                    const glow = ctx.createRadialGradient(city.px, city.py, 0, city.px, city.py, 18);
                    glow.addColorStop(0, `rgba(${rr * 255},${gg * 255},${bb * 255},0.35)`);
                    glow.addColorStop(1, "rgba(0,0,0,0)");
                    ctx.fillStyle = glow;
                    ctx.beginPath();
                    ctx.arc(city.px, city.py, 18, 0, Math.PI * 2);
                    ctx.fill();
                }

                ctx.beginPath();
                ctx.arc(city.px, city.py, r, 0, Math.PI * 2);
                const [rr, gg, bb] = hexToRgb(col);
                ctx.fillStyle = `rgba(${rr * 255},${gg * 255},${bb * 255},${alpha})`;
                ctx.fill();

                if (city.home) {
                    ctx.strokeStyle = "rgba(255,255,255,0.8)";
                    ctx.lineWidth = 1.5;
                    ctx.stroke();
                }
            }

            // Globe rim
            ctx.beginPath();
            ctx.arc(W / 2, H / 2, R, 0, Math.PI * 2);
            const rim = ctx.createLinearGradient(W / 2 - R, H / 2, W / 2 + R, H / 2);
            rim.addColorStop(0, "rgba(0,212,255,0.15)");
            rim.addColorStop(0.5, "rgba(0,212,255,0.05)");
            rim.addColorStop(1, "rgba(139,92,246,0.15)");
            ctx.strokeStyle = rim;
            ctx.lineWidth = 1.5;
            ctx.stroke();

            if (autoRot) rotRef.current += 0.003;
            raf = requestAnimationFrame(drawGlobe);
        };

        drawGlobe();

        // Mouse interactions
        const onDown = (e: MouseEvent) => { isDragging.current = true; lastX.current = e.clientX; autoRot = false; };
        const onUp = () => { isDragging.current = false; setTimeout(() => { autoRot = true; }, 2000); };
        const onMove = (e: MouseEvent) => {
            if (!isDragging.current) return;
            rotRef.current += (e.clientX - lastX.current) * 0.005;
            lastX.current = e.clientX;

            const rect = canvas.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;
            const projected = CITIES.map(city => {
                const [x, y, z] = latLngToXYZ(city.lat, city.lng, R);
                const [px, py, pz] = project(x, y, z);
                return { ...city, px, py, pz };
            });
            const hit = projected.find(c => Math.hypot(c.px - mx, c.py - my) < 10 && c.pz > -R * 0.3);
            setHovered(hit ? hit.name : null);
        };
        const onHover = (e: MouseEvent) => {
            if (isDragging.current) return;
            const rect = canvas.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;
            const projected = CITIES.map(city => {
                const [x, y, z] = latLngToXYZ(city.lat, city.lng, R);
                const [px, py, pz] = project(x, y, z);
                return { ...city, px, py, pz };
            });
            const hit = projected.find(c => Math.hypot(c.px - mx, c.py - my) < 10 && c.pz > -R * 0.3);
            setHovered(hit ? hit.name : null);
        };

        canvas.addEventListener("mousedown", onDown);
        canvas.addEventListener("mouseup", onUp);
        canvas.addEventListener("mousemove", onMove);
        canvas.addEventListener("mousemove", onHover);

        return () => {
            cancelAnimationFrame(raf);
            canvas.removeEventListener("mousedown", onDown);
            canvas.removeEventListener("mouseup", onUp);
            canvas.removeEventListener("mousemove", onMove);
            canvas.removeEventListener("mousemove", onHover);
        };
    }, []);

    const continentStats = [
        { label: "Europe", count: CITIES.filter(c => c.continent === "EU").length, color: "#00d4ff" },
        { label: "Afrique", count: CITIES.filter(c => c.continent === "AF").length, color: "#f97316" },
        { label: "Asie", count: CITIES.filter(c => c.continent === "AS").length, color: "#8b5cf6" },
        { label: "Amériques", count: CITIES.filter(c => c.continent === "AM").length, color: "#10b981" },
    ];

    return (
        <section id="travels" className="relative py-16 md:py-32 px-4 md:px-6 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-950/5 to-transparent pointer-events-none" />
            <div className="max-w-7xl mx-auto">
                <motion.div className="mb-12 text-center"
                    initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.7 }}>
                    <div className="flex items-center justify-center gap-4 mb-4">
                        <div className="glow-line w-16" />
                        <span className="text-xs font-mono text-cyan-400 tracking-widest uppercase">08 / World Map</span>
                        <div className="glow-line w-16" />
                    </div>
                    <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-white/90 leading-tight mb-4">
                        Le monde comme <span className="text-gradient-static">terrain de jeu</span>
                    </h2>
                    <p className="text-white/40 max-w-xl mx-auto text-sm">
                        {CITIES.length} villes · 4 continents · Entre <span className="text-orange-400">Bordeaux</span> et <span className="text-orange-400">Abidjan</span>
                    </p>
                </motion.div>

                <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10"
                    initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.2 }}>
                    {continentStats.map(s => (
                        <div key={s.label} className="glass rounded-xl p-4 text-center border border-white/5">
                            <div className="text-3xl font-black mb-1" style={{ color: s.color }}>{s.count}</div>
                            <div className="text-xs font-mono text-white/40">{s.label}</div>
                        </div>
                    ))}
                </motion.div>

                <motion.div className="relative flex justify-center"
                    initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.8, delay: 0.3 }}>
                    <div className="relative" style={{ cursor: "grab" }}>
                        {hovered && (
                            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 glass border border-cyan-400/20 rounded-lg px-4 py-2 text-sm font-mono text-cyan-300 pointer-events-none whitespace-nowrap">
                                📍 {hovered}
                            </div>
                        )}
                        <canvas ref={canvasRef} width={600} height={600}
                            className="rounded-2xl"
                            style={{ maxWidth: "100%", height: "auto" }} />
                        <div className="absolute bottom-3 right-3 text-[10px] font-mono text-white/20">drag to rotate</div>
                    </div>
                </motion.div>

                <motion.div className="mt-10 flex flex-wrap justify-center gap-2"
                    initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
                    viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.5 }}>
                    {CITIES.map(c => (
                        <span key={c.name} className="px-3 py-1 rounded-full text-xs font-mono border transition-all"
                            style={{
                                borderColor: `${CONTINENT_COLORS[c.continent]}40`,
                                color: c.home ? "#ffffff" : `${CONTINENT_COLORS[c.continent]}cc`,
                                background: c.home ? `${CONTINENT_COLORS[c.continent]}15` : "transparent",
                                fontWeight: c.home ? 700 : 400,
                            }}>
                            {c.home ? "⚑ " : ""}{c.name}
                        </span>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
