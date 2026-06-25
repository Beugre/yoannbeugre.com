"use client";

import { useRef, useState, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text, Line } from "@react-three/drei";
import * as THREE from "three";

interface SkillNode {
  id: string; label: string; position: [number, number, number];
  color: string; size: number; category: string;
}

interface SkillEdge { from: string; to: string; }

const SKILLS: SkillNode[] = [
  { id: "python",    label: "Python",       position: [0, 0, 0],       color: "#3b82f6", size: 0.35, category: "core" },
  { id: "binance",   label: "Binance",      position: [2.2, 1.2, 0.5], color: "#f0b90b", size: 0.28, category: "trading" },
  { id: "llm",       label: "LLM",          position: [-2, 1.5, 0.3],  color: "#8b5cf6", size: 0.30, category: "ai" },
  { id: "sql",       label: "SQL",          position: [1.8, -1.5, -0.4],color: "#ef4444", size: 0.28, category: "db" },
  { id: "react",     label: "React",        position: [-2.2, -0.8, 0.6],color: "#61dafb", size: 0.26, category: "frontend" },
  { id: "ts",        label: "TypeScript",   position: [-1.5, -1.8, 0.2],color: "#3178c6", size: 0.24, category: "frontend" },
  { id: "docker",    label: "Docker",       position: [0.5, 2.2, -0.6], color: "#2496ed", size: 0.24, category: "infra" },
  { id: "ml",        label: "ML",           position: [-2.8, 0.5, -0.5],color: "#7c3aed", size: 0.26, category: "ai" },
  { id: "polymarket",label: "Polymarket",   position: [2.8, 0.2, -0.3], color: "#10b981", size: 0.26, category: "trading" },
  { id: "pg",        label: "PostgreSQL",   position: [1.2, -2.5, 0.3], color: "#64748b", size: 0.24, category: "db" },
  { id: "ws",        label: "WebSocket",    position: [3.2, -0.8, 0.5], color: "#06b6d4", size: 0.22, category: "trading" },
  { id: "firebase",  label: "Firebase",     position: [0.8, -0.5, -2.2],color: "#f97316", size: 0.22, category: "db" },
  { id: "nextjs",    label: "Next.js",      position: [-1.8, 1, -1.8],  color: "#ffffff", size: 0.24, category: "frontend" },
  { id: "langchain", label: "LangChain",    position: [-3, -0.2, 0.8],  color: "#a78bfa", size: 0.24, category: "ai" },
];

const EDGES: SkillEdge[] = [
  { from: "python", to: "binance" }, { from: "python", to: "llm" },
  { from: "python", to: "ml" }, { from: "python", to: "sql" },
  { from: "python", to: "ws" }, { from: "python", to: "polymarket" },
  { from: "python", to: "firebase" }, { from: "llm", to: "langchain" },
  { from: "llm", to: "ml" }, { from: "binance", to: "ws" },
  { from: "sql", to: "pg" }, { from: "react", to: "ts" },
  { from: "react", to: "nextjs" }, { from: "python", to: "docker" },
];

function ConstellationScene({ hoveredId, setHoveredId }: { hoveredId: string | null; setHoveredId: (id: string | null) => void }) {
  const groupRef = useRef<THREE.Group>(null);
  const { mouse } = useThree();

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y += 0.002;
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, mouse.y * 0.15, 0.03);
  });

  return (
    <group ref={groupRef}>
      {/* Edges */}
      {EDGES.map((edge, i) => {
        const from = SKILLS.find(s => s.id === edge.from);
        const to = SKILLS.find(s => s.id === edge.to);
        if (!from || !to) return null;
        const isActive = hoveredId === edge.from || hoveredId === edge.to;
        return (
          <Line
            key={i}
            points={[from.position, to.position]}
            color={isActive ? from.color : "rgba(255,255,255,0.08)"}
            lineWidth={isActive ? 1.5 : 0.5}
            transparent
            opacity={isActive ? 0.8 : 0.15}
          />
        );
      })}

      {/* Nodes */}
      {SKILLS.map((skill) => {
        const isHovered = hoveredId === skill.id;
        const isConnected = hoveredId ? EDGES.some(e => (e.from === hoveredId && e.to === skill.id) || (e.to === hoveredId && e.from === skill.id)) : false;
        const dimmed = hoveredId && !isHovered && !isConnected;

        return (
          <group key={skill.id} position={skill.position}>
            {/* Glow sphere */}
            <mesh>
              <sphereGeometry args={[skill.size * (isHovered ? 1.5 : 1), 16, 16]} />
              <meshBasicMaterial
                color={skill.color}
                transparent
                opacity={dimmed ? 0.08 : isHovered ? 0.9 : isConnected ? 0.7 : 0.5}
              />
            </mesh>

            {/* Invisible larger hitbox */}
            <mesh
              onPointerEnter={() => setHoveredId(skill.id)}
              onPointerLeave={() => setHoveredId(null)}
            >
              <sphereGeometry args={[0.5, 8, 8]} />
              <meshBasicMaterial transparent opacity={0} />
            </mesh>

            {/* Label */}
            <Text
              position={[0, skill.size * 1.6 + 0.1, 0]}
              fontSize={isHovered ? 0.16 : 0.11}
              color={isHovered ? skill.color : (dimmed ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.65)")}
              anchorX="center"
              anchorY="bottom"
              font="/fonts/JetBrainsMono-Regular.ttf"
            >
              {skill.label}
            </Text>
          </group>
        );
      })}
    </group>
  );
}

export default function ConstellationSection() {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const hoveredSkill = SKILLS.find(s => s.id === hoveredId);
  const connectedSkills = hoveredId
    ? EDGES.filter(e => e.from === hoveredId || e.to === hoveredId)
        .map(e => e.from === hoveredId ? e.to : e.from)
        .map(id => SKILLS.find(s => s.id === id))
        .filter(Boolean)
    : [];

  return (
    <section id="constellation" className="relative py-24 px-6 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(139,92,246,0.04), transparent)" }} />

      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-4 mb-3">
            <div className="glow-line w-12" />
            <span className="text-xs font-mono text-violet-400 tracking-widest uppercase">Skill Universe</span>
            <div className="glow-line w-12" />
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-white/90 mb-2">
            Chaque compétence est <span className="text-gradient-static">connectée</span>
          </h2>
          <p className="text-white/35 text-sm font-mono">Survolez une étoile pour voir ses connexions · La constellation tourne en continu</p>
        </div>

        <div className="relative" style={{ height: 480 }}>
          {/* Three.js Canvas */}
          <Canvas camera={{ position: [0, 0, 7], fov: 55 }}>
            <Suspense fallback={null}>
              <ambientLight intensity={0.1} />
              <pointLight position={[5, 5, 5]} intensity={0.4} color="#00d4ff" />
              <pointLight position={[-5, -5, -5]} intensity={0.3} color="#8b5cf6" />
              <ConstellationScene hoveredId={hoveredId} setHoveredId={setHoveredId} />
            </Suspense>
          </Canvas>

          {/* Hover info panel */}
          {hoveredSkill && (
            <div
              className="absolute top-4 right-4 glass rounded-xl p-4 border border-white/10 min-w-[180px]"
              style={{ zIndex: 10 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full" style={{ background: hoveredSkill.color }} />
                <span className="font-bold text-white/90">{hoveredSkill.label}</span>
              </div>
              <div className="text-[10px] font-mono px-2 py-0.5 rounded inline-block mb-2" style={{ background: `${hoveredSkill.color}18`, color: hoveredSkill.color }}>
                {hoveredSkill.category.toUpperCase()}
              </div>
              {connectedSkills.length > 0 && (
                <>
                  <div className="text-[10px] text-white/30 font-mono mb-1">Connexions :</div>
                  <div className="flex flex-wrap gap-1">
                    {connectedSkills.map(s => s && (
                      <span key={s.id} className="text-[10px] px-1.5 py-0.5 rounded font-mono" style={{ background: `${s.color}15`, color: s.color, border: `1px solid ${s.color}30` }}>
                        {s.label}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Mobile fallback hint */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-mono text-white/20">
            Drag · Zoom · Hover
          </div>
        </div>
      </div>
    </section>
  );
}
