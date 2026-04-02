import {apiClient} from './apiClient';

export interface Student {
    id: string
    firstName: string
    lastName: string | null
    username?: string
}

export interface Lesson {
    id: string
    tutorId: string
    user: Student;
    lessonType?: string
    lessonCategory?: string
    dateOfCreation: string
    isAccepted: boolean
    isRepeated: boolean
    isCompleted: boolean;
    startLessonDate: string
    endLessonDate: string
    note?: string
}

export interface CreateLessonDto {
    startLessonDate: string
    endLessonDate: string
    isAccepted: boolean
    isRepeated: boolean
    note?: string
    lessonType?: string
    lessonCategory?: string
    studentId: string
    timeZone: string;
}

export interface UpdateLessonDto {
    lessonDate?: string
    lessonDuration?: number
    note?: string
    status?: "scheduled" | "completed" | "cancelled"
}

export interface LessonResponse {
    lessons: Lesson[];
}

export interface UpdateLessonPayload extends CreateLessonDto {
    id: string;
}

interface TutorStudentsResponse {
    availableStudents: Student[];
}


/**
 * Получить список студентов, привязанных к текущему репетитору
 */
export const getTutorStudents = async (): Promise<TutorStudentsResponse> => {
    try {
        const response = await apiClient.get<TutorStudentsResponse>("/lesson/student-list");
        return response.data;
    } catch (error) {
        return { availableStudents: [] };
    }
}

/**
 * Получить все занятия для текущего пользователя за указанный период
 */
export const getLessons = async (startDate: string, endDate: string): Promise<Lesson[]> => {
    const response = await apiClient.get("/lesson", {
        params: { startDate, endDate },
    })
    return response.data
}

/**
 * Получить занятия для конкретной недели
 */
export const getWeekLessons = async (weekOffset = 0): Promise<Lesson[]> => {
    const today = new Date()
    const currentDay = today.getDay()
    const monday = new Date(today)
    const diff = currentDay === 0 ? -6 : 1 - currentDay
    monday.setDate(today.getDate() + diff + weekOffset * 7)
    monday.setHours(0, 0, 0, 0)
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    sunday.setHours(23, 59, 59, 999)

    try {
        const response = await apiClient.get<LessonResponse>("/lesson/week", {
            params: {
                startDate: monday.toISOString().split('T')[0],
                endDate: sunday.toISOString().split('T')[0]
            },
        })
        return response.data.lessons;
    } catch (error) {
        return []
    }
}

/**
 * Создать новое занятие (только для репетитора)
 */
export const createLesson = async (lessonData: CreateLessonDto): Promise<Lesson> => {
    const response = await apiClient.post("/lesson/create", lessonData)
    return response.data
}

/**
 * Обновить существующее занятие
 */
export const updateLesson = async (lessonId: string, updates: CreateLessonDto): Promise<Lesson> => {

    const payload: UpdateLessonPayload = {
        id: lessonId,
        ...updates
    };

    const response = await apiClient.put(`/lesson/edit`, payload);
    return response.data;
}

/**
 * Удалить занятие
 */
export const deleteLesson = async (lessonId: string): Promise<void> => {
    await apiClient.delete("/lesson", {
        params: {
            id: lessonId,
        },
    });
}


/**
 * Отменить занятие
 */
export const cancelLesson = async (lessonId: string, reason?: string): Promise<Lesson> => {
    const response = await apiClient.post(`lesson/${lessonId}/cancel`, { reason })
    return response.data
}

/**
 * Получить занятие
 */
export const getLessonById = async (lessonId: string): Promise<Lesson | null> => {
    try {
        const response = await apiClient.get<Lesson>(`/lesson?id=${lessonId}`);
        return response.data;
    } catch (error) {
        return null;
    }
}