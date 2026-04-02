import {apiClient} from './apiClient';

export interface AdminStatisticItem {
    id: string;
    tutor: {
        firstName: string;
        lastName: string;
        photoUrl: string;
        username: string;
        role: { id: 'admin' | 'tutor' | 'student_or_parent' };
        telegramId: number;
        id: string;
    };
    student: {
        firstName: string;
        lastName: string;
        photoUrl: string;
        username: string;
        role: { id: 'admin' | 'tutor' | 'student_or_parent' };
        telegramId: number;
        id: string;
    };
    isPaid: boolean;
    enrollmentDate: string;
}

export interface AdminStatisticResponse {
    totalCount: number;
    page: number;
    pageSize: number;
    items: AdminStatisticItem[];
}

interface GetAdminStatisticParams {
    page: number;
    pageSize: number;
    isPaid?: boolean;
    fromDate?: string;
    toDate?: string;
}

export interface PaymentStatusUpdate {
    id: string;
    isPaid: boolean;
}

export const getAdminStatistic = async (params: GetAdminStatisticParams): Promise<AdminStatisticResponse> => {
    const queryParams = new URLSearchParams({
        page: params.page.toString(),
        pageSize: params.pageSize.toString(),
        ...(params.isPaid !== undefined && { isPaid: params.isPaid.toString() }),
        ...(params.fromDate && { fromDate: params.fromDate }),
        ...(params.toDate && { toDate: params.toDate }),
    }).toString();

    const response = await apiClient.get<AdminStatisticResponse>(`/admin/statistic?${queryParams}`);
    return response.data;
}

export const updatePaymentStatus = async (data: PaymentStatusUpdate): Promise<void> => {
    await apiClient.put("/admin/status/isPaid", data);
}