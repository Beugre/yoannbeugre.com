import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Yoann Beugré — Software Engineer · AI Engineer · Quant Developer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          background: "#030712",
          padding: "72px 80px",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Grid background */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(rgba(0,212,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(0,212,255,0.04) 1px,transparent 1px)",
          backgroundSize: "60px 60px",
        }} />
        {/* Glow */}
        <div style={{
          position: "absolute", top: -100, right: -100,
          width: 500, height: 500,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)",
        }} />
        <div style={{
          position: "absolute", bottom: -80, left: 0,
          width: 400, height: 400,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0,212,255,0.1) 0%, transparent 70%)",
        }} />

        {/* Badge */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10, marginBottom: 32,
          background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.2)",
          borderRadius: 999, padding: "8px 20px",
        }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981" }} />
          <span style={{ color: "#00d4ff", fontSize: 14, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase" }}>
            Disponible — Bordeaux · Remote
          </span>
        </div>

        {/* Name */}
        <div style={{
          fontSize: 80, fontWeight: 900, lineHeight: 1,
          background: "linear-gradient(135deg, #ffffff 0%, rgba(255,255,255,0.75) 100%)",
          backgroundClip: "text", color: "transparent",
          marginBottom: 16,
          display: "flex",
        }}>
          Yoann Beugré
        </div>

        {/* Roles */}
        <div style={{
          fontSize: 26, fontWeight: 400, color: "rgba(255,255,255,0.5)",
          marginBottom: 48, letterSpacing: 0.5,
        }}>
          Software Engineer · AI Engineer · Quant Developer
        </div>

        {/* Tags */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {["Python", "TypeScript", "LangChain", "Trading Bot", "React / Next.js", "Binance API"].map((tag) => (
            <div key={tag} style={{
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8, padding: "8px 16px",
              color: "rgba(255,255,255,0.6)", fontSize: 16, fontWeight: 500,
              display: "flex",
            }}>
              {tag}
            </div>
          ))}
        </div>

        {/* URL */}
        <div style={{
          position: "absolute", bottom: 48, right: 80,
          color: "rgba(0,212,255,0.6)", fontSize: 18, fontWeight: 600, fontFamily: "monospace",
        }}>
          yoannbeugre.fr
        </div>
      </div>
    ),
    { ...size }
  );
}
