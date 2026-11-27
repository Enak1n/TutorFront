import { apiClient } from './apiClient'
import type { SubscriptionStatus } from './subscription'

export type NotificationChannel = 'vk' | 'email' | 'sms'
export type NotificationTiming = 'Instant' | 'BeforeLessonStart' | 'AfterLessonEnd' | 'BeforeHomeworkDeadline'

export interface NotificationRule {
	type: string
	title: string
	description: string
	timing: NotificationTiming
	group: 'lessons' | 'payments' | 'homework' | string
	isEnabled: boolean
	offsetMinutes: number
	channels: NotificationChannel[]
	notifyStudent: boolean
	notifyParents: boolean
	notifyTutor: boolean
	template: string
	defaultTemplate: string
	defaultOffsetMinutes: number
	variables: string[]
	isCustomized: boolean
}

export interface NotificationVariable {
	key: string
	description: string
}

export interface NotificationContactStats {
	recipients: number
	withVk: number
	withEmail: number
	withPhone: number
	tutorHasVk: boolean
	tutorHasEmail: boolean
	tutorHasPhone: boolean
}

export interface NotificationSettings {
	subscription: SubscriptionStatus
	variables: NotificationVariable[]
	rules: NotificationRule[]
	contacts: NotificationContactStats
}

export type NotificationRuleDraft = Pick<
	NotificationRule,
	'isEnabled' | 'offsetMinutes' | 'channels' | 'notifyStudent' | 'notifyParents' | 'notifyTutor' | 'template'
>

export const getNotificationSettings = async (): Promise<NotificationSettings> =>
	(await apiClient.get<NotificationSettings>('/notification-settings')).data

export const saveNotificationRule = async (type: string, draft: NotificationRuleDraft): Promise<NotificationRule> =>
	(await apiClient.put<NotificationRule>(`/notification-settings/${type}`, draft)).data

export const resetNotificationRule = async (type: string): Promise<NotificationRule> =>
	(await apiClient.delete<NotificationRule>(`/notification-settings/${type}`)).data

export const sendTestNotification = async (
	type: string,
	draft: NotificationRuleDraft,
): Promise<{ recipients: number; errors: string[] }> =>
	(await apiClient.post(`/notification-settings/${type}/test`, draft)).data
