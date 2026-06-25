export type AchievementId =
    | "BOOT"
    | "TERMINAL"
    | "KONAMI"
    | "TRADE_WIN"
    | "TRADE_DONE"
    | "ALL_PROJECTS"
    | "BOSS"
    | "MATRIX"
    | "AI_CHAT"
    | "EXPLORER";

export interface Achievement {
    id: AchievementId;
    title: string;
    icon: string;
    desc: string;
    rare?: boolean;
}

export const ACHIEVEMENTS: Record<AchievementId, Achievement> = {
    BOOT: { id: "BOOT", title: "System Online", icon: "⚡", desc: "Système initialisé" },
    TERMINAL: { id: "TERMINAL", title: "Hacker Mode", icon: "💻", desc: "Terminal activé" },
    KONAMI: { id: "KONAMI", title: "Old School Gamer", icon: "🎮", desc: "↑↑↓↓←→←→BA trouvé", rare: true },
    TRADE_WIN: { id: "TRADE_WIN", title: "Quant Instinct", icon: "📈", desc: "Score > algorithme IA", rare: true },
    TRADE_DONE: { id: "TRADE_DONE", title: "Risk Manager", icon: "⚡", desc: "Partie de trading terminée" },
    ALL_PROJECTS: { id: "ALL_PROJECTS", title: "Deep Dive", icon: "🔍", desc: "Tous les projets explorés" },
    BOSS: { id: "BOSS", title: "Mission Complete", icon: "🏆", desc: "Portfolio terminé !", rare: true },
    MATRIX: { id: "MATRIX", title: "Red Pill", icon: "🟢", desc: "Bienvenue dans la Matrice" },
    AI_CHAT: { id: "AI_CHAT", title: "Curious Mind", icon: "🤖", desc: "Conversation avec l'IA" },
    EXPLORER: { id: "EXPLORER", title: "Explorer", icon: "🗺️", desc: "50% du portfolio découvert" },
};

const listeners = new Set<(id: AchievementId) => void>();

export function subscribeAchievement(fn: (id: AchievementId) => void) {
    listeners.add(fn);
    return () => { listeners.delete(fn); };
}

export function unlockAchievement(id: AchievementId) {
    if (typeof window === "undefined") return;
    const key = `ach_${id}`;
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, Date.now().toString());
    listeners.forEach((fn) => fn(id));
}

export function isUnlocked(id: AchievementId): boolean {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem(`ach_${id}`);
}

export function getUnlockedCount(): number {
    if (typeof window === "undefined") return 0;
    return (Object.keys(ACHIEVEMENTS) as AchievementId[]).filter(isUnlocked).length;
}
