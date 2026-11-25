import React, {
	createContext,
	useContext,
	useState,
	useEffect,
	ReactNode,
	useCallback,
} from 'react'
import type { UserDetailedInfo } from '@api/auth'
import {
	AUTH_CHANGED_EVENT,
	readAuthData,
	readStoredUserInfo,
	saveUserInfo,
} from './authStorage'

interface AuthContextType {
	token: string | null
	userId: string | null
	role: string | null
	userInfo: UserDetailedInfo | null
	setUserInfo: (data: UserDetailedInfo | null) => void
	syncAuthData: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
	children,
}) => {
	const [authData, setAuthData] = useState(readAuthData)
	const [userInfoState, setUserInfoState] = useState<UserDetailedInfo | null>(
		() => readStoredUserInfo(),
	)

	const syncAuthData = useCallback(() => {
		const nextAuthData = readAuthData()
		setAuthData(nextAuthData)
		setUserInfoState(nextAuthData.token ? readStoredUserInfo() : null)
	}, [])

	const setUserInfo = useCallback((data: UserDetailedInfo | null) => {
		setUserInfoState(data)
		saveUserInfo(data)
	}, [])

	useEffect(() => {
		const handleStorageChange = () => {
			syncAuthData()
		}

		const handleVisibilityChange = () => {
			if (document.visibilityState === 'visible') {
				syncAuthData()
			}
		}

		window.addEventListener('storage', handleStorageChange)
		window.addEventListener(AUTH_CHANGED_EVENT, handleStorageChange)
		window.addEventListener('pageshow', handleStorageChange)
		document.addEventListener('visibilitychange', handleVisibilityChange)

		return () => {
			window.removeEventListener('storage', handleStorageChange)
			window.removeEventListener(AUTH_CHANGED_EVENT, handleStorageChange)
			window.removeEventListener('pageshow', handleStorageChange)
			document.removeEventListener('visibilitychange', handleVisibilityChange)
		}
	}, [syncAuthData])

	const contextValue = {
		...authData,
		userInfo: userInfoState,
		setUserInfo,
		syncAuthData,
	}

	return (
		<AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
	)
}

export const useAuth = (): AuthContextType => {
	const context = useContext(AuthContext)
	if (context === undefined) {
		throw new Error('useAuth must be used within an AuthProvider')
	}
	return context
}
