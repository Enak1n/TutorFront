import {apiClient} from './apiClient';

export interface UserRole {
    id: string;
}

export interface UserBase {
    id: string;
    firstName: string;
    lastName: string | null;
    username: string;
    photoUrl?: string;
    telegramId: number;
    role: UserRole;
}

export interface TutorStudentLink {
    id: string;
    tutor: UserBase;
    student: UserBase;
    studentId: string;
    tutorId: string;
    paymentDetails: string | null;
}

export interface CreateLinkPayload {
    tutorId: string;
    studentId: string;
    paymentDetails: string;
}


export interface ParentStudentLink {
    id: string;
    parent: UserBase;
    student: UserBase;
    studentId: string;
    parentId: string;
}

export interface PaginatedLinksResponse {
    links: TutorStudentLink[];
    totalCount: number;
    page: number;
    pageSize: number;
}

export interface PaginatedParentLinksResponse {
    links: ParentStudentLink[];
    totalCount: number;
    page: number;
    pageSize: number;
}

export interface UpdatePaymentDetailsPayload {
    linkId: string;
    paymentDetails: string;
}

export const getTutors = async (): Promise<UserBase[]> => {
    const response = await apiClient.get<UserBase[]>(`/admin/user/tutors`);
    return response.data;
};

export const getStudents = async (): Promise<UserBase[]> => {
    const response = await apiClient.get<UserBase[]>(`/admin/user/students`);
    return response.data;
};

export const createLink = async (payload: CreateLinkPayload): Promise<void> => {
    await apiClient.post(`/admin/user/link`, payload);
};

export const deleteLink = async (linkId: string): Promise<void> => {
    await apiClient.delete(`/admin/user/delete-link`, {
        params: { id: linkId }
    });
};

export const getLinks = async (page: number, pageSize: number): Promise<PaginatedLinksResponse> => {
    const response = await apiClient.get<PaginatedLinksResponse>(`/admin/user/all-links`, {
        params: { page, pageSize }
    });
    return response.data;
};

export const createParentStudentLink = async (payload: CreateLinkPayload): Promise<void> => {
    const apiPayload = {
        tutorId: payload.tutorId,
        studentId: payload.studentId,
        paymentDetails: "",
    };

    await apiClient.post(`/admin/user/link-parent-student`, apiPayload);
};

export const updatePaymentDetails = async (payload: UpdatePaymentDetailsPayload): Promise<void> => {
    await apiClient.put("/admin/user/paymentDetails", payload);
};

export const getParentStudentLinks = async (page: number, pageSize: number): Promise<PaginatedParentLinksResponse> => {
    const response = await apiClient.get<PaginatedParentLinksResponse>(`/admin/user/all-parents-links`, {
        params: { page, pageSize }
    });
    return response.data;
};

export const deleteParentStudentLink = async (linkId: string): Promise<void> => {
    await apiClient.delete(`/admin/user/delete-parent-link`, {
        params: { id: linkId }
    });
};