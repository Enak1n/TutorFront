import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

interface ThemeContextValue {
    preference: ThemePreference;
    theme: ResolvedTheme;
    setPreference: (preference: ThemePreference) => void;
    toggleTheme: () => void;
}

// Тот же ключ читает inline-скрипт в index.html, чтобы не было «вспышки» светлой темы.
const STORAGE_KEY = 'theme';

const readPreference = (): ThemePreference => {
    try {
        const value = window.localStorage.getItem(STORAGE_KEY);
        return value === 'light' || value === 'dark' ? value : 'system';
    } catch {
        return 'system';
    }
};

const getSystemTheme = (): ResolvedTheme =>
    window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [preference, setPreferenceState] = useState<ThemePreference>(readPreference);
    const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(getSystemTheme);

    useEffect(() => {
        const media = window.matchMedia?.('(prefers-color-scheme: dark)');
        if (!media) return;

        const onChange = (event: MediaQueryListEvent) => setSystemTheme(event.matches ? 'dark' : 'light');
        media.addEventListener('change', onChange);
        return () => media.removeEventListener('change', onChange);
    }, []);

    const theme: ResolvedTheme = preference === 'system' ? systemTheme : preference;

    useEffect(() => {
        document.documentElement.dataset.theme = theme;
    }, [theme]);

    const setPreference = useCallback((next: ThemePreference) => {
        setPreferenceState(next);
        try {
            if (next === 'system') window.localStorage.removeItem(STORAGE_KEY);
            else window.localStorage.setItem(STORAGE_KEY, next);
        } catch {
            // localStorage недоступен — тема просто не запомнится.
        }
    }, []);

    const toggleTheme = useCallback(() => {
        setPreference(theme === 'dark' ? 'light' : 'dark');
    }, [theme, setPreference]);

    const value = useMemo(
        () => ({ preference, theme, setPreference, toggleTheme }),
        [preference, theme, setPreference, toggleTheme],
    );

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) throw new Error('useTheme должен использоваться внутри ThemeProvider');
    return context;
};
