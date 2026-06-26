"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function GSAPReveal() {
    const initialized = useRef(false);

    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;

        // Wait for DOM
        const timer = setTimeout(() => {
            // Reveal each section header with cinematic entrance
            const headers = document.querySelectorAll("section h2");
            headers.forEach((el) => {
                gsap.fromTo(el,
                    { opacity: 0, y: 60, skewY: 2 },
                    {
                        opacity: 1, y: 0, skewY: 0, duration: 1, ease: "power4.out",
                        scrollTrigger: {
                            trigger: el,
                            start: "top 85%",
                            once: true,
                        }
                    }
                );
            });

            // Parallax on section backgrounds
            const sections = document.querySelectorAll("section");
            sections.forEach((section) => {
                const inner = section.querySelector("canvas, .absolute");
                if (inner) {
                    gsap.to(inner, {
                        yPercent: -15,
                        ease: "none",
                        scrollTrigger: {
                            trigger: section,
                            start: "top bottom",
                            end: "bottom top",
                            scrub: true,
                        }
                    });
                }
            });

            // Glass cards stagger on scroll (skip fixed elements — buttons, overlays)
            const cards = document.querySelectorAll(".glass");
            cards.forEach((card, i) => {
                if (window.getComputedStyle(card).position === "fixed") return;
                gsap.fromTo(card,
                    { opacity: 0, y: 30, scale: 0.97 },
                    {
                        opacity: 1, y: 0, scale: 1,
                        duration: 0.6, ease: "power3.out",
                        delay: (i % 4) * 0.06,
                        scrollTrigger: {
                            trigger: card,
                            start: "top 90%",
                            once: true,
                        }
                    }
                );
            });

            // Progress bar at top
            gsap.to(".gsap-progress", {
                width: "100%",
                ease: "none",
                scrollTrigger: {
                    trigger: "body",
                    start: "top top",
                    end: "bottom bottom",
                    scrub: true,
                }
            });

        }, 1200); // Wait after boot screen

        return () => {
            clearTimeout(timer);
            ScrollTrigger.getAll().forEach(t => t.kill());
        };
    }, []);

    return (
        <>
            {/* Reading progress bar */}
            <div className="fixed top-0 left-0 right-0 z-[55] h-0.5 bg-white/5 pointer-events-none">
                <div className="gsap-progress h-full w-0 bg-gradient-to-r from-cyan-400 via-violet-500 to-cyan-400" />
            </div>
        </>
    );
}
