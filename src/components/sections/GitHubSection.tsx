"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";
import { ExternalLink, Star, GitFork, Code2 } from "lucide-react";

interface GitHubStats {
    public_repos: number;
    followers: number;
    following: number;
    public_gists: number;
    login: string;
    name: string;
    bio: string;
    avatar_url: string;
}

interface Repo {
    name: string;
    description: string | null;
    stargazers_count: number;
    forks_count: number;
    language: string | null;
    html_url: string;
    topics: string[];
}

const LANG_COLORS: Record<string, string> = {
    Python: "#3572A5",
    TypeScript: "#3178c6",
    JavaScript: "#f1e05a",
    Java: "#b07219",
    "C#": "#178600",
    PHP: "#4F5D95",
    SQL: "#336791",
    Shell: "#89e051",
    Jupyter: "#DA5B0B",
};

export default function GitHubSection() {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, amount: 0.1 });
    const [stats, setStats] = useState<GitHubStats | null>(null);
    const [repos, setRepos] = useState<Repo[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isInView) return;
        setLoading(true);

        const fetchData = async () => {
            try {
                const [userRes, reposRes] = await Promise.all([
                    fetch("https://api.github.com/users/yoannbeugre"),
                    fetch("https://api.github.com/users/yoannbeugre/repos?sort=updated&per_page=6"),
                ]);

                if (userRes.ok) {
                    const userData = await userRes.json();
                    setStats(userData);
                }

                if (reposRes.ok) {
                    const reposData = await reposRes.json();
                    setRepos(Array.isArray(reposData) ? reposData : []);
                }
            } catch {
                // Graceful degradation — GitHub API peut être rate-limited
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [isInView]);

    return (
        <section id="github" className="relative py-32 px-6 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/10 to-transparent" />

            <div ref={ref} className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    className="mb-16"
                    initial={{ opacity: 0, y: 40 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.7 }}
                >
                    <div className="flex items-center gap-4 mb-4">
                        <div className="glow-line w-16" />
                        <span className="text-xs font-mono text-cyan-400 tracking-widest uppercase">
                            07 / GitHub
                        </span>
                    </div>
                    <h2 className="text-4xl md:text-6xl font-black text-white/90 leading-tight">
                        Code ouvert,{" "}
                        <span className="text-gradient-static">systèmes réels</span>
                    </h2>
                </motion.div>

                {/* Stats row */}
                <motion.div
                    className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6, delay: 0.2 }}
                >
                    {[
                        { label: "Repositories", value: stats?.public_repos ?? "—", icon: Code2 },
                        { label: "Followers", value: stats?.followers ?? "—", icon: Star },
                        { label: "Contributions", value: "500+", icon: GitFork },
                        { label: "Languages", value: "7+", icon: Code2 },
                    ].map((stat, i) => (
                        <div key={stat.label} className="glass rounded-xl p-5 border border-white/5 text-center">
                            <div className="text-3xl font-black text-gradient-static mb-1">
                                {loading ? (
                                    <div className="h-8 w-12 bg-white/10 rounded animate-pulse mx-auto" />
                                ) : (
                                    stat.value
                                )}
                            </div>
                            <div className="text-xs font-mono text-white/40">{stat.label}</div>
                        </div>
                    ))}
                </motion.div>

                {/* Profile card + repos */}
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Profile */}
                    <motion.div
                        className="glass rounded-2xl p-6 border border-white/8 flex flex-col items-center text-center"
                        initial={{ opacity: 0, x: -30 }}
                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 0.6, delay: 0.3 }}
                    >
                        {stats?.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={stats.avatar_url}
                                alt="GitHub avatar"
                                className="w-24 h-24 rounded-full border-2 border-cyan-400/30 mb-4"
                            />
                        ) : (
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center text-3xl font-bold text-black mb-4">
                                YB
                            </div>
                        )}
                        <div className="text-white/90 font-bold text-lg">
                            {stats?.name || "Yoann Beugré"}
                        </div>
                        <div className="text-cyan-400 text-sm font-mono mt-0.5">
                            @{stats?.login || "yoannbeugre"}
                        </div>
                        {stats?.bio && (
                            <p className="text-white/40 text-sm mt-3 leading-relaxed">{stats.bio}</p>
                        )}
                        <a
                            href="https://github.com/yoannbeugre"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-5 flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/15 text-white/60 hover:text-white hover:border-white/30 hover:bg-white/5 transition-all text-sm font-medium"
                        >
                            <span>Voir le profil</span>
                            <ExternalLink size={14} />
                        </a>
                    </motion.div>

                    {/* Repos */}
                    <div className="lg:col-span-2 grid sm:grid-cols-2 gap-4">
                        {loading
                            ? Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="glass rounded-xl p-5 border border-white/5 animate-pulse">
                                    <div className="h-4 bg-white/10 rounded w-3/4 mb-3" />
                                    <div className="h-3 bg-white/5 rounded w-full mb-2" />
                                    <div className="h-3 bg-white/5 rounded w-2/3" />
                                </div>
                            ))
                            : repos.slice(0, 4).map((repo, i) => (
                                <motion.a
                                    key={repo.name}
                                    href={repo.html_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="glass rounded-xl p-5 border border-white/5 hover:border-white/15 transition-all duration-300 group block"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                                    transition={{ duration: 0.4, delay: 0.4 + i * 0.08 }}
                                    whileHover={{ y: -3 }}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <h3 className="text-sm font-semibold text-white/80 group-hover:text-white transition-colors">
                                            {repo.name}
                                        </h3>
                                        <ExternalLink size={12} className="text-white/20 group-hover:text-white/60 flex-shrink-0 mt-0.5" />
                                    </div>
                                    <p className="text-xs text-white/40 leading-relaxed line-clamp-2 mb-3">
                                        {repo.description || "No description"}
                                    </p>
                                    <div className="flex items-center gap-4">
                                        {repo.language && (
                                            <div className="flex items-center gap-1.5">
                                                <div
                                                    className="w-2 h-2 rounded-full"
                                                    style={{ backgroundColor: LANG_COLORS[repo.language] || "#64748b" }}
                                                />
                                                <span className="text-xs text-white/30 font-mono">{repo.language}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-1 text-white/30">
                                            <Star size={11} />
                                            <span className="text-xs font-mono">{repo.stargazers_count}</span>
                                        </div>
                                    </div>
                                </motion.a>
                            ))}

                        {repos.length === 0 && !loading && (
                            <div className="sm:col-span-2 text-center py-8 text-white/30 text-sm font-mono">
                                Repositories chargés dynamiquement depuis l&apos;API GitHub
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
