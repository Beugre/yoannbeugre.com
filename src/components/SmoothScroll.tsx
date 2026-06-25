"use client";

import { useEffect } from "react";
import Lenis from "lenis";

export default function SmoothScroll() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.1,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    // Expose globally for other components
    (window as unknown as Record<string, unknown>).__lenis = lenis;

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Listen for custom scroll events from Navigation
    const onScrollTo = (e: Event) => {
      const { target, offset } = (e as CustomEvent).detail;
      lenis.scrollTo(target, { offset: offset ?? -64 });
    };
    window.addEventListener("lenis:scrollTo", onScrollTo);

    return () => {
      window.removeEventListener("lenis:scrollTo", onScrollTo);
      lenis.destroy();
    };
  }, []);

  return null;
}
