import React, { useEffect, useState } from 'react';
// @ts-ignore
import styles from './NotificationToast.module.scss';
import { useNavigate } from 'react-router-dom';

interface NotificationToastProps {
    message: string;
    onClose: () => void;
    duration?: number;
    onClickAction?: () => void;
}

interface ToastItem {
    id: number;
    message: string;
    action?: () => void;
}
export const NotificationToast: React.FC<NotificationToastProps> = ({
                                                                        message,
                                                                        onClose,
                                                                        duration = 4000,
                                                                        onClickAction,
                                                                    }) => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        if (!isVisible) return;
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
        }, duration);
        return () => clearTimeout(timer);
    }, [duration, onClose, isVisible]);

    if (!isVisible && !message) return null;

    const toastClass = isVisible ? styles.toastContainer : `${styles.toastContainer} ${styles.hide}`;

    const handleToastClick = () => {
        if (onClickAction) {
            onClickAction();
        }
        onClose();
    };

    return (
        <div className={toastClass} onClick={handleToastClick}>
            <div className={styles.icon}>💬</div>
            <div className={styles.content}>
                <div className={styles.title}>Новое сообщение</div>
                <div className={styles.message}>{message}</div>
            </div>
            <button className={styles.closeButton} onClick={(e) => { e.stopPropagation(); onClose(); }}>×</button>
        </div>
    );
};

let globalAddToast: (message: string, action?: () => void) => void = () => {};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const navigate = useNavigate();
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    const navigateToMessages = () => {
        navigate("/messages");
    };

    const addToast = (message: string, action?: () => void) => {
        const newToast: ToastItem = {
            id: Date.now(),
            message,
            action: action || navigateToMessages
        };
        setToasts(prev => [...prev.slice(-4), newToast]);
    };

    const removeToast = (id: number) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    };

    useEffect(() => {
        globalAddToast = addToast;
    }, []);


    return (
        <>
            {children}
            <div className={styles.toastWrapper}>
                {toasts.map(toast => (
                    <NotificationToast
                        key={toast.id}
                        message={toast.message}
                        onClose={() => removeToast(toast.id)}
                        onClickAction={toast.action}
                    />
                ))}
            </div>
        </>
    );
};

export const showMessageToast = (message: string, action?: () => void) => {
    globalAddToast(message, action);
};