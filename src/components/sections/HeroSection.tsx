"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Points, PointMaterial, Sphere, MeshDistortMaterial, Float } from "@react-three/drei";
import * as THREE from "three";
import Image from "next/image";

// ─── 3D: Neural sphere ────────────────────────────────────────────────────────
function NeuralSphere() {
    const mesh = useRef<THREE.Mesh>(null);
    const { mouse } = useThree();

    useFrame((state) => {
        if (!mesh.current) return;
        mesh.current.rotation.x = THREE.MathUtils.lerp(mesh.current.rotation.x, mouse.y * 0.4, 0.05);
        mesh.current.rotation.y = THREE.MathUtils.lerp(mesh.current.rotation.y, mouse.x * 0.5 + state.clock.elapsedTime * 0.08, 0.05);
    });

    return (
        <Float speed={1.4} rotationIntensity={0.3} floatIntensity={0.6}>
            <mesh ref={mesh}>
                <Sphere args={[1, 64, 64]}>
                    <MeshDistortMaterial
                        color="#00d4ff"
                        attach="material"
                        distort={0.38}
                        speed={2.2}
                        roughness={0}
                        metalness={0.1}
                        transparent
                        opacity={0.12}
                        wireframe={false}
                    />
                </Sphere>
                {/* Inner core */}
                <Sphere args={[0.72, 32, 32]}>
                    <MeshDistortMaterial
                        color="#8b5cf6"
                        distort={0.25}
                        speed={3}
                        roughness={0}
                        transparent
                        opacity={0.18}
                    />
                </Sphere>
            </mesh>
        </Float>
    );
}

// ─── 3D: Particle field ───────────────────────────────────────────────────────
function ParticleField() {
    const points = useRef<THREE.Points>(null);
    const COUNT = 2800;

    const positions = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
        const r = 1.8 + Math.random() * 2.2;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = r * Math.cos(phi);
    }

    useFrame((state) => {
        if (!points.current) return;
        points.current.rotation.y = state.clock.elapsedTime * 0.04;
        points.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.03) * 0.12;
    });

    return (
        <Points ref={points} positions={positions} stride={3} frustumCulled={false}>
            <PointMaterial transparent color="#00d4ff" size={0.012} sizeAttenuation depthWrite={false} opacity={0.65} />
        </Points>
    );
}

// ─── 3D: Orbiting rings ───────────────────────────────────────────────────────
function OrbitRings() {
    const g1 = useRef<THREE.Group>(null);
    const g2 = useRef<THREE.Group>(null);

    useFrame((state) => {
        if (g1.current) g1.current.rotation.z = state.clock.elapsedTime * 0.18;
        if (g2.current) g2.current.rotation.z = -state.clock.elapsedTime * 0.12;
    });

    return (
        <>
            <group ref={g1} rotation={[Math.PI / 3, 0, 0]}>
                <mesh>
                    <torusGeometry args={[1.55, 0.006, 16, 120]} />
                    <meshBasicMaterial color="#00d4ff" transparent opacity={0.3} />
                </mesh>
            </group>
            <group ref={g2} rotation={[-Math.PI / 5, Math.PI / 4, 0]}>
                <mesh>
                    <torusGeometry args={[1.8, 0.004, 16, 120]} />
                    <meshBasicMaterial color="#8b5cf6" transparent opacity={0.22} />
                </mesh>
            </group>
        </>
    );
}

const ROLES = ["Software Engineer", "AI Engineer", "Quant Developer", "Algorithmic Builder", "Bot Architect", "Math Enthusiast"];

function TypedRole() {
    const [displayed, setDisplayed] = useState("");
    const [ri, setRi] = useState(0);
    const [del, setDel] = useState(false);
    const [paused, setPaused] = useState(false);

    useEffect(() => {
        if (paused) { const t = setTimeout(() => { setPaused(false); setDel(true); }, 2000); return () => clearTimeout(t); }
        const cur = ROLES[ri];
        if (!del) {
            if (displayed.length < cur.length) { const t = setTimeout(() => setDisplayed(cur.slice(0, displayed.length + 1)), 52); return () => clearTimeout(t); }
            setPaused(true);
        } else {
            if (displayed.length > 0) { const t = setTimeout(() => setDisplayed(s => s.slice(0, -1)), 28); return () => clearTimeout(t); }
            setDel(false); setRi(i => (i + 1) % ROLES.length);
        }
    }, [displayed, del, ri, paused]);

    return <><span className="text-cyan-400">{displayed}</span><span className="text-cyan-400 animate-pulse">|</span></>;
}

export default function HeroSection() {
    const [loaded, setLoaded] = useState(false);

    useEffect(() => { const t = setTimeout(() => setLoaded(true), 200); return () => clearTimeout(t); }, []);

    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#030712]">

            {/* 3D Canvas — full background */}
            <div className="absolute inset-0 z-0">
                <Canvas camera={{ position: [0, 0, 4.5], fov: 55 }} gl={{ antialias: true, alpha: true }}>
                    <Suspense fallback={null}>
                        <ambientLight intensity={0.15} />
                        <pointLight position={[10, 10, 10]} intensity={0.5} color="#00d4ff" />
                        <pointLight position={[-10, -10, -5]} intensity={0.3} color="#8b5cf6" />
                        <NeuralSphere />
                        <ParticleField />
                        <OrbitRings />
                    </Suspense>
                </Canvas>
            </div>

            {/* Grid overlay */}
            <div className="absolute inset-0 z-[1] opacity-[0.022]" style={{
                backgroundImage: "linear-gradient(rgba(0,212,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(0,212,255,1) 1px,transparent 1px)",
                backgroundSize: "60px 60px"
            }} />

            {/* Scan lines */}
            <div className="absolute inset-0 z-[1] pointer-events-none" style={{
                background: "linear-gradient(transparent 50%,rgba(0,212,255,0.006) 50%)",
                backgroundSize: "100% 3px"
            }} />

            {/* Radial gradient center focus */}
            <div className="absolute inset-0 z-[1] pointer-events-none" style={{
                background: "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(3,7,18,0) 0%, rgba(3,7,18,0.6) 100%)"
            }} />

            {/* HUD corners */}
            <div className="absolute top-20 left-8 z-10 hidden lg:block">
                <div className="text-[10px] font-mono text-cyan-400/35 leading-5">
                    <div>◈ YOANN.CORE.v1.0</div>
                    <div>STATUS: <span className="text-emerald-400/50">ONLINE</span></div>
                    <div>ALGO: <span className="text-violet-400/50">RSI+DUAL-MOM</span></div>
                    <div>ENV: <span className="text-yellow-400/50">PRODUCTION</span></div>
                </div>
            </div>
            <div className="absolute top-20 right-8 z-10 hidden lg:block text-right">
                <div className="text-[10px] font-mono text-cyan-400/35 leading-5">
                    <div>QUANT·AI·SWE</div>
                    <div>MODULES: <span className="text-white/30">8/8</span></div>
                    <div>AGENTS: <span className="text-emerald-400/50">5 ACTIVE</span></div>
                </div>
            </div>

            {/* Content */}
            <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">

                {/* Status badge */}
                <div className={`flex justify-center mb-8 transition-all duration-700 ${loaded ? "opacity-100" : "opacity-0 -translate-y-4"}`}>
                    <div className="flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-cyan-400/25">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-[11px] font-mono text-cyan-300/65 tracking-[0.2em]">YOANN CORE — SYSTEM ONLINE</span>
                    </div>
                </div>

                {/* Photo avatar with glow ring */}
                <div className={`flex justify-center mb-6 transition-all duration-700 delay-100 ${loaded ? "opacity-100 scale-100" : "opacity-0 scale-90"}`}>
                    <div className="relative">
                        {/* Animated glow ring */}
                        <div className="absolute inset-0 rounded-full animate-spin" style={{
                            background: "conic-gradient(from 0deg, #00d4ff, #8b5cf6, #10b981, #00d4ff)",
                            padding: 2, borderRadius: "50%", width: 92, height: 92, top: -4, left: -4,
                            animation: "spin 8s linear infinite"
                        }}>
                            <div style={{ background: "#030712", borderRadius: "50%", width: "100%", height: "100%" }} />
                        </div>
                        <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-cyan-400/20">
                            <Image src="/yoann.jpg" alt="Yoann" fill className="object-cover" style={{ filter: "contrast(1.1) saturate(0.85)", objectPosition: "center 35%" }} priority />
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#030712]" />
                    </div>
                </div>

                {/* Name */}
                <div className={`mb-5 transition-all duration-900 delay-150 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
                    <h1 className="font-black tracking-tighter leading-none" style={{
                        fontSize: "clamp(52px, 11vw, 130px)",
                        background: "linear-gradient(135deg, #ffffff 0%, rgba(255,255,255,0.75) 100%)",
                        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                        filter: "drop-shadow(0 0 40px rgba(0,212,255,0.15))"
                    }}>
                        YOANN BEUGRÉ
                    </h1>
                </div>

                {/* Typed role */}
                <div className={`h-9 flex items-center justify-center mb-6 transition-all duration-700 delay-200 ${loaded ? "opacity-100" : "opacity-0"}`}>
                    <span className="text-white/25 font-mono text-lg mr-2">{"<"}</span>
                    <span className="text-lg md:text-xl font-mono font-semibold min-w-[260px] text-left">
                        <TypedRole />
                    </span>
                    <span className="text-white/25 font-mono text-lg ml-2">{"/>"}</span>
                </div>

                {/* Tagline */}
                <p className={`max-w-xl mx-auto text-white/40 leading-relaxed mb-10 transition-all duration-700 delay-300 ${loaded ? "opacity-100" : "opacity-0"}`}
                    style={{ fontSize: "clamp(13px, 2vw, 16px)" }}>
                    Je conçois des <span className="text-cyan-400 font-medium">systèmes intelligents</span> à l&apos;intersection du code, des mathématiques, de l&apos;IA et de la{" "}
                    <span className="text-violet-400 font-medium">finance quantitative</span>.
                </p>

                {/* CTAs */}
                <div className={`flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 transition-all duration-700 delay-400 ${loaded ? "opacity-100" : "opacity-0 translate-y-4"}`}>
                    <button type="button" onClick={() => document.querySelector("#trade")?.scrollIntoView({ behavior: "smooth" })}
                        style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8, padding: "13px 28px", borderRadius: 14, fontWeight: 900, fontSize: 15, color: "#000", background: "linear-gradient(135deg,#00d4ff,#8b5cf6)", border: "none", boxShadow: "0 0 32px rgba(0,212,255,0.25), 0 0 64px rgba(139,92,246,0.15)" }}>
                        🚀 Start the mission
                    </button>
                    <button type="button" onClick={() => document.querySelector("#projects")?.scrollIntoView({ behavior: "smooth" })}
                        style={{ cursor: "pointer", padding: "13px 28px", borderRadius: 14, fontWeight: 700, fontSize: 15, color: "rgba(255,255,255,0.7)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)", backdropFilter: "blur(10px)" }}>
                        Research Lab →
                    </button>
                </div>

                {/* Scroll indicator */}
                <div className={`flex flex-col items-center gap-2 transition-all duration-700 delay-700 ${loaded ? "opacity-100" : "opacity-0"}`}>
                    <span className="text-[10px] font-mono text-white/20 tracking-widest uppercase">Scroll to explore</span>
                    <div style={{ width: 1, height: 40, background: "linear-gradient(180deg,rgba(0,212,255,0.5),transparent)", animation: "heroScroll 1.5s ease-in-out infinite" }} />
                </div>
            </div>

            <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes heroScroll { 0%,100%{opacity:0.3;transform:scaleY(1)} 50%{opacity:0.9;transform:scaleY(1.4)} }
      `}</style>
        </section>
    );
}
