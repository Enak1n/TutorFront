import React from 'react';
import ReactDOM from 'react-dom';
// @ts-ignore
import styles from './Alert.module.scss';

type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertState {
    isVisible: boolean;
    message: string;
    type: AlertType;
    onConfirm: (() => void) | null;
    onCancel: (() => void) | null;
    isConfirm: boolean;
}

interface AlertProps {
    state: AlertState;
    hideAlert: () => void;
}

const getTypeDetails = (type: AlertType) => {
    switch (type) {
        case 'success':
            return { title: 'Успех', icon: '✔' };
        case 'error':
            return { title: 'Ошибка', icon: '✘' };
        case 'warning':
            return { title: 'Внимание', icon: '⚠' };
        case 'info':
        default:
            return { title: 'Информация', icon: 'i' };
    }
};

export const Alert: React.FC<AlertProps> = ({ state, hideAlert }) => {
    const { isVisible, message, type, onConfirm, onCancel, isConfirm } = state;
    const { title, icon } = getTypeDetails(type);

    if (!isVisible) {
        return null;
    }

    const handleOverlayClick = () => {
        if (!isConfirm && onConfirm) {
            onConfirm();
        }
    };

    const alertModal = (
        <div className={styles.alertOverlay} onClick={handleOverlayClick}>
            <div
                className={`${styles.alertContent} ${styles[`type-${type}`]}`}
                onClick={e => e.stopPropagation()}
            >
                <div className={styles.alertHeader}>
                    <span className={styles.alertIcon}>{icon}</span>
                    <h3 className={styles.alertTitle}>{title}</h3>
                </div>

                <p className={styles.alertMessage}>{message}</p>

                <div className={styles.alertActions}>
                    {isConfirm ? (
                        <>
                            <button className={`${styles.button} ${styles.secondaryButton}`} onClick={onCancel || hideAlert}>
                                Отмена
                            </button>
                            <button className={`${styles.button} ${styles.primaryButton}`} onClick={onConfirm || hideAlert}>
                                Подтвердить
                            </button>
                        </>
                    ) : (
                        <button className={`${styles.button} ${styles.singleButton}`} onClick={onConfirm || hideAlert}>
                            ОК
                        </button>
                    )}
                </div>
            </div>
        </div>
    );

    return ReactDOM.createPortal(
        alertModal,
        document.body
    );
};