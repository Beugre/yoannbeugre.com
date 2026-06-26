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

const ARCS = [
    { src: "Bordeaux", dst: "Abidjan" },
    { src: "Bordeaux", dst: "New York" },
    { src: "Bordeaux", dst: "Dubai" },
    { src: "Bordeaux", dst: "Singapour" },
    { src: "Bordeaux", dst: "Istanbul" },
    { src: "Abidjan", dst: "Accra" },
    { src: "Abidjan", dst: "La Réunion" },
    { src: "Dubai", dst: "Bali" },
    { src: "New York", dst: "Toronto" },
];

const CONTINENT_COLORS: Record<string, string> = {
    EU: "#00d4ff",
    AF: "#f97316",
    AS: "#8b5cf6",
    AM: "#10b981",
};

export default function WorldTravelsSection() {
    const globeRef = useRef<HTMLDivElement>(null);
    const [hovered, setHovered] = useState<string | null>(null);
    const [globeReady, setGlobeReady] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [GlobeComponent, setGlobeComponent] = useState<any>(null);

    useEffect(() => {
        // Dynamic import for SSR compatibility
        import("react-globe.gl").then((mod) => {
            setGlobeComponent(() => mod.default);
            setGlobeReady(true);
        });
    }, []);

    const cityLookup = Object.fromEntries(CITIES.map(c => [c.name, c]));
    const arcsData = ARCS.map(a => ({
        startLat: cityLookup[a.src]?.lat,
        startLng: cityLookup[a.src]?.lng,
        endLat: cityLookup[a.dst]?.lat,
        endLng: cityLookup[a.dst]?.lng,
        color: ["rgba(0,212,255,0.7)", "rgba(139,92,246,0.7)"],
    }));

    const pointsData = CITIES.map(c => ({
        lat: c.lat,
        lng: c.lng,
        size: c.home ? 0.8 : 0.4,
        color: c.home ? "#ffffff" : CONTINENT_COLORS[c.continent] || "#00d4ff",
        label: c.name,
        home: c.home,
    }));

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
                {/* Header */}
                <motion.div
                    className="mb-12 text-center"
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.7 }}
                >
                    <div className="flex items-center justify-center gap-4 mb-4">
                        <div className="glow-line w-16" />
                        <span className="text-xs font-mono text-cyan-400 tracking-widest uppercase">08 / World Map</span>
                        <div className="glow-line w-16" />
                    </div>
                    <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-white/90 leading-tight mb-4">
                        Le monde comme <span className="text-gradient-static">terrain de jeu</span>
                    </h2>
                    <p className="text-white/40 max-w-xl mx-auto text-sm">
                        {CITIES.length} villes · 4 continents · Entre <span className="text-orange-400">Bordeaux</span> et <span className="text-orange-400">Abidjan</span>, une vision globale des systèmes humains et techniques.
                    </p>
                </motion.div>

                {/* Stats */}
                <motion.div
                    className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    {continentStats.map(s => (
                        <div key={s.label} className="glass rounded-xl p-4 text-center border border-white/5">
                            <div className="text-3xl font-black mb-1" style={{ color: s.color }}>{s.count}</div>
                            <div className="text-xs font-mono text-white/40">{s.label}</div>
                        </div>
                    ))}
                </motion.div>

                {/* Globe */}
                <motion.div
                    className="relative flex justify-center"
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                >
                    <div
                        ref={globeRef}
                        className="relative rounded-2xl overflow-hidden"
                        style={{ width: "100%", maxWidth: 700, height: 600, background: "radial-gradient(ellipse at center, rgba(0,10,30,0.9) 0%, rgba(3,7,18,1) 100%)" }}
                    >
                        {/* Hovered city tooltip */}
                        {hovered && (
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 glass border border-cyan-400/20 rounded-lg px-4 py-2 text-sm font-mono text-cyan-300 pointer-events-none">
                                📍 {hovered}
                            </div>
                        )}

                        {globeReady && GlobeComponent && (
                            // @ts-expect-error - react-globe.gl props
                            <GlobeComponent
                                width={700}
                                height={600}
                                backgroundColor="rgba(0,0,0,0)"
                                globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
                                bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
                                atmosphereColor="#00d4ff"
                                atmosphereAltitude={0.12}
                                pointsData={pointsData}
                                pointAltitude={0.015}
                                pointRadius="size"
                                pointColor="color"
                                pointLabel="label"
                                onPointHover={(p: unknown) => setHovered(p ? (p as { label: string }).label : null)}
                                arcsData={arcsData}
                                arcColor="color"
                                arcAltitude={0.3}
                                arcStroke={0.4}
                                arcDashLength={0.4}
                                arcDashGap={0.2}
                                arcDashAnimateTime={2500}
                                enablePointerInteraction={true}
                                animateIn={true}
                            />
                        )}

                        {!globeReady && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-white/20 font-mono text-sm animate-pulse">Loading globe...</div>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* City list */}
                <motion.div
                    className="mt-10 flex flex-wrap justify-center gap-2"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                >
                    {CITIES.map(c => (
                        <span
                            key={c.name}
                            className="px-3 py-1 rounded-full text-xs font-mono border transition-all"
                            style={{
                                borderColor: `${CONTINENT_COLORS[c.continent]}40`,
                                color: c.home ? "#ffffff" : `${CONTINENT_COLORS[c.continent]}cc`,
                                background: c.home ? `${CONTINENT_COLORS[c.continent]}15` : "transparent",
                                fontWeight: c.home ? 700 : 400,
                            }}
                        >
                            {c.home ? "⚑ " : ""}{c.name}
                        </span>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
