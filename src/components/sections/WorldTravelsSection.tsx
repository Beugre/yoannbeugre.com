"use client";

import { useRef, useMemo, Suspense, useState, useEffect, useCallback } from "react";
import { Canvas, useFrame, useThree, useLoader } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import * as THREE from "three";
import { motion } from "framer-motion";

const VISITED: Record<string, { name: string; flag: string; cities: string[] }> = {
  FRA: { name: "France", flag: "🇫🇷", cities: ["Bordeaux ⚑", "Paris", "Toulouse", "Rennes", "Poitiers", "Biarritz", "La Réunion"] },
  CIV: { name: "Côte d'Ivoire", flag: "🇨🇮", cities: ["Abidjan ⚑", "Yamoussoukro", "Grand Bassam"] },
  ESP: { name: "Espagne", flag: "🇪🇸", cities: ["Barcelone", "Madrid", "San Sebastián", "Bilbao"] },
  GBR: { name: "Royaume-Uni", flag: "🇬🇧", cities: ["Londres"] },
  BEL: { name: "Belgique", flag: "🇧🇪", cities: ["Bruxelles"] },
  CHE: { name: "Suisse", flag: "🇨🇭", cities: ["Lausanne"] },
  ITA: { name: "Italie", flag: "🇮🇹", cities: ["Milan"] },
  PRT: { name: "Portugal", flag: "🇵🇹", cities: ["Faro", "Porto"] },
  TUR: { name: "Turquie", flag: "🇹🇷", cities: ["Istanbul"] },
  ARE: { name: "Émirats Arabes", flag: "🇦🇪", cities: ["Dubai", "Abu Dhabi"] },
  SGP: { name: "Singapour", flag: "🇸🇬", cities: ["Singapour"] },
  IDN: { name: "Indonésie", flag: "🇮🇩", cities: ["Bali"] },
  USA: { name: "États-Unis", flag: "🇺🇸", cities: ["New York", "Niagara Falls"] },
  CAN: { name: "Canada", flag: "🇨🇦", cities: ["Toronto", "Montréal", "Niagara Falls"] },
  MAR: { name: "Maroc", flag: "🇲🇦", cities: ["Marrakech", "Casablanca", "Rabat"] },
  GHA: { name: "Ghana", flag: "🇬🇭", cities: ["Accra"] },
  MUS: { name: "Île Maurice", flag: "🇲🇺", cities: ["Île Maurice"] },
};

type GeoFeature = { properties: Record<string, string>; geometry: { type: string; coordinates: unknown } };
type GeoData = { features: GeoFeature[] };

function pointInPoly(px: number, py: number, ring: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function findCountry(lat: number, lng: number, geoData: GeoData): GeoFeature | null {
  for (const f of geoData.features) {
    const geom = f.geometry;
    const rings: number[][][] = geom.type === "Polygon"
      ? [(geom.coordinates as number[][][])[0]]
      : geom.type === "MultiPolygon"
        ? (geom.coordinates as number[][][][]).map(p => p[0])
        : [];
    for (const ring of rings) {
      if (ring && pointInPoly(lng, lat, ring)) return f;
    }
  }
  return null;
}

function getISO(f: GeoFeature): string {
  return (f.properties.ISO_A3 || f.properties.iso_a3 || f.properties.id || "").toUpperCase();
}

function createOverlayTexture(geoData: GeoData): THREE.CanvasTexture {
  const W = 2048, H = 1024;
  const cv = document.createElement("canvas");
  cv.width = W; cv.height = H;
  const ctx = cv.getContext("2d")!;
  ctx.clearRect(0, 0, W, H);

  const proj = (lng: number, lat: number): [number, number] => [
    ((lng + 180) / 360) * W,
    ((90 - lat) / 180) * H,
  ];

  const drawRing = (ring: number[][], visited: boolean) => {
    if (!ring?.length) return;
    ctx.beginPath();
    ring.forEach(([lng, lat], i) => {
      const [x, y] = proj(lng, lat);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.closePath();
    if (visited) {
      ctx.save();
      ctx.shadowColor = "rgba(240,185,11,0.7)";
      ctx.shadowBlur = 14;
      ctx.fillStyle = "rgba(240,185,11,0.22)";
      ctx.fill();
      ctx.restore();
      ctx.strokeStyle = "rgba(240,185,11,0.9)";
      ctx.lineWidth = 1.5;
    } else {
      ctx.strokeStyle = "rgba(60,120,220,0.18)";
      ctx.lineWidth = 0.4;
    }
    ctx.stroke();
  };

  for (const f of geoData.features) {
    const iso = getISO(f);
    const visited = !!VISITED[iso];
    const geom = f.geometry;
    if (!geom) continue;
    const rings: number[][][] = geom.type === "Polygon"
      ? [(geom.coordinates as number[][][])[0]]
      : geom.type === "MultiPolygon"
        ? (geom.coordinates as number[][][][]).map(p => p[0])
        : [];
    rings.forEach(r => drawRing(r, visited));
  }
  return new THREE.CanvasTexture(cv);
}

type HoverPayload = { country: typeof VISITED[string]; x: number; y: number } | null;

function GlobeScene({ geoData, onHover }: { geoData: GeoData | null; onHover: (h: HoverPayload) => void }) {
  const groupRef = useRef<THREE.Group>(null);
  const { camera, gl } = useThree();

  const nightTex = useLoader(THREE.TextureLoader, "//unpkg.com/three-globe/example/img/earth-night.jpg");
  const bumpTex  = useLoader(THREE.TextureLoader, "//unpkg.com/three-globe/example/img/earth-topology.png");

  const overlayTex = useMemo(() => {
    if (!geoData) return null;
    return createOverlayTexture(geoData);
  }, [geoData]);

  useFrame((_, dt) => { if (groupRef.current) groupRef.current.rotation.y += dt * 0.09; });

  useEffect(() => {
    const canvas = gl.domElement;
    let last = 0;
    const onMove = (e: MouseEvent) => {
      const now = Date.now();
      if (now - last < 60) return;
      last = now;
      const rect = canvas.getBoundingClientRect();
      const ray = new THREE.Raycaster();
      ray.setFromCamera(
        new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1),
        camera
      );
      const hit = new THREE.Vector3();
      if (!ray.ray.intersectSphere(new THREE.Sphere(new THREE.Vector3(), 1), hit)) { onHover(null); return; }
      const rotY = -(groupRef.current?.rotation.y || 0);
      const c = Math.cos(rotY), s = Math.sin(rotY);
      const rx = hit.x * c - hit.z * s;
      const rz = hit.x * s + hit.z * c;
      const lat = Math.asin(Math.max(-1, Math.min(1, hit.y))) * 180 / Math.PI;
      const lng = Math.atan2(rz, -rx) * 180 / Math.PI;
      const feature = geoData ? findCountry(lat, lng, geoData) : null;
      if (!feature) { onHover(null); return; }
      const iso = getISO(feature);
      const info = VISITED[iso];
      onHover(info ? { country: info, x: e.clientX - rect.left, y: e.clientY - rect.top } : null);
    };
    canvas.addEventListener("mousemove", onMove);
    return () => canvas.removeEventListener("mousemove", onMove);
  }, [camera, gl, geoData, onHover]);

  return (
    <group ref={groupRef}>
      <mesh>
        <sphereGeometry args={[1, 64, 64]} />
        <meshPhongMaterial map={nightTex} bumpMap={bumpTex} bumpScale={0.04} specular={new THREE.Color(0x111111)} shininess={4} />
      </mesh>
      {overlayTex && (
        <mesh>
          <sphereGeometry args={[1.002, 64, 64]} />
          <meshBasicMaterial map={overlayTex} transparent depthWrite={false} />
        </mesh>
      )}
      <mesh>
        <sphereGeometry args={[1.06, 32, 32]} />
        <meshBasicMaterial color="#0044cc" transparent opacity={0.05} side={THREE.BackSide} />
      </mesh>
    </group>
  );
}

const CONTINENT_STATS = [
  { label: "Europe", count: 9, color: "#00d4ff", flag: "🇪🇺" },
  { label: "Afrique", count: 6, color: "#f97316", flag: "🌍" },
  { label: "Asie / MO", count: 4, color: "#8b5cf6", flag: "🌏" },
  { label: "Amériques", count: 2, color: "#10b981", flag: "🌎" },
];

export default function WorldTravelsSection() {
  const [geoData, setGeoData] = useState<GeoData | null>(null);
  const [hoverInfo, setHoverInfo] = useState<HoverPayload>(null);

  useEffect(() => {
    fetch("/countries.geojson")
      .then(r => r.json()).then(setGeoData).catch(() => {});
  }, []);

  const handleHover = useCallback((h: HoverPayload) => setHoverInfo(h), []);

  return (
    <section id="travels" className="relative py-16 md:py-32 px-4 md:px-6 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-950/5 to-transparent pointer-events-none" />
      <div className="max-w-7xl mx-auto">

        <motion.div className="mb-10 text-center"
          initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.7 }}>
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="glow-line w-16" />
            <span className="text-xs font-mono text-cyan-400 tracking-widest uppercase">08 / World Travels</span>
            <div className="glow-line w-16" />
          </div>
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-white/90 leading-tight mb-3">
            Pays <span className="text-gradient-static">visités</span> dans le monde
          </h2>
          <p className="text-white/40 max-w-2xl mx-auto text-sm">
            <span className="text-white font-semibold">⚑ Bordeaux & Abidjan</span> — mes deux bases.{" "}
            <span className="text-yellow-400 font-semibold">{Object.keys(VISITED).length} pays</span> visités · 4 continents — survole le globe pour voir les villes
          </p>
        </motion.div>

        <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8"
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.2 }}>
          {CONTINENT_STATS.map(s => (
            <div key={s.label} className="glass rounded-xl p-4 text-center border border-white/5">
              <div className="text-2xl mb-1">{s.flag}</div>
              <div className="text-2xl font-black mb-0.5" style={{ color: s.color }}>{s.count}</div>
              <div className="text-xs font-mono text-white/40">{s.label}</div>
            </div>
          ))}
        </motion.div>

        <div className="relative rounded-2xl overflow-hidden" style={{ height: 540, background: "radial-gradient(ellipse at 50% 50%, #00050f 0%, #000208 100%)" }}>

          {hoverInfo && (
            <motion.div
              className="absolute z-20 pointer-events-none glass border border-yellow-400/40 rounded-xl px-4 py-3 shadow-2xl"
              style={{ left: Math.max(10, Math.min(hoverInfo.x + 12, 540)), top: Math.max(10, hoverInfo.y - 60), minWidth: 180 }}
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.15 }}
            >
              <div className="text-sm font-bold text-white/90 mb-2 flex items-center gap-2">
                <span>{hoverInfo.country.flag}</span>
                <span>{hoverInfo.country.name}</span>
              </div>
              {hoverInfo.country.cities.map(c => (
                <div key={c} className="text-[11px] font-mono text-yellow-400/80">— {c}</div>
              ))}
            </motion.div>
          )}

          <div className="absolute inset-0 z-0">
            <Canvas camera={{ position: [0, 0, 2.5], fov: 45 }} gl={{ antialias: true, alpha: true }}>
              <ambientLight intensity={0.08} />
              <directionalLight position={[5, 3, 5]} intensity={0.9} />
              <pointLight position={[-5, -3, -3]} intensity={0.2} color="#0033aa" />
              <Stars radius={100} depth={50} count={3500} factor={4} saturation={0} fade speed={0.2} />
              <Suspense fallback={null}>
                <GlobeScene geoData={geoData} onHover={handleHover} />
              </Suspense>
            </Canvas>
          </div>

          <div className="absolute bottom-4 left-4 flex items-center gap-4 text-[10px] font-mono z-10">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-2 rounded" style={{ background: "rgba(240,185,11,0.4)", border: "1px solid rgba(240,185,11,0.8)" }} />
              <span className="text-white/35">Pays visité — hover pour détail</span>
            </div>
          </div>
          {!geoData && (
            <div className="absolute inset-0 flex items-end justify-center pb-8 pointer-events-none z-10">
              <span className="text-white/20 text-xs font-mono animate-pulse">Chargement des frontières...</span>
            </div>
          )}
        </div>

        <motion.div className="mt-8 glass rounded-2xl border border-white/5 p-6"
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
          viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.5 }}>
          <div className="text-xs font-mono text-white/30 mb-4 uppercase tracking-widest">
            {Object.keys(VISITED).length} pays · {Object.values(VISITED).reduce((a, v) => a + v.cities.length, 0)} villes
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {Object.entries(VISITED).map(([, info]) => (
              <div key={info.name} className="rounded-xl p-3 border border-yellow-400/15 bg-yellow-400/5 hover:border-yellow-400/40 transition-all">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="text-base">{info.flag}</span>
                  <span className="text-[11px] font-bold text-white/80 truncate">{info.name}</span>
                </div>
                {info.cities.map(c => (
                  <div key={c} className="text-[10px] font-mono text-yellow-400/55">— {c}</div>
                ))}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
