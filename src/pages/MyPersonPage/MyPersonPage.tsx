import React, { useState, useEffect } from 'react';
import { MyPersonPageProps, ConnectedPerson, getPersons, getChatId } from "@api/my-person";
import { PersonCard } from "./PersonCardComponent";
// @ts-ignore
import styles from "./MyPersonPage.module.scss"
// @ts-ignore
import loading_list from '@images/loading_drop_list.gif'

const MyPersonPage: React.FC<MyPersonPageProps> = ({ userRole, navigateToProfile, navigateToChat }) => {
    const [persons, setPersons] = useState<ConnectedPerson[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    if (userRole === null) {
        return (
            <div
                className={styles.loading}
                style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "100vh",
                }}
            >
                <img src={loading_list} alt="Загрузка списка..." style={{ width: '80px', height: '80px', marginBottom: '10px' }}/>
                <div>Загрузка данных...</div>
            </div>
        );
    }

    const pageTitle = userRole === 'tutor'
        ? "Мои ученики"
        : userRole === 'student_or_parent'
            ? "Мои репетиторы"
            : "Связи";

    useEffect(() => {
        if (userRole === 'admin') {
            setIsLoading(false);
            setError("Страница 'Связи' для администратора имеет другую логику.");
            return;
        }

        setIsLoading(true);
        setError(null);

        const fetchPersons = async () => {
            try {
                const data = await getPersons();
                setPersons(data);

            } catch (err: any) {
                const errorMessage = (err.response && err.response.data && err.response.data.message)
                    ? `Ошибка: ${err.response.data.message}`
                    : "Не удалось загрузить список.";

                setError(errorMessage);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPersons();

    }, [userRole]);

    const handleCardClick = (userId: string) => {
        navigateToProfile(userId);
    };

    const handleMessageClick = async (otherUserId: string) => {
        try {
            const chatId = await getChatId(otherUserId);
            navigateToChat(chatId);

        } catch (error) {
            setError("Не удалось начать чат. Попробуйте позже.");
        }
    };

    if (isLoading) {
        return (
            <div
                className={styles.loading}
                style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "100vh",
                }}
            >
                <img
                    src={loading_list}
                    alt="Загрузка списка..."
                    style={{
                        width: '80px',
                        height: '80px',
                        marginBottom: '10px'
                    }}
                />
                <div>Загрузка данных...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.pageContainer}>
                <h1 className={styles.title}>{pageTitle}</h1>
                <div className={`${styles.statusMessage} ${styles.error}`}>
                    Ошибка: {error}
                </div>
            </div>
        );
    }

    return (
        <div className={styles.pageContainer}>
            <h1 className={styles.title}>{pageTitle}</h1>

            {persons.length === 0 ? (
                <div className={styles.statusMessage}>
                    {userRole === 'tutor' ? "У вас пока нет учеников." : "У вас пока нет репетиторов."}
                </div>
            ) : (
                <div className={styles.cardGrid}>
                    {persons.map(person => (
                        <PersonCard
                            key={person.id}
                            person={person}
                            onClick={handleCardClick}
                            onMessageClick={handleMessageClick}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyPersonPage;