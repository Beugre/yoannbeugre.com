"use client";
import dynamic from "next/dynamic";

const WorldTravelsSection = dynamic(
    () => import("@/components/sections/WorldTravelsSection"),
    { ssr: false, loading: () => <div className="h-96 flex items-center justify-center text-white/20 font-mono text-sm">Loading globe...</div> }
);

export default WorldTravelsSection;
