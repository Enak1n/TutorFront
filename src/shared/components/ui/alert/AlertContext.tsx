import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo  } from 'react';

type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertState {
    isVisible: boolean;
    message: string;
    type: AlertType;
    onConfirm: (() => void) | null;
    onCancel: (() => void) | null;
    isConfirm: boolean;
}

interface AlertContextType {
    showAlert: (message: string, type?: AlertType) => void;
    showConfirm: (message: string, onConfirm: () => void, type?: AlertType) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

interface AlertProviderProps {
    children: ReactNode;
}

export const AlertProvider: React.FC<AlertProviderProps> = ({ children }) => {
    const [alert, setAlert] = useState<AlertState>({
        isVisible: false,
        message: '',
        type: 'info',
        onConfirm: null,
        onCancel: null,
        isConfirm: false,
    });

    const hideAlert = useCallback(() => {
        setAlert(prev => ({ ...prev, isVisible: false }));
    }, []);

    const showAlert = useCallback((message: string, type: AlertType = 'info') => {
        setAlert({
            isVisible: true,
            message,
            type,
            onConfirm: hideAlert,
            onCancel: null,
            isConfirm: false,
        });
    }, [hideAlert]);

    const showConfirm = useCallback((message: string, onConfirm: () => void, type: AlertType = 'warning') => {
        setAlert({
            isVisible: true,
            message,
            type,
            isConfirm: true,
            onConfirm: () => {
                onConfirm();
                hideAlert();
            },
            onCancel: hideAlert,
        });
    }, [hideAlert]);

    const contextValue = useMemo(() => ({ showAlert, showConfirm }), [showAlert, showConfirm]);

    return (
        <AlertContext.Provider value={contextValue}>
            {children}
            <CustomAlert state={alert} hideAlert={hideAlert} />
        </AlertContext.Provider>
    );
};

export const useAlert = () => {
    const context = useContext(AlertContext);
    if (context === undefined) {
        throw new Error('useAlert must be used within an AlertProvider');
    }
    return context;
};

import { Alert as CustomAlert } from './Alert';