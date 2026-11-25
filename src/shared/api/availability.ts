import { apiClient } from './apiClient'

/**
 * Окно доступности репетитора. Время — московское (HH:mm[:ss]).
 * Для репетитора — его окна целиком, для ученика — только свободные части окон.
 */
export interface AvailabilitySlot {
	id: string
	date: string // YYYY-MM-DD
	startTime: string
	endTime: string
	tutorId: string
	tutorName: string
	isOwn: boolean
}

export interface DayLessonCount {
	date: string
	count: number
}

export interface BookableStudent {
	id: string
	firstName: string | null
	lastName: string | null
	isSelf: boolean
}

export interface BookSlotPayload {
	availabilityId: string
	startTime: string // HH:mm, МСК
	durationMinutes: number
	lessonType: string // русское название предмета
	lessonCategory: string // русское название категории
	studentId?: string
	note?: string
}

export const getAvailability = async (month: string): Promise<AvailabilitySlot[]> => {
	const { data } = await apiClient.get('lesson/availability', { params: { month } })
	return data.items ?? []
}

export const createAvailability = async (slot: {
	date: string
	startTime: string
	endTime: string
}): Promise<void> => {
	await apiClient.post('lesson/availability', { ...slot, isAvailable: true })
}

export const deleteAvailability = async (id: string): Promise<void> => {
	await apiClient.delete(`lesson/availability/${id}`)
}

export const getLessonCountByDay = async (month: string): Promise<DayLessonCount[]> => {
	const { data } = await apiClient.get('lesson/lesson-count/day', { params: { month } })
	return data.items ?? []
}

export const getBookableStudents = async (tutorId: string): Promise<BookableStudent[]> => {
	const { data } = await apiClient.get('lesson/availability/bookable-students', { params: { tutorId } })
	return data.students ?? []
}

export const bookSlot = async (payload: BookSlotPayload): Promise<void> => {
	await apiClient.post('lesson/availability/book', payload)
}

/** Сообщение об ошибке из ответа API (поле errorMessage) или запасной текст. */
export const getApiErrorMessage = (error: unknown, fallback: string): string => {
	const data = (error as { response?: { data?: { errorMessage?: string; message?: string } } })?.response?.data
	return data?.errorMessage || data?.message || fallback
}
