import { apiClient } from './apiClient'

export interface SubscriptionPeriod {
	months: number
	price: number
}

export interface SubscriptionStatus {
	plan: 'standard' | 'pro'
	isActive: boolean
	expiresAt: string | null
	smsMonthlyLimit: number
	smsUsedThisMonth: number
	periods: SubscriptionPeriod[]
}

export interface MyContacts {
	phone: string | null
	email: string | null
	hasVk: boolean
	isPro: boolean
}

export const getMySubscription = async (): Promise<SubscriptionStatus> =>
	(await apiClient.get<SubscriptionStatus>('/subscription')).data

/** Возвращает ссылку на оплату. activated=true — подписка включена сразу (локальная разработка). */
export const createSubscriptionPayment = async (
	months: number,
): Promise<{ confirmationUrl: string | null; activated: boolean }> =>
	(await apiClient.post('/subscription/pay', { months })).data

export const getMyContacts = async (): Promise<MyContacts> =>
	(await apiClient.get<MyContacts>('/user/contacts')).data

export const updateMyPhone = async (phone: string | null): Promise<{ phone: string | null }> =>
	(await apiClient.put('/user/contacts', { phone })).data

// ----- Администратор -----

export const getUserSubscription = async (userId: string): Promise<SubscriptionStatus> =>
	(await apiClient.get<SubscriptionStatus>(`/admin/user/${userId}/subscription`)).data

export const setUserSubscription = async (
	userId: string,
	body: { months?: number | null; expiresAt?: string | null },
): Promise<SubscriptionStatus> =>
	(await apiClient.put<SubscriptionStatus>(`/admin/user/${userId}/subscription`, body)).data

export const formatPhone = (phone: string | null | undefined): string => {
	if (!phone || phone.length !== 11) return phone ?? ''
	return `+7 ${phone.slice(1, 4)} ${phone.slice(4, 7)}-${phone.slice(7, 9)}-${phone.slice(9)}`
}

export const pluralMonths = (n: number) => {
	const mod10 = n % 10
	const mod100 = n % 100
	if (mod10 === 1 && mod100 !== 11) return `${n} месяц`
	if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return `${n} месяца`
	return `${n} месяцев`
}
