import { useRef, useState } from 'react'
import { getApiErrorMessage, uploadFiles, type StoredFile } from '@api/files'
import { toApiUrl } from '@/shared/config/api'
import { FileIcon, PaperclipIcon } from '@components/ui/icons'
// @ts-ignore
import ui from './ui.module.scss'

const MAX_FILES = 10

export const FileList = ({ files }: { files: StoredFile[] }) =>
	files.length === 0 ? null : (
		<div className={ui.files}>
			{files.map(file => (
				<a
					key={file.fileId}
					className={ui.file}
					href={toApiUrl(file.url)}
					target='_blank'
					rel='noopener noreferrer'
					title={file.fileName}
				>
					<FileIcon size={16} />
					<span>{file.fileName}</span>
				</a>
			))}
		</div>
	)

interface FileAttachmentsProps {
	files: StoredFile[]
	onChange: (files: StoredFile[]) => void
	disabled?: boolean
	onUploadingChange?: (uploading: boolean) => void
}

/** Загрузка файлов сразу при выборе: в форму попадают уже сохранённые идентификаторы. */
export const FileAttachments = ({ files, onChange, disabled, onUploadingChange }: FileAttachmentsProps) => {
	const inputRef = useRef<HTMLInputElement>(null)
	const [isUploading, setIsUploading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const handleSelect = async (list: FileList | null) => {
		const selected = Array.from(list ?? [])
		if (selected.length === 0) return

		if (files.length + selected.length > MAX_FILES) {
			setError(`Можно прикрепить не больше ${MAX_FILES} файлов`)
			return
		}

		setError(null)
		setIsUploading(true)
		onUploadingChange?.(true)
		try {
			const uploaded = await uploadFiles(selected)
			onChange([...files, ...uploaded])
		} catch (err) {
			setError(getApiErrorMessage(err, 'Не удалось загрузить файл'))
		} finally {
			setIsUploading(false)
			onUploadingChange?.(false)
		}
	}

	return (
		<div className={ui.field}>
			<div className={ui.files}>
				{files.map(file => (
					<span key={file.fileId} className={ui.file} title={file.fileName}>
						<FileIcon size={16} />
						<a href={toApiUrl(file.url)} target='_blank' rel='noopener noreferrer'>
							<span>{file.fileName}</span>
						</a>
						{!disabled && (
							<button
								type='button'
								className={ui.fileRemove}
								onClick={() => onChange(files.filter(f => f.fileId !== file.fileId))}
								aria-label={`Убрать ${file.fileName}`}
							>
								×
							</button>
						)}
					</span>
				))}
				{!disabled && files.length < MAX_FILES && (
					<button
						type='button'
						className={`${ui.btn} ${ui.btnSmall}`}
						onClick={() => inputRef.current?.click()}
						disabled={isUploading}
					>
						<PaperclipIcon size={16} />
						{isUploading ? 'Загружаем…' : 'Прикрепить файлы'}
					</button>
				)}
			</div>
			<input
				ref={inputRef}
				type='file'
				multiple
				hidden
				onChange={e => {
					handleSelect(e.target.files)
					e.target.value = ''
				}}
			/>
			{error && <span className={ui.badgeDanger}>{error}</span>}
		</div>
	)
}
