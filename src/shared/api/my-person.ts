import {apiClient} from './apiClient';

export interface ConnectedPerson {
    id: string;
    firstName: string;
    lastName: string;
    photoUrl: string;
}

export interface MyPersonPageProps {
    userRole: 'tutor' | 'student_or_parent' | 'admin' | null;
    navigateToProfile: (userId: string) => void;
    navigateToChat: (chatId: string) => void;
}

interface ChatLinkResponse {
    chatId: string;
}

interface MyPersonsResponse {
    myPersons: ConnectedPerson[];
}

export const getPersons = async (): Promise<ConnectedPerson[]> => {
    const response = await apiClient.get<MyPersonsResponse>(`/user/my-person`);
    return response.data.myPersons;
}

export const getChatId = async (otherUserId: string): Promise<string> => {
    const response = await apiClient.get<ChatLinkResponse>(`/chat/${otherUserId}`);
    return response.data.chatId;
}