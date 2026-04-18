import { apiClient } from './apiClient'

export interface AvailabilitySlot {
	id: string
	tutorId: string
	date: string // YYYY-MM-DD
	startTime: string // HH:mm
	endTime: string // HH:mm
	isAvailable: boolean
	createdAt: string
}

export interface Lesson {
	id: string
	tutorId: string
	user: Student
	lessonType?: string
	lessonCategory?: string
	dateOfCreation: string
	isAccepted: boolean
	isRepeated: boolean
	isCompleted: boolean
	startLessonDate: string
	endLessonDate: string
	note?: string
}

export interface Student {
	id: string
	firstName: string
	lastName: string | null
	username?: string
}

export interface DayLessonCount {
	date: string
	count: number
	tutorId?: string
}

export const getTutorAvailability = async (
	month: string,
): Promise<AvailabilitySlot[]> => {
	const response = await apiClient.get('lesson/availability', {
		params: { month },
	})
	return response.data.items || response.data.availableSlots || []
}

export const updateAvailability = async (
	slotData: Omit<AvailabilitySlot, 'id' | 'createdAt' | 'tutorId'> & {
		date: string
		tutorId?: string
	},
): Promise<AvailabilitySlot> => {
	const response = await apiClient.post('lesson/availability', slotData)
	return response.data
}

export const deleteAvailability = async (slotId: string): Promise<void> => {
	await apiClient.delete('/tutor/availability', {
		params: { id: slotId },
	})
}

export const getLessonCountByDay = async (
	month: string,
): Promise<DayLessonCount[]> => {
	const response = await apiClient.get('lesson/lesson-count/day', {
		params: { month },
	})
	return response.data.items || response.data.days || []
}

export const bookAvailabilitySlot = async (
	availabilityId: string,
	studentId: string,
	note?: string,
): Promise<Lesson> => {
	const response = await apiClient.post('/lesson/book-from-availability', {
		availabilityId,
		studentId,
		note,
	})
	return response.data
}
