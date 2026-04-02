import type React from "react"
import {ConnectedPerson} from "@api/my-person";
// @ts-ignore
import styles from "./PersonCardComponent.module.scss"
import { useSSE } from "../../shared/sse/SSEComponent/SSEContext";

interface PersonCardProps {
    person: ConnectedPerson;
    onClick: (userId: string) => void;
    onMessageClick: (userId: string) => void;
}

export const PersonCard: React.FC<PersonCardProps> = ({ person, onClick, onMessageClick }) => {

    const { sseData } = useSSE();
    const userStatus = sseData.userPresence[person.id];
    const isOnline = userStatus === 'online';

    const handleMessageClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onMessageClick(person.id);
    };

    return (
        <div
            className={styles.personCard}
            onClick={() => onClick(person.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    onClick(person.id);
                }
            }}
        >
            <div className={styles.photoContainer}>
                <img
                    src={person.photoUrl}
                    alt={`Фото ${person.firstName} ${person.lastName}`}
                    className={styles.personPhoto}
                />
                {isOnline && (
                    <span className={styles.statusIndicator} />
                )}
            </div>
            <div className={styles.personName}>
                {person.firstName} {person.lastName}
            </div>
            <div className={styles.cardActions}>
                <div className={styles.viewProfileHint}>
                    Посмотреть профиль
                </div>

                <button
                    className={styles.messageButton}
                    onClick={handleMessageClick}
                >
                    Написать сообщение
                </button>
            </div>
        </div>
    );
};