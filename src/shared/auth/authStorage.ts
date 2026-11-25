import type { UserDetailedInfo } from '@api/auth'

export const AUTH_CHANGED_EVENT = 'auth-storage-changed'

const AUTH_TOKEN_KEY = 'authToken'
const USER_ID_KEY = 'id'
const ROLE_KEY = 'role'
const USER_INFO_KEY = 'authUserInfo'

export interface StoredAuthData {
	token: string | null
	userId: string | null
	role: string | null
}

export interface AuthSessionPayload {
	token: string
	userId: string
	role: string
	userInfo?: UserDetailedInfo | null
}

const getLocalStorage = (): Storage | null => {
	if (typeof window === 'undefined') return null

	try {
		return window.localStorage
	} catch {
		return null
	}
}

const getSessionStorage = (): Storage | null => {
	if (typeof window === 'undefined') return null

	try {
		return window.sessionStorage
	} catch {
		return null
	}
}

const getStorageTargets = () =>
	[getLocalStorage(), getSessionStorage()].filter(
		(storage): storage is Storage => Boolean(storage),
	)

const readItem = (key: string): string | null => {
	for (const storage of getStorageTargets()) {
		try {
			const value = storage.getItem(key)
			if (value) return value
		} catch {
			continue
		}
	}

	return null
}

const setItem = (key: string, value: string) => {
	for (const storage of getStorageTargets()) {
		try {
			storage.setItem(key, value)
		} catch {
			continue
		}
	}
}

const removeItem = (key: string) => {
	for (const storage of getStorageTargets()) {
		try {
			storage.removeItem(key)
		} catch {
			continue
		}
	}
}

const emitAuthChanged = () => {
	if (typeof window === 'undefined') return
	window.dispatchEvent(new Event(AUTH_CHANGED_EVENT))
}

export const getAuthToken = () => readItem(AUTH_TOKEN_KEY)

export const readAuthData = (): StoredAuthData => ({
	token: readItem(AUTH_TOKEN_KEY),
	userId: readItem(USER_ID_KEY),
	role: readItem(ROLE_KEY),
})

export const readStoredUserInfo = (): UserDetailedInfo | null => {
	const rawUserInfo = readItem(USER_INFO_KEY)
	if (!rawUserInfo) return null

	try {
		return JSON.parse(rawUserInfo) as UserDetailedInfo
	} catch {
		removeItem(USER_INFO_KEY)
		return null
	}
}

export const saveUserInfo = (userInfo: UserDetailedInfo | null) => {
	if (!userInfo) {
		removeItem(USER_INFO_KEY)
		return
	}

	setItem(USER_INFO_KEY, JSON.stringify(userInfo))
}

export const saveAuthSession = ({
	token,
	userId,
	role,
	userInfo,
}: AuthSessionPayload) => {
	setItem(AUTH_TOKEN_KEY, token)
	setItem(USER_ID_KEY, userId)
	setItem(ROLE_KEY, role)
	saveUserInfo(userInfo ?? null)
	emitAuthChanged()
}

export const clearAuthSession = () => {
	removeItem(AUTH_TOKEN_KEY)
	removeItem(USER_ID_KEY)
	removeItem(ROLE_KEY)
	removeItem(USER_INFO_KEY)
	emitAuthChanged()
}

