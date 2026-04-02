import React, {createContext, useContext, useState, useEffect, ReactNode, useCallback} from 'react';
import { UserDetailedInfo } from '@api/auth';

interface AuthContextType {
    token: string | null;
    userId: string | null;
    role: string | null;
    userInfo: UserDetailedInfo | null;
    setUserInfo: (data: UserDetailedInfo | null) => void;
    syncAuthData: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const readAuthData = (): { token: string | null; userId: string | null; role: string | null } => {
    const token = localStorage.getItem("authToken");
    const userId = localStorage.getItem("id");
    const role = localStorage.getItem("role");

    return {
        token: token || null,
        userId: userId || null,
        role: role || null
    };
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [authData, setAuthData] = useState(readAuthData);
    const [userInfo, setUserInfo] = useState<UserDetailedInfo | null>(null);

    const syncAuthData = useCallback(() => {
        setAuthData(readAuthData());
    }, []);

    useEffect(() => {
        const handleStorageChange = () => {
            setAuthData(readAuthData());
            setUserInfo(null);
        };

        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    const contextValue = {
        ...authData,
        userInfo,
        setUserInfo,
        syncAuthData,
    };


    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};