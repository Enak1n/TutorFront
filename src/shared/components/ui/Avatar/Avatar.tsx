import { useState } from 'react';
import styles from './Avatar.module.scss';

interface AvatarProps {
    src?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    size?: number;
    /** Показывать индикатор статуса: true — в сети, false — не в сети, undefined — без индикатора. */
    online?: boolean;
    className?: string;
}

const PALETTE_SIZE = 6;

const getInitials = (firstName?: string | null, lastName?: string | null) =>
    `${firstName?.trim()[0] ?? ''}${lastName?.trim()[0] ?? ''}`.toUpperCase() || '?';

/** Стабильный цвет фона по имени, чтобы у одного человека аватар всегда был одного цвета. */
const getTone = (seed: string) => {
    let hash = 0;
    for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) | 0;
    return Math.abs(hash) % PALETTE_SIZE;
};

export const Avatar = ({ src, firstName, lastName, size = 44, online, className }: AvatarProps) => {
    const [failed, setFailed] = useState(false);
    const name = [firstName, lastName].filter(Boolean).join(' ');
    const showImage = !!src && !failed;

    return (
        <span
            className={[styles.avatar, styles[`tone${getTone(name || '?')}`], className].filter(Boolean).join(' ')}
            style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
        >
            {showImage ? (
                <img src={src!} alt={name} onError={() => setFailed(true)} />
            ) : (
                <span aria-hidden='true'>{getInitials(firstName, lastName)}</span>
            )}

            {online !== undefined && (
                <span
                    className={`${styles.status} ${online ? styles.statusOnline : styles.statusOffline}`}
                    title={online ? 'В сети' : 'Не в сети'}
                    aria-label={online ? 'В сети' : 'Не в сети'}
                />
            )}
        </span>
    );
};
