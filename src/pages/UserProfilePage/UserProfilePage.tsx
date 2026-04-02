import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useNavigate } from "react-router"
import { useAuth } from '@auth/AuthContext';
import { getUserProfile, updateUserProfile, UserUpdateData, deleteUser } from '@api/profile';
import { UserDetailedInfo } from '@api/auth';
import { useAlert } from '@components/ui/alert/AlertContext';
import { EditUserModal } from './EditUserModal';
// @ts-ignore
import styles from './UserProfilePage.module.scss';
// @ts-ignore
import loadingGif from '@images/loading_drop_list.gif';

const getRoleName = (roleId: string) => {
    switch (roleId) {
        case 'tutor': return 'Репетитор';
        case 'student_or_parent': return 'Ученик / Родитель';
        case 'admin': return 'Администратор';
        default: return 'Неизвестная роль';
    }
};


const UserProfilePage: React.FC = () => {
    const { userId: paramUserId } = useParams<{ userId: string }>();
    const { userInfo: authUserInfo, setUserInfo } = useAuth();
    const { showAlert, showConfirm } = useAlert();
    const navigate = useNavigate();

    const targetUserId = paramUserId || authUserInfo?.id;

    const [profileData, setProfileData] = useState<UserDetailedInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);

    const isMyProfile = targetUserId === authUserInfo?.id;
    const isAdmin = authUserInfo?.role.id === 'admin';
    const canEdit = isAdmin

    const fetchProfile = useCallback(async (id: string) => {
        setIsLoading(true);
        try {
            const data = await getUserProfile(id);
            setProfileData(data);
        } catch (error) {
            const errorMessage = (error as Error).message || "Ошибка загрузки профиля.";
            showAlert(errorMessage, 'error');
            setProfileData(null);
        } finally {
            setIsLoading(false);
        }
    }, [showAlert]);

    useEffect(() => {
        if (!targetUserId) {
            setIsLoading(false);
            return;
        }
        if (isMyProfile && authUserInfo && !paramUserId) {
            setProfileData(authUserInfo);
            setIsLoading(false);
            return;
        }
        fetchProfile(targetUserId);

    }, [targetUserId, authUserInfo, isMyProfile, fetchProfile, paramUserId]);

    const handleUpdateProfile = useCallback(async (updateData: UserUpdateData) => {
        if (!profileData || !targetUserId) return;

        try {
            const updatedUser = await updateUserProfile(targetUserId, updateData);

            setIsEditing(false);

            if (isMyProfile) {
                setUserInfo(updatedUser);
                showAlert('Профиль успешно обновлен!', 'success');
                window.location.reload();
            } else {
                showAlert('Профиль успешно обновлен!', 'success');
                fetchProfile(targetUserId);
            }

        } catch (error) {
            showAlert((error as Error).message || "Ошибка обновления профиля.", 'error');
        }
    }, [targetUserId, isMyProfile, setUserInfo, showAlert, fetchProfile, profileData]);

    const handleDeleteUser = async () => {
        if (!isAdmin || isMyProfile || !targetUserId) return;

        showConfirm(
            `Вы уверены, что хотите удалить пользователя ID ${targetUserId}? Это действие необратимо.`,
            async () => {
                try {
                    await deleteUser(targetUserId);
                    showAlert('Пользователь успешно удален!', 'success');
                    navigate('/admin', { replace: true });
                } catch (error) {
                    showAlert((error as Error).message || "Ошибка при удалении пользователя.", 'error');
                }
            },
            'warning'
        );
    };


    if (isLoading || !targetUserId) {
        return (
            <div className={styles.loadingContainer}>
                <img src={loadingGif} alt="Загрузка" />
                <p>Загрузка данных профиля...</p>
            </div>
        );
    }

    if (!profileData) {
        return <div className={styles.pageContainer}><p>Профиль не найден или у вас нет прав.</p></div>;
    }

    const { firstName, lastName, photoUrl, id, role } = profileData;
    const roleName = getRoleName(role.id);

    return (
        <div className={styles.pageContainer}>
            <h1 className={styles.title}>{isMyProfile ? 'Мой Профиль' : 'Профиль пользователя'}</h1>

            <div className={styles.profileCard}>
                <div className={styles.photoWrapper}>
                    <img
                        src={photoUrl}
                        alt={`${firstName} ${lastName}`}
                        className={styles.profilePhoto}
                    />
                </div>

                <div className={styles.infoSection}>
                    <h2 className={styles.userName}>{firstName} {lastName}</h2>

                    <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Роль:</span>
                        <span className={styles.detailValue}>{roleName}</span>
                    </div>

                    <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>ID пользователя:</span>
                        <span className={styles.detailValue}>{id}</span>
                    </div>
                </div>

                <p className={styles.note}>
                    {isMyProfile ?
                        <>
                            Администратор имеет право изменить ваше Имя.
                            <br />
                            Ваши данные не будут синхронизоваться с вашим аккаунтом Telegram.
                        </>
                        :
                        `Это профиль другого пользователя.`
                    }
                </p>

                <div className={styles.actionsContainer}>
                    {canEdit && (
                        <button
                            className={styles.editButton}
                            onClick={() => setIsEditing(true)}
                        >
                            Редактировать
                        </button>
                    )}

                    {isAdmin && !isMyProfile && (
                        <button
                            className={styles.deleteButton}
                            onClick={handleDeleteUser}
                        >
                            Удалить
                        </button>
                    )}
                </div>
            </div>

            {/* 💡 Модальное окно Редактирования */}
            {isAdmin && profileData && (
                <EditUserModal
                    isOpen={isEditing}
                    onClose={() => setIsEditing(false)}
                    initialData={profileData}
                    onSave={handleUpdateProfile}
                    targetUserId={targetUserId}
                />
            )}
        </div>
    );
};

export default UserProfilePage;