"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { translations, Lang } from "@/lib/translations";

interface LangCtx {
    lang: Lang;
    setLang: (l: Lang) => void;
    t: typeof translations.fr;
}

const LanguageContext = createContext<LangCtx>({
    lang: "fr",
    setLang: () => { },
    t: translations.fr,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [lang, setLangState] = useState<Lang>("fr");

    const setLang = (l: Lang) => {
        setLangState(l);
        if (typeof document !== "undefined") {
            document.documentElement.lang = l;
        }
    };

    return (
        <LanguageContext.Provider value={{ lang, setLang, t: translations[lang] }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLang() {
    return useContext(LanguageContext);
}
