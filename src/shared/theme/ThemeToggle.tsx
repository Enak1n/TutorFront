import { useTheme } from './ThemeContext';
import styles from './ThemeToggle.module.scss';

interface ThemeToggleProps {
    className?: string;
}

const SunIcon = () => (
    <svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.2' strokeLinecap='round' aria-hidden='true'>
        <circle cx='12' cy='12' r='4' />
        <path d='M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41' />
    </svg>
);

const MoonIcon = () => (
    <svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
        <path d='M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11Z' />
    </svg>
);

export const ThemeToggle = ({ className }: ThemeToggleProps) => {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';
    const label = isDark ? 'Включить светлую тему' : 'Включить тёмную тему';

    return (
        <button
            type='button'
            className={[styles.toggle, className].filter(Boolean).join(' ')}
            onClick={toggleTheme}
            aria-label={label}
            title={label}
        >
            <span className={`${styles.icon} ${isDark ? styles.hidden : ''}`}>
                <SunIcon />
            </span>
            <span className={`${styles.icon} ${isDark ? '' : styles.hidden}`}>
                <MoonIcon />
            </span>
        </button>
    );
};
