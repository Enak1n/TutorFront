import { apiClient } from './apiClient'
import type { StoredFile } from './files'

export type HomeworkStatus = 'assigned' | 'submitted' | 'returned' | 'reviewed'

export interface HomeworkUser {
	id: string
	firstName: string | null
	lastName: string | null
	photoUrl: string | null
	role: string
}

export interface HomeworkMaterial {
	id: string
	title: string
	subject: string | null
	topic: string | null
	description: string | null
	files: StoredFile[]
	createdAt: string
	updatedAt: string
	usageCount: number
}

export interface SaveMaterialRequest {
	title: string
	subject: string | null
	topic: string | null
	description: string | null
	files: StoredFile[]
}

export interface HomeworkListItem {
	id: string
	title: string
	subject: string | null
	status: HomeworkStatus
	deadline: string | null
	isOverdue: boolean
	grade: string | null
	createdAt: string
	updatedAt: string
	filesCount: number
	submissionsCount: number
	tutor: HomeworkUser
	student: HomeworkUser
}

export interface HomeworkSubmission {
	id: string
	author: HomeworkUser
	text: string | null
	files: StoredFile[]
	createdAt: string
}

export interface HomeworkDetail {
	id: string
	title: string
	subject: string | null
	description: string | null
	files: StoredFile[]
	status: HomeworkStatus
	deadline: string | null
	isOverdue: boolean
	grade: string | null
	tutorComment: string | null
	materialId: string | null
	createdAt: string
	updatedAt: string
	tutor: HomeworkUser
	student: HomeworkUser
	submissions: HomeworkSubmission[]
	permissions: { canEdit: boolean; canSubmit: boolean; canReview: boolean; canComment: boolean }
}

export interface HomeworkSummary {
	isTutor: boolean
	isPro: boolean
	toReview: number
	active: number
	overdue: number
	materials: number
}

export interface CreateAssignmentRequest {
	studentIds: string[]
	materialId: string | null
	title: string | null
	subject: string | null
	description: string | null
	files: StoredFile[] | null
	deadline: string | null
	saveToLibrary: boolean
	topic: string | null
}

export const STATUS_LABELS: Record<HomeworkStatus, string> = {
	assigned: 'Выдано',
	submitted: 'На проверке',
	returned: 'На доработке',
	reviewed: 'Проверено',
}

export const userName = (user: HomeworkUser | null | undefined) =>
	user ? [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Без имени' : ''

export const getHomeworkSummary = async () => (await apiClient.get<HomeworkSummary>('/homework/summary')).data

export const getHomeworkStudents = async () => (await apiClient.get<HomeworkUser[]>('/homework/students')).data

export const getMaterials = async (search?: string, subject?: string) =>
	(await apiClient.get<HomeworkMaterial[]>('/homework/materials', { params: { search: search || undefined, subject: subject || undefined } })).data

export const createMaterial = async (body: SaveMaterialRequest) =>
	(await apiClient.post<HomeworkMaterial>('/homework/materials', body)).data

export const updateMaterial = async (id: string, body: SaveMaterialRequest) =>
	(await apiClient.put<HomeworkMaterial>(`/homework/materials/${id}`, body)).data

export const deleteMaterial = async (id: string) => {
	await apiClient.delete(`/homework/materials/${id}`)
}

export const getAssignments = async (params: { status?: string; studentId?: string; search?: string }) =>
	(await apiClient.get<HomeworkListItem[]>('/homework/assignments', {
		params: {
			status: params.status || undefined,
			studentId: params.studentId || undefined,
			search: params.search || undefined,
		},
	})).data

export const getAssignment = async (id: string) => (await apiClient.get<HomeworkDetail>(`/homework/assignments/${id}`)).data

export const createAssignments = async (body: CreateAssignmentRequest) =>
	(await apiClient.post<{ ids: string[] }>('/homework/assignments', body)).data

export const updateAssignment = async (
	id: string,
	body: { title: string; subject: string | null; description: string | null; files: StoredFile[]; deadline: string | null },
) => (await apiClient.put<HomeworkDetail>(`/homework/assignments/${id}`, body)).data

export const deleteAssignment = async (id: string) => {
	await apiClient.delete(`/homework/assignments/${id}`)
}

export const submitHomework = async (id: string, text: string | null, files: StoredFile[]) =>
	(await apiClient.post<HomeworkDetail>(`/homework/assignments/${id}/submissions`, { text, files })).data

export const reviewHomework = async (id: string, status: 'reviewed' | 'returned', grade: string | null, comment: string | null) =>
	(await apiClient.post<HomeworkDetail>(`/homework/assignments/${id}/review`, { status, grade, comment })).data
