import {apiClient} from './apiClient';

interface UserInfoStat {
    firstName: string;
    lastName: string;
    photoUrl: string;
    username: string;
    role: { id: "tutor" | "student_or_parent" };
    id: string;
    telegramId: number;
    registeredOn: string;
}

export interface LessonStat {
    tutor: UserInfoStat;
    student: UserInfoStat;
    startLesson: string;
    endLesson: string;
    isAccepted: boolean;
    isCompleted: boolean;
    lessonCategory: string;
    lessonType: string;
    note?: string;
}

export interface LessonStatsResponse {
    totalCount: number;
    page: number;
    pageSize: number;
    lessonStats: LessonStat[];
}

export interface GetLessonStatsParams {
    page: number;
    pageSize: number;
    LessonType?: string;
    FromDate?: string;
    ToDate?: string;
    TutorName?: string;

}

export const getLessonStats = async (params: GetLessonStatsParams): Promise<LessonStatsResponse> => {
    const queryParams = new URLSearchParams({
        page: params.page.toString(),
        pageSize: params.pageSize.toString(),
        ...(params.LessonType && { LessonType: params.LessonType }),
        ...(params.FromDate && { FromDate: params.FromDate }),
        ...(params.ToDate && { ToDate: params.ToDate }),
        ...(params.TutorName && { TutorName: params.TutorName }),
    }).toString();

    const response = await apiClient.get<LessonStatsResponse>(`/lesson/stats?${queryParams}`);
    return response.data;
};