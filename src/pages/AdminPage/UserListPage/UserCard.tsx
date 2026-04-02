import type React from "react"
import { UserListUser } from "@api/user-list";
// @ts-ignore
import styles from "./UserCard.module.scss"
import { useSSE } from "../../../shared/sse/SSEComponent/SSEContext";

interface UserCardProps {
    user: UserListUser;
    onClick: (userId: string) => void;
}

export const UserCard: React.FC<UserCardProps> = ({ user, onClick }) => {
    const { sseData } = useSSE();
    const userStatus = sseData.userPresence[user.id];
    const isOnline = userStatus === 'online';

    const roleLabel = (roleId: string) => {
        switch (roleId) {
            case 'tutor': return 'Репетитор';
            case 'student_or_parent': return 'Ученик/Родитель';
            case 'admin': return 'Администратор';
            default: return roleId;
        }
    }

    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('ru-RU');
        } catch {
            return 'Дата неизвестна';
        }
    }

    return (
        <div
            className={styles.userCard}
            onClick={() => onClick(user.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    onClick(user.id);
                }
            }}
        >
            <div className={styles.photoContainer}>
                <img
                    src={user.photoUrl}
                    alt={`Фото ${user.firstName} ${user.lastName || ''}`}
                    className={styles.userPhoto}
                />
                {isOnline && (
                    <span className={styles.statusIndicator} />
                )}
            </div>
            <div className={styles.userInfo}>
                <div className={styles.userName}>
                    {user.firstName} {user.lastName}
                </div>
                <div className={styles.userRole}>
                    {roleLabel(user.role.id)}
                </div>
                <div className={styles.userUsername}>
                    @{user.username}
                </div>
                <div className={styles.registeredOn}>
                    <span className={styles.dateLabel}>Рег.:</span> {formatDate(user.registeredOn)}
                </div>
            </div>
            <div className={styles.viewProfileHint}>
                Посмотреть профиль &raquo;
            </div>
        </div>
    );
};