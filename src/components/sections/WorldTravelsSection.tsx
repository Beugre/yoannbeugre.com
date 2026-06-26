"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

const CITIES = [
    // Europe
    { name: "Bordeaux", lat: 44.84, lng: -0.58, home: true, continent: "EU", emoji: "🏠" },
    { name: "Paris", lat: 48.86, lng: 2.35, continent: "EU", emoji: "🗼" },
    { name: "Barcelone", lat: 41.39, lng: 2.17, continent: "EU", emoji: "⚽" },
    { name: "Madrid", lat: 40.42, lng: -3.70, continent: "EU", emoji: "🏟️" },
    { name: "San Sebastián", lat: 43.32, lng: -1.98, continent: "EU", emoji: "🌊" },
    { name: "Bilbao", lat: 43.26, lng: -2.93, continent: "EU", emoji: "🎨" },
    { name: "Biarritz", lat: 43.48, lng: -1.56, continent: "EU", emoji: "🏄" },
    { name: "Toulouse", lat: 43.60, lng: 1.44, continent: "EU", emoji: "🌹" },
    { name: "Rennes", lat: 48.12, lng: -1.68, continent: "EU", emoji: "🎸" },
    { name: "Poitiers", lat: 46.58, lng: 0.34, continent: "EU", emoji: "🏰" },
    { name: "Londres", lat: 51.51, lng: -0.13, continent: "EU", emoji: "🎡" },
    { name: "Bruxelles", lat: 50.85, lng: 4.35, continent: "EU", emoji: "🍫" },
    { name: "Lausanne", lat: 46.52, lng: 6.63, continent: "EU", emoji: "⛰️" },
    { name: "Milan", lat: 45.47, lng: 9.19, continent: "EU", emoji: "👗" },
    { name: "Faro", lat: 37.02, lng: -7.93, continent: "EU", emoji: "☀️" },
    { name: "Porto", lat: 41.16, lng: -8.63, continent: "EU", emoji: "🍷" },
    // Afrique
    { name: "Abidjan", lat: 5.36, lng: -4.01, home: true, continent: "AF", emoji: "🏠" },
    { name: "Yamoussoukro", lat: 6.83, lng: -5.29, continent: "AF", emoji: "⛪" },
    { name: "Grand Bassam", lat: 5.20, lng: -3.74, continent: "AF", emoji: "🏖️" },
    { name: "Marrakech", lat: 31.63, lng: -7.98, continent: "AF", emoji: "🕌" },
    { name: "Casablanca", lat: 33.57, lng: -7.59, continent: "AF", emoji: "🌊" },
    { name: "Rabat", lat: 34.02, lng: -6.84, continent: "AF", emoji: "🏛️" },
    { name: "Accra", lat: 5.60, lng: -0.19, continent: "AF", emoji: "🌍" },
    { name: "La Réunion", lat: -21.12, lng: 55.54, continent: "AF", emoji: "🌋" },
    { name: "Île Maurice", lat: -20.35, lng: 57.55, continent: "AF", emoji: "🐠" },
    // Asie / Moyen-Orient
    { name: "Istanbul", lat: 41.01, lng: 28.98, continent: "AS", emoji: "🕌" },
    { name: "Dubai", lat: 25.20, lng: 55.27, continent: "AS", emoji: "🏗️" },
    { name: "Abu Dhabi", lat: 24.45, lng: 54.38, continent: "AS", emoji: "🏎️" },
    { name: "Singapour", lat: 1.35, lng: 103.82, continent: "AS", emoji: "🦁" },
    { name: "Bali", lat: -8.34, lng: 115.09, continent: "AS", emoji: "🌴" },
    // Amériques
    { name: "New York", lat: 40.71, lng: -74.01, continent: "AM", emoji: "🗽" },
    { name: "Toronto", lat: 43.65, lng: -79.38, continent: "AM", emoji: "🍁" },
    { name: "Montréal", lat: 45.50, lng: -73.57, continent: "AM", emoji: "🎭" },
    { name: "Niagara Falls", lat: 43.09, lng: -79.08, continent: "AM", emoji: "💦" },
];

const CONTINENT_COLORS: Record<string, string> = {
    EU: "#00d4ff",
    AF: "#f97316",
    AS: "#8b5cf6",
    AM: "#10b981",
};

// Mercator projection
function project(lat: number, lng: number, W: number, H: number): [number, number] {
    const x = (lng + 180) / 360 * W;
    const latRad = lat * Math.PI / 180;
    const mercN = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
    const y = H / 2 - W * mercN / (2 * Math.PI);
    return [x, y];
}

export default function WorldTravelsSection() {
    const svgRef = useRef<SVGSVGElement>(null);
    const [hoveredCity, setHoveredCity] = useState<typeof CITIES[0] | null>(null);
    const [tooltip, setTooltip] = useState<{ x: number; y: number } | null>(null);
    const [W, setW] = useState(900);
    const H = W * 0.5;

    useEffect(() => {
        const update = () => {
            const el = svgRef.current?.parentElement;
            if (el) setW(Math.min(el.clientWidth, 960));
        };
        update();
        window.addEventListener("resize", update);
        return () => window.removeEventListener("resize", update);
    }, []);

    const continentStats = [
        { label: "Europe", count: CITIES.filter(c => c.continent === "EU").length, color: "#00d4ff", flag: "🇪🇺" },
        { label: "Afrique", count: CITIES.filter(c => c.continent === "AF").length, color: "#f97316", flag: "🌍" },
        { label: "Asie / MO", count: CITIES.filter(c => c.continent === "AS").length, color: "#8b5cf6", flag: "🌏" },
        { label: "Amériques", count: CITIES.filter(c => c.continent === "AM").length, color: "#10b981", flag: "🌎" },
    ];

    const projectedCities = CITIES.map(c => {
        const [x, y] = project(c.lat, c.lng, W, H);
        return { ...c, x, y };
    });

    return (
        <section id="travels" className="relative py-16 md:py-32 px-4 md:px-6 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-950/5 to-transparent pointer-events-none" />
            <div className="max-w-7xl mx-auto">

                {/* Header */}
                <motion.div className="mb-10 text-center"
                    initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }} transition={{ duration: 0.7 }}>
                    <div className="flex items-center justify-center gap-4 mb-4">
                        <div className="glow-line w-16" />
                        <span className="text-xs font-mono text-cyan-400 tracking-widest uppercase">08 / World Travels</span>
                        <div className="glow-line w-16" />
                    </div>
                    <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-white/90 leading-tight mb-3">
                        Villes <span className="text-gradient-static">visitées</span> dans le monde
                    </h2>
                    <p className="text-white/40 max-w-2xl mx-auto text-sm leading-relaxed">
                        <span className="text-orange-400 font-semibold">⚑ Bordeaux & Abidjan</span> — mes deux bases. Le reste : <span className="text-white/60">{CITIES.length - 2} villes visitées</span> sur 4 continents, entre curiosité, sport, tech et famille.
                    </p>
                </motion.div>

                {/* Stats */}
                <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8"
                    initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.2 }}>
                    {continentStats.map(s => (
                        <div key={s.label} className="glass rounded-xl p-4 text-center border border-white/5">
                            <div className="text-2xl mb-1">{s.flag}</div>
                            <div className="text-2xl font-black mb-0.5" style={{ color: s.color }}>{s.count}</div>
                            <div className="text-xs font-mono text-white/40">{s.label}</div>
                        </div>
                    ))}
                </motion.div>

                {/* Map */}
                <motion.div className="relative glass rounded-2xl border border-white/8 overflow-hidden"
                    initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.3 }}>

                    {/* Tooltip */}
                    {hoveredCity && tooltip && (
                        <div className="absolute z-20 pointer-events-none glass border border-cyan-400/30 rounded-xl px-3 py-2 text-xs font-mono text-white/90 shadow-xl"
                            style={{ left: Math.min(tooltip.x + 12, W - 160), top: Math.max(tooltip.y - 40, 8) }}>
                            <span className="mr-1">{hoveredCity.emoji}</span>
                            <span className="font-bold" style={{ color: CONTINENT_COLORS[hoveredCity.continent] }}>{hoveredCity.name}</span>
                            {hoveredCity.home && <span className="ml-1 text-orange-400 font-bold"> — Home</span>}
                        </div>
                    )}

                    <svg
                        ref={svgRef}
                        width={W}
                        height={H}
                        viewBox={`0 0 ${W} ${H}`}
                        style={{ display: "block", width: "100%", height: "auto", background: "rgba(3,7,18,0.8)" }}
                    >
                        {/* Background */}
                        <defs>
                            <radialGradient id="globeGlow" cx="50%" cy="50%">
                                <stop offset="0%" stopColor="rgba(0,212,255,0.04)" />
                                <stop offset="100%" stopColor="rgba(3,7,18,0)" />
                            </radialGradient>
                            {CITIES.map(c => (
                                <radialGradient key={`glow-${c.name}`} id={`glow-${c.name}`} cx="50%" cy="50%">
                                    <stop offset="0%" stopColor={CONTINENT_COLORS[c.continent]} stopOpacity="0.6" />
                                    <stop offset="100%" stopColor={CONTINENT_COLORS[c.continent]} stopOpacity="0" />
                                </radialGradient>
                            ))}
                        </defs>
                        <rect width={W} height={H} fill="url(#globeGlow)" />

                        {/* Grid lines */}
                        {[-60, -30, 0, 30, 60].map(lat => {
                            const [, y] = project(lat, 0, W, H);
                            return <line key={lat} x1={0} y1={y} x2={W} y2={y} stroke="rgba(0,212,255,0.05)" strokeWidth={0.5} />;
                        })}
                        {[-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150].map(lng => {
                            const [x] = project(0, lng, W, H);
                            return <line key={lng} x1={x} y1={0} x2={x} y2={H} stroke="rgba(0,212,255,0.05)" strokeWidth={0.5} />;
                        })}

                        {/* Connection arcs between home cities and continents */}
                        {[
                            { from: "Bordeaux", to: "Abidjan" },
                            { from: "Bordeaux", to: "New York" },
                            { from: "Bordeaux", to: "Dubai" },
                            { from: "Bordeaux", to: "Singapour" },
                            { from: "Abidjan", to: "La Réunion" },
                        ].map(({ from, to }) => {
                            const a = projectedCities.find(c => c.name === from);
                            const b = projectedCities.find(c => c.name === to);
                            if (!a || !b) return null;
                            const mx = (a.x + b.x) / 2;
                            const my = Math.min(a.y, b.y) - 30;
                            return (
                                <motion.path
                                    key={`${from}-${to}`}
                                    d={`M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}`}
                                    fill="none"
                                    stroke="rgba(0,212,255,0.2)"
                                    strokeWidth={1}
                                    strokeDasharray="4 6"
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    whileInView={{ pathLength: 1, opacity: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 2, delay: 0.5 }}
                                />
                            );
                        })}

                        {/* City dots */}
                        {projectedCities.map(city => (
                            <g key={city.name}
                                onMouseEnter={(e) => {
                                    setHoveredCity(city);
                                    const rect = svgRef.current!.getBoundingClientRect();
                                    setTooltip({ x: city.x * (rect.width / W), y: city.y * (rect.height / H) });
                                }}
                                onMouseLeave={() => { setHoveredCity(null); setTooltip(null); }}
                                style={{ cursor: "pointer" }}
                            >
                                {/* Glow */}
                                {city.home && (
                                    <motion.circle
                                        cx={city.x} cy={city.y}
                                        r={20}
                                        fill={`url(#glow-${city.name})`}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: [0.4, 0.9, 0.4] }}
                                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                    />
                                )}

                                {/* Outer pulse ring */}
                                <motion.circle
                                    cx={city.x} cy={city.y}
                                    r={city.home ? 9 : 5}
                                    fill="none"
                                    stroke={CONTINENT_COLORS[city.continent]}
                                    strokeWidth={1}
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ opacity: [0, 0.5, 0], scale: [0.8, 1.8, 0.8] }}
                                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: Math.random() * 2 }}
                                />

                                {/* Main dot */}
                                <motion.circle
                                    cx={city.x} cy={city.y}
                                    r={city.home ? 6 : 3.5}
                                    fill={city.home ? "#ffffff" : CONTINENT_COLORS[city.continent]}
                                    stroke={city.home ? CONTINENT_COLORS[city.continent] : "rgba(0,0,0,0.4)"}
                                    strokeWidth={city.home ? 2 : 0.5}
                                    initial={{ opacity: 0, scale: 0 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.4, delay: 0.5 + Math.random() * 0.8 }}
                                    whileHover={{ scale: 1.8 }}
                                />

                                {/* Home label */}
                                {city.home && (
                                    <motion.text
                                        x={city.x} y={city.y - 10}
                                        textAnchor="middle"
                                        fontSize={9}
                                        fontWeight={700}
                                        fontFamily="monospace"
                                        fill={CONTINENT_COLORS[city.continent]}
                                        initial={{ opacity: 0 }}
                                        whileInView={{ opacity: 1 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: 1.2 }}
                                    >
                                        ⚑ {city.name}
                                    </motion.text>
                                )}
                            </g>
                        ))}
                    </svg>

                    {/* Legend */}
                    <div className="absolute bottom-3 left-3 flex items-center gap-4 text-[10px] font-mono">
                        {Object.entries(CONTINENT_COLORS).map(([k, color]) => {
                            const labels: Record<string, string> = { EU: "Europe", AF: "Afrique", AS: "Asie", AM: "Amériques" };
                            return (
                                <div key={k} className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                                    <span style={{ color: "rgba(255,255,255,0.4)" }}>{labels[k]}</span>
                                </div>
                            );
                        })}
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-white border-2 border-cyan-400" />
                            <span style={{ color: "rgba(255,255,255,0.4)" }}>Home</span>
                        </div>
                    </div>
                </motion.div>

                {/* City pills */}
                <motion.div className="mt-8 flex flex-wrap justify-center gap-2"
                    initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
                    viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.5 }}>
                    {CITIES.map(c => (
                        <span key={c.name}
                            className="px-3 py-1 rounded-full text-xs font-mono border transition-all hover:scale-105"
                            style={{
                                borderColor: `${CONTINENT_COLORS[c.continent]}40`,
                                color: c.home ? "#ffffff" : `${CONTINENT_COLORS[c.continent]}cc`,
                                background: c.home ? `${CONTINENT_COLORS[c.continent]}20` : "rgba(255,255,255,0.03)",
                                fontWeight: c.home ? 700 : 400,
                            }}>
                            {c.emoji} {c.name}{c.home ? " ⚑" : ""}
                        </span>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
