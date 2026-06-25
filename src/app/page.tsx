import Navigation from "@/components/Navigation";
import HeroSection from "@/components/sections/HeroSection";
import AboutSection from "@/components/sections/AboutSection";
import StatsSection from "@/components/sections/StatsSection";
import ExpertiseSection from "@/components/sections/ExpertiseSection";
import ProjectsSection from "@/components/sections/ProjectsSection";
import BTCPredictionChallenge from "@/components/sections/BTCPredictionChallenge";
import BuildTheBot from "@/components/sections/BuildTheBot";
import DebugSystem from "@/components/sections/DebugSystem";
import ExperienceSection from "@/components/sections/ExperienceSection";
import ArchitectureSection from "@/components/sections/ArchitectureSection";
import TechStackSection from "@/components/sections/TechStackSection";
import GitHubSection from "@/components/sections/GitHubSection";
import ContactSection from "@/components/sections/ContactSection";
import BossSection from "@/components/sections/BossSection";
import Footer from "@/components/Footer";

import CustomCursor from "@/components/CustomCursor";
import SmoothScroll from "@/components/SmoothScroll";
import EasterEggTerminal from "@/components/EasterEggTerminal";
import BootScreen from "@/components/BootScreen";
import AchievementsSystem from "@/components/AchievementsSystem";
import AIAssistant from "@/components/AIAssistant";
import MatrixRain from "@/components/MatrixRain";
import EasterEggs from "@/components/EasterEggs";
import ProgressTracker from "@/components/ProgressTracker";

export default function Home() {
  return (
    <main className="relative min-h-screen bg-[#030712] overflow-x-hidden">
      <BootScreen />
      <CustomCursor />
      <SmoothScroll />
      <MatrixRain />
      <EasterEggs />
      <AchievementsSystem />
      <ProgressTracker />
      <EasterEggTerminal />
      <AIAssistant />

      <Navigation />
      <HeroSection />
      <AboutSection />
      <StatsSection />
      <ExpertiseSection />
      <ProjectsSection />

      {/* Challenge Arena — 3 mini-jeux */}
      <BTCPredictionChallenge />
      <BuildTheBot />
      <DebugSystem />

      <ExperienceSection />
      <ArchitectureSection />
      <TechStackSection />
      <GitHubSection />
      <ContactSection />
      <BossSection />
      <Footer />

      <div className="pointer-events-none fixed inset-0 z-0" style={{ background: "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(0,212,255,0.05) 0%, transparent 60%)" }} />
    </main>
  );
}
