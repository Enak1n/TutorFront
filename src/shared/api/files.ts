import { apiClient } from './apiClient'

/** Файл в хранилище (GridFS). url — относительный путь /api/v1/files/{id}. */
export interface StoredFile {
	fileId: string
	fileName: string
	contentType: string
	url: string
}

export const MAX_UPLOAD_FILE_SIZE = 25 * 1024 * 1024

export const uploadFiles = async (files: File[]): Promise<StoredFile[]> => {
	const tooBig = files.find(file => file.size > MAX_UPLOAD_FILE_SIZE)
	if (tooBig) throw new Error(`Файл «${tooBig.name}» больше 25 МБ`)

	const form = new FormData()
	files.forEach(file => form.append('files', file, file.name))

	const response = await apiClient.post<StoredFile[]>('/files', form, {
		headers: { 'Content-Type': 'multipart/form-data' },
	})
	return response.data
}

/** Достаёт понятное сообщение об ошибке из ответа API. */
export const getApiErrorMessage = (error: unknown, fallback: string): string => {
	const err = error as { response?: { data?: unknown }; message?: string }
	const data = err?.response?.data as
		| { errorMessage?: string; message?: string; title?: string }
		| string
		| undefined

	if (typeof data === 'string' && data.trim()) return data
	if (data && typeof data === 'object') {
		return data.errorMessage || data.message || data.title || fallback
	}
	return err?.message || fallback
}
