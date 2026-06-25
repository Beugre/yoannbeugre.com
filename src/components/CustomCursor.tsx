"use client";

import { useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const followerRef = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  const springConfig = { damping: 25, stiffness: 300, mass: 0.5 };
  const followerX = useSpring(mouseX, { damping: 35, stiffness: 150, mass: 0.8 });
  const followerY = useSpring(mouseY, { damping: 35, stiffness: 150, mass: 0.8 });

  useEffect(() => {
    // Ne s'affiche que sur desktop
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const onMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    const onEnterLink = () => {
      cursorRef.current?.classList.add("scale-150", "opacity-80");
      followerRef.current?.classList.add("scale-150", "border-cyan-400/80");
    };
    const onLeaveLink = () => {
      cursorRef.current?.classList.remove("scale-150", "opacity-80");
      followerRef.current?.classList.remove("scale-150", "border-cyan-400/80");
    };

    window.addEventListener("mousemove", onMove);

    const links = document.querySelectorAll("a, button, [data-cursor]");
    links.forEach((el) => {
      el.addEventListener("mouseenter", onEnterLink);
      el.addEventListener("mouseleave", onLeaveLink);
    });

    return () => {
      window.removeEventListener("mousemove", onMove);
    };
  }, [mouseX, mouseY]);

  return (
    <>
      {/* Dot */}
      <motion.div
        ref={cursorRef}
        className="fixed top-0 left-0 w-3 h-3 rounded-full bg-cyan-400 pointer-events-none z-[9999] mix-blend-difference transition-transform duration-100"
        style={{
          x: mouseX,
          y: mouseY,
          translateX: "-50%",
          translateY: "-50%",
        }}
      />
      {/* Ring follower */}
      <motion.div
        ref={followerRef}
        className="fixed top-0 left-0 w-9 h-9 rounded-full border border-cyan-400/40 pointer-events-none z-[9998] transition-all duration-200"
        style={{
          x: followerX,
          y: followerY,
          translateX: "-50%",
          translateY: "-50%",
        }}
      />
    </>
  );
}
