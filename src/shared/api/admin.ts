import { Lesson } from './schedule';
import {apiClient} from './apiClient';

export interface Tutor {
    id: string;
    firstName: string;
    lastName: string;
    photoUrl: string;
    username: string;
    telegramId: number;
}

export interface TutorColumn {
    tutor: Tutor;
    lessons: Lesson[];
}

export interface AdminScheduleResponse {
    columns: TutorColumn[];
}

interface LessonStatusUpdate {
    id: string;
    isAccepted: boolean;
}

interface LessonCompletedUpdate {
    id: string;
    isCompleted: boolean;
}

export const getTutorSchedulesByDay = async (date: string): Promise<TutorColumn[]> => {
    const response = await apiClient.get<AdminScheduleResponse>(`/admin/lesson/day`, {
        params: { day: date },
    });

    return response.data.columns;
};

export const updateLessonStatus = async (data: LessonStatusUpdate): Promise<void> => {
    await apiClient.put("/admin/status/isAccepted", data);
}

export const updateLessonCompletedStatus = async (data: LessonCompletedUpdate): Promise<void> => {
    await apiClient.put("/admin/status/isCompleted", data);
}