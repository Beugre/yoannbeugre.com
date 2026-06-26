"use client";

import { useRef, useMemo, Suspense, useState } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import * as THREE from "three";
import { motion } from "framer-motion";

const CITIES = [
    { name: "Bordeaux", lat: 44.84, lng: -0.58, home: true, size: 0.025 },
    { name: "Abidjan", lat: 5.36, lng: -4.01, home: true, size: 0.025 },
    { name: "Paris", lat: 48.86, lng: 2.35, size: 0.014 },
    { name: "Yamoussoukro", lat: 6.83, lng: -5.29, size: 0.012 },
    { name: "Grand Bassam", lat: 5.20, lng: -3.74, size: 0.010 },
    { name: "Barcelone", lat: 41.39, lng: 2.17, size: 0.013 },
    { name: "Madrid", lat: 40.42, lng: -3.70, size: 0.013 },
    { name: "San Sebastián", lat: 43.32, lng: -1.98, size: 0.010 },
    { name: "Bilbao", lat: 43.26, lng: -2.93, size: 0.010 },
    { name: "Biarritz", lat: 43.48, lng: -1.56, size: 0.010 },
    { name: "Toulouse", lat: 43.60, lng: 1.44, size: 0.011 },
    { name: "Rennes", lat: 48.12, lng: -1.68, size: 0.010 },
    { name: "Poitiers", lat: 46.58, lng: 0.34, size: 0.010 },
    { name: "Londres", lat: 51.51, lng: -0.13, size: 0.015 },
    { name: "Bruxelles", lat: 50.85, lng: 4.35, size: 0.011 },
    { name: "Lausanne", lat: 46.52, lng: 6.63, size: 0.010 },
    { name: "Milan", lat: 45.47, lng: 9.19, size: 0.012 },
    { name: "Faro", lat: 37.02, lng: -7.93, size: 0.010 },
    { name: "Porto", lat: 41.16, lng: -8.63, size: 0.011 },
    { name: "Istanbul", lat: 41.01, lng: 28.98, size: 0.013 },
    { name: "Dubai", lat: 25.20, lng: 55.27, size: 0.014 },
    { name: "Abu Dhabi", lat: 24.45, lng: 54.38, size: 0.011 },
    { name: "Singapour", lat: 1.35, lng: 103.82, size: 0.013 },
    { name: "Bali", lat: -8.34, lng: 115.09, size: 0.011 },
    { name: "New York", lat: 40.71, lng: -74.01, size: 0.016 },
    { name: "Toronto", lat: 43.65, lng: -79.38, size: 0.012 },
    { name: "Montréal", lat: 45.50, lng: -73.57, size: 0.011 },
    { name: "Niagara Falls", lat: 43.09, lng: -79.08, size: 0.010 },
    { name: "Marrakech", lat: 31.63, lng: -7.98, size: 0.011 },
    { name: "Casablanca", lat: 33.57, lng: -7.59, size: 0.011 },
    { name: "Rabat", lat: 34.02, lng: -6.84, size: 0.010 },
    { name: "Accra", lat: 5.60, lng: -0.19, size: 0.011 },
    { name: "La Réunion", lat: -21.12, lng: 55.54, size: 0.010 },
    { name: "Île Maurice", lat: -20.35, lng: 57.55, size: 0.010 },
];

function latLngToVec3(lat: number, lng: number, radius: number): THREE.Vector3 {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);
    return new THREE.Vector3(
        -radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta)
    );
}

function CityMarker({ city }: { city: typeof CITIES[0] }) {
    const meshRef = useRef<THREE.Mesh>(null);
    const glowRef = useRef<THREE.Mesh>(null);
    const pos = useMemo(() => latLngToVec3(city.lat, city.lng, 1.01), [city.lat, city.lng]);
    const color = city.home ? "#ffffff" : "#f0b90b";
    const glowColor = city.home ? "#00d4ff" : "#f0b90b";

    useFrame(({ clock }) => {
        if (meshRef.current) {
            const pulse = 0.85 + 0.15 * Math.sin(clock.getElapsedTime() * 2 + city.lat);
            meshRef.current.scale.setScalar(pulse);
        }
        if (glowRef.current) {
            const glow = 0.6 + 0.4 * Math.sin(clock.getElapsedTime() * 1.5 + city.lng);
            (glowRef.current.material as THREE.MeshBasicMaterial).opacity = glow * (city.home ? 0.5 : 0.3);
        }
    });

    return (
        <group position={pos}>
            {/* Glow halo */}
            <mesh ref={glowRef}>
                <sphereGeometry args={[city.size * 3, 8, 8]} />
                <meshBasicMaterial color={glowColor} transparent opacity={0.3} />
            </mesh>
            {/* Main dot */}
            <mesh ref={meshRef}>
                <sphereGeometry args={[city.size, 8, 8]} />
                <meshBasicMaterial color={color} />
            </mesh>
        </group>
    );
}

function Globe() {
    const globeRef = useRef<THREE.Group>(null);
    const texture = useLoader(THREE.TextureLoader, "//unpkg.com/three-globe/example/img/earth-night.jpg");
    const bumpTexture = useLoader(THREE.TextureLoader, "//unpkg.com/three-globe/example/img/earth-topology.png");

    useFrame((_, delta) => {
        if (globeRef.current) {
            globeRef.current.rotation.y += delta * 0.12;
        }
    });

    return (
        <group ref={globeRef}>
            {/* Earth sphere */}
            <mesh>
                <sphereGeometry args={[1, 64, 64]} />
                <meshPhongMaterial
                    map={texture}
                    bumpMap={bumpTexture}
                    bumpScale={0.05}
                    specular={new THREE.Color(0x333333)}
                    shininess={8}
                />
            </mesh>

            {/* Atmosphere glow */}
            <mesh>
                <sphereGeometry args={[1.04, 32, 32]} />
                <meshBasicMaterial
                    color="#0088ff"
                    transparent
                    opacity={0.06}
                    side={THREE.BackSide}
                />
            </mesh>

            {/* City markers */}
            {CITIES.map(city => (
                <CityMarker key={city.name} city={city} />
            ))}
        </group>
    );
}

const CONTINENT_COLORS: Record<string, string> = {
    EU: "#00d4ff",
    AF: "#f97316",
    AS: "#8b5cf6",
    AM: "#10b981",
};

const CITY_META: Record<string, { continent: string; emoji: string }> = {
    Bordeaux: { continent: "EU", emoji: "🏠" }, Abidjan: { continent: "AF", emoji: "🏠" },
    Paris: { continent: "EU", emoji: "🗼" }, Barcelone: { continent: "EU", emoji: "⚽" },
    Madrid: { continent: "EU", emoji: "🏟️" }, Londres: { continent: "EU", emoji: "🎡" },
    Bruxelles: { continent: "EU", emoji: "🍫" }, Lausanne: { continent: "EU", emoji: "⛰️" },
    Milan: { continent: "EU", emoji: "👗" }, Istanbul: { continent: "AS", emoji: "🕌" },
    Dubai: { continent: "AS", emoji: "🏗️" }, "Abu Dhabi": { continent: "AS", emoji: "🏎️" },
    Singapour: { continent: "AS", emoji: "🦁" }, Bali: { continent: "AS", emoji: "🌴" },
    "New York": { continent: "AM", emoji: "🗽" }, Toronto: { continent: "AM", emoji: "🍁" },
    Montréal: { continent: "AM", emoji: "🎭" }, "Niagara Falls": { continent: "AM", emoji: "💦" },
    Marrakech: { continent: "AF", emoji: "🕌" }, Casablanca: { continent: "AF", emoji: "🌊" },
    Rabat: { continent: "AF", emoji: "🏛️" }, Accra: { continent: "AF", emoji: "🌍" },
    "La Réunion": { continent: "AF", emoji: "🌋" }, "Île Maurice": { continent: "AF", emoji: "🐠" },
    Yamoussoukro: { continent: "AF", emoji: "⛪" }, "Grand Bassam": { continent: "AF", emoji: "🏖️" },
    "San Sebastián": { continent: "EU", emoji: "🌊" }, Bilbao: { continent: "EU", emoji: "🎨" },
    Biarritz: { continent: "EU", emoji: "🏄" }, Toulouse: { continent: "EU", emoji: "🌹" },
    Rennes: { continent: "EU", emoji: "🎸" }, Poitiers: { continent: "EU", emoji: "🏰" },
    Faro: { continent: "EU", emoji: "☀️" }, Porto: { continent: "EU", emoji: "🍷" },
};

export default function WorldTravelsSection() {
    const [expanded, setExpanded] = useState(false);
    const continentStats = [
        { label: "Europe", count: Object.values(CITY_META).filter(c => c.continent === "EU").length, color: "#00d4ff", flag: "🇪🇺" },
        { label: "Afrique", count: Object.values(CITY_META).filter(c => c.continent === "AF").length, color: "#f97316", flag: "🌍" },
        { label: "Asie / MO", count: Object.values(CITY_META).filter(c => c.continent === "AS").length, color: "#8b5cf6", flag: "🌏" },
        { label: "Amériques", count: Object.values(CITY_META).filter(c => c.continent === "AM").length, color: "#10b981", flag: "🌎" },
    ];

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
                        <span className="text-white font-semibold">⚑ Bordeaux & Abidjan</span> — mes deux bases.{" "}
                        <span className="text-white/60">{CITIES.length - 2} villes visitées</span> sur 4 continents — curiosité, sport, tech et famille.
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

                {/* Globe 3D */}
                <motion.div
                    className="relative rounded-2xl overflow-hidden"
                    style={{ height: 560, background: "radial-gradient(ellipse at center, #000510 0%, #000208 100%)" }}
                    initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.3 }}>

                    <Canvas camera={{ position: [0, 0, 2.6], fov: 45 }}>
                        <ambientLight intensity={0.15} />
                        <directionalLight position={[5, 3, 5]} intensity={0.8} color="#ffffff" />
                        <pointLight position={[-5, -3, -3]} intensity={0.3} color="#0044ff" />
                        <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade />
                        <Suspense fallback={null}>
                            <Globe />
                        </Suspense>
                        <OrbitControls enableZoom={false} enablePan={false} autoRotate={false} />
                    </Canvas>

                    {/* Legend */}
                    <div className="absolute bottom-4 left-4 flex items-center gap-4 text-[10px] font-mono">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-white" style={{ boxShadow: "0 0 6px #00d4ff" }} />
                            <span className="text-white/50">Home ⚑</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-yellow-400" style={{ boxShadow: "0 0 6px #f0b90b" }} />
                            <span className="text-white/50">Ville visitée</span>
                        </div>
                    </div>
                    <div className="absolute bottom-4 right-4 text-[10px] font-mono text-white/20">drag to explore</div>
                </motion.div>

                {/* City pills */}
                <motion.div className="mt-8"
                    initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
                    viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.5 }}>
                    <div className={`flex flex-wrap justify-center gap-2 overflow-hidden transition-all duration-500 ${expanded ? "" : "max-h-24"}`}>
                        {CITIES.map(c => {
                            const meta = CITY_META[c.name] || { continent: "EU", emoji: "📍" };
                            return (
                                <span key={c.name}
                                    className="px-3 py-1 rounded-full text-xs font-mono border transition-all hover:scale-105"
                                    style={{
                                        borderColor: `${CONTINENT_COLORS[meta.continent]}40`,
                                        color: c.home ? "#ffffff" : `${CONTINENT_COLORS[meta.continent]}cc`,
                                        background: c.home ? `${CONTINENT_COLORS[meta.continent]}20` : "rgba(255,255,255,0.03)",
                                        fontWeight: c.home ? 700 : 400,
                                    }}>
                                    {meta.emoji} {c.name}{c.home ? " ⚑" : ""}
                                </span>
                            );
                        })}
                    </div>
                    <div className="flex justify-center mt-3">
                        <button onClick={() => setExpanded(e => !e)}
                            className="text-xs font-mono text-white/30 hover:text-cyan-400 transition-colors"
                            style={{ cursor: "pointer" }}>
                            {expanded ? "▲ Réduire" : `▼ Voir les ${CITIES.length} villes`}
                        </button>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
