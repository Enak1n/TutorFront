import { useEffect, useState, type ReactNode } from 'react'
import {
	createAssignments,
	createMaterial,
	getHomeworkStudents,
	getMaterials,
	updateMaterial,
	userName,
	type HomeworkMaterial,
	type HomeworkUser,
} from '@api/homework'
import { getApiErrorMessage, type StoredFile } from '@api/files'
import { useAlert } from '@components/ui/alert/AlertContext'
import { FileAttachments } from '@components/pro/FileAttachments'
import { CloseIcon } from '@components/ui/icons'
// @ts-ignore
import ui from '@components/pro/ui.module.scss'
// @ts-ignore
import styles from './HomeworkPage.module.scss'

export const SUBJECTS = [
	'Математика',
	'Алгебра',
	'Геометрия',
	'Русский язык',
	'Литература',
	'Английский язык',
	'Немецкий/испанский/китайский язык',
	'Физика',
	'Химия',
	'Биология',
	'История',
	'Обществознание',
	'Информатика',
	'География',
	'Начальная школа',
]

interface ModalProps {
	title: string
	onClose: () => void
	children: ReactNode
	footer: ReactNode
	wide?: boolean
}

export const Modal = ({ title, onClose, children, footer, wide }: ModalProps) => {
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
		document.addEventListener('keydown', onKey)
		const prevOverflow = document.body.style.overflow
		document.body.style.overflow = 'hidden'
		return () => {
			document.removeEventListener('keydown', onKey)
			document.body.style.overflow = prevOverflow
		}
	}, [onClose])

	return (
		<div className={ui.overlay} onMouseDown={e => e.target === e.currentTarget && onClose()}>
			<div className={wide ? ui.modalWide : ui.modal} role='dialog' aria-modal='true' aria-label={title}>
				<div className={ui.modalHeader}>
					<h2>{title}</h2>
					<button type='button' className={ui.modalClose} onClick={onClose} aria-label='Закрыть'>
						<CloseIcon size={18} />
					</button>
				</div>
				<div className={ui.modalBody}>{children}</div>
				<div className={ui.modalFooter}>{footer}</div>
			</div>
		</div>
	)
}

/** Локальное значение для <input type="datetime-local"> из ISO. */
export const toLocalInput = (iso: string | null) => {
	if (!iso) return ''
	const d = new Date(iso)
	const pad = (n: number) => String(n).padStart(2, '0')
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export const fromLocalInput = (value: string) => (value ? new Date(value).toISOString() : null)

// ---------- Материал библиотеки ----------

interface MaterialModalProps {
	material: HomeworkMaterial | null
	onClose: () => void
	onSaved: (material: HomeworkMaterial) => void
}

export const MaterialModal = ({ material, onClose, onSaved }: MaterialModalProps) => {
	const { showAlert } = useAlert()
	const [title, setTitle] = useState(material?.title ?? '')
	const [subject, setSubject] = useState(material?.subject ?? '')
	const [topic, setTopic] = useState(material?.topic ?? '')
	const [description, setDescription] = useState(material?.description ?? '')
	const [files, setFiles] = useState<StoredFile[]>(material?.files ?? [])
	const [isUploading, setIsUploading] = useState(false)
	const [isSaving, setIsSaving] = useState(false)

	const save = async () => {
		setIsSaving(true)
		try {
			const body = {
				title,
				subject: subject || null,
				topic: topic || null,
				description: description || null,
				files,
			}
			const saved = material ? await updateMaterial(material.id, body) : await createMaterial(body)
			onSaved(saved)
			showAlert(material ? 'Материал обновлён' : 'Материал добавлен в библиотеку', 'success')
		} catch (err) {
			showAlert(getApiErrorMessage(err, 'Не удалось сохранить материал'), 'error')
		} finally {
			setIsSaving(false)
		}
	}

	return (
		<Modal
			title={material ? 'Редактировать материал' : 'Новый материал'}
			onClose={onClose}
			footer={
				<>
					<button type='button' className={ui.btn} onClick={onClose}>
						Отмена
					</button>
					<button
						type='button'
						className={ui.btnPrimary}
						onClick={save}
						disabled={!title.trim() || isSaving || isUploading}
					>
						{isSaving ? 'Сохраняем…' : 'Сохранить'}
					</button>
				</>
			}
		>
			<label className={ui.field}>
				<span className={ui.label}>Название *</span>
				<input
					className={ui.input}
					value={title}
					maxLength={200}
					onChange={e => setTitle(e.target.value)}
					placeholder='Например: Квадратные уравнения, вариант 1'
					autoFocus
				/>
			</label>
			<div className={styles.formRow}>
				<label className={ui.field}>
					<span className={ui.label}>Предмет</span>
					<input
						className={ui.input}
						list='hw-subjects'
						value={subject}
						maxLength={100}
						onChange={e => setSubject(e.target.value)}
						placeholder='Выберите или введите'
					/>
				</label>
				<label className={ui.field}>
					<span className={ui.label}>Тема / раздел</span>
					<input
						className={ui.input}
						value={topic}
						maxLength={200}
						onChange={e => setTopic(e.target.value)}
						placeholder='Например: ОГЭ, задание 9'
					/>
				</label>
			</div>
			<label className={ui.field}>
				<span className={ui.label}>Задание</span>
				<textarea
					className={ui.textarea}
					style={{ minHeight: 160 }}
					value={description}
					maxLength={10000}
					onChange={e => setDescription(e.target.value)}
					placeholder='Условия, ссылки, пояснения для ученика'
				/>
			</label>
			<div className={ui.field}>
				<span className={ui.label}>Файлы</span>
				<FileAttachments files={files} onChange={setFiles} onUploadingChange={setIsUploading} />
			</div>
			<SubjectsDatalist />
		</Modal>
	)
}

export const SubjectsDatalist = () => (
	<datalist id='hw-subjects'>
		{SUBJECTS.map(s => (
			<option key={s} value={s} />
		))}
	</datalist>
)

// ---------- Выдача задания ----------

interface AssignModalProps {
	initialMaterial: HomeworkMaterial | null
	initialStudentId?: string | null
	onClose: () => void
	onCreated: (count: number) => void
}

export const AssignModal = ({ initialMaterial, initialStudentId, onClose, onCreated }: AssignModalProps) => {
	const { showAlert } = useAlert()
	const [students, setStudents] = useState<HomeworkUser[] | null>(null)
	const [materials, setMaterials] = useState<HomeworkMaterial[]>([])
	const [selectedStudents, setSelectedStudents] = useState<string[]>(initialStudentId ? [initialStudentId] : [])
	const [materialId, setMaterialId] = useState<string>(initialMaterial?.id ?? '')
	const [title, setTitle] = useState(initialMaterial?.title ?? '')
	const [subject, setSubject] = useState(initialMaterial?.subject ?? '')
	const [description, setDescription] = useState(initialMaterial?.description ?? '')
	const [files, setFiles] = useState<StoredFile[]>(initialMaterial?.files ?? [])
	const [deadline, setDeadline] = useState('')
	const [saveToLibrary, setSaveToLibrary] = useState(false)
	const [isUploading, setIsUploading] = useState(false)
	const [isSaving, setIsSaving] = useState(false)

	useEffect(() => {
		getHomeworkStudents()
			.then(setStudents)
			.catch(() => setStudents([]))
		getMaterials()
			.then(setMaterials)
			.catch(() => undefined)
	}, [])

	const pickMaterial = (id: string) => {
		setMaterialId(id)
		const material = materials.find(m => m.id === id)
		if (material) {
			setTitle(material.title)
			setSubject(material.subject ?? '')
			setDescription(material.description ?? '')
			setFiles(material.files)
			setSaveToLibrary(false)
		}
	}

	const toggleStudent = (id: string) =>
		setSelectedStudents(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]))

	const submit = async () => {
		setIsSaving(true)
		try {
			const result = await createAssignments({
				studentIds: selectedStudents,
				materialId: materialId || null,
				title: title || null,
				subject: subject || null,
				description: description || null,
				files,
				deadline: fromLocalInput(deadline),
				saveToLibrary: !materialId && saveToLibrary,
				topic: null,
			})
			onCreated(result.ids.length)
		} catch (err) {
			showAlert(getApiErrorMessage(err, 'Не удалось выдать задание'), 'error')
		} finally {
			setIsSaving(false)
		}
	}

	const canSubmit = selectedStudents.length > 0 && title.trim() && !isSaving && !isUploading

	return (
		<Modal
			wide
			title='Выдать домашнее задание'
			onClose={onClose}
			footer={
				<>
					<span className={ui.muted} style={{ marginRight: 'auto' }}>
						{selectedStudents.length > 0
							? `Получат: ${selectedStudents.length}`
							: 'Выберите учеников'}
					</span>
					<button type='button' className={ui.btn} onClick={onClose}>
						Отмена
					</button>
					<button type='button' className={ui.btnPrimary} onClick={submit} disabled={!canSubmit}>
						{isSaving ? 'Выдаём…' : 'Выдать задание'}
					</button>
				</>
			}
		>
			<div className={ui.field}>
				<span className={ui.label}>Ученики *</span>
				{students === null ? (
					<div className={ui.skeleton} style={{ height: 40 }} />
				) : students.length === 0 ? (
					<span className={ui.muted}>За вами пока не закреплены ученики. Их добавляет администратор.</span>
				) : (
					<div className={ui.row}>
						{students.length > 1 && (
							<button
								type='button'
								className={ui.chip}
								onClick={() =>
									setSelectedStudents(
										selectedStudents.length === students.length ? [] : students.map(s => s.id),
									)
								}
							>
								{selectedStudents.length === students.length ? 'Снять всех' : 'Выбрать всех'}
							</button>
						)}
						{students.map(student => (
							<button
								key={student.id}
								type='button'
								className={selectedStudents.includes(student.id) ? ui.chipActive : ui.chip}
								onClick={() => toggleStudent(student.id)}
								aria-pressed={selectedStudents.includes(student.id)}
							>
								{userName(student)}
							</button>
						))}
					</div>
				)}
			</div>

			{materials.length > 0 && (
				<label className={ui.field}>
					<span className={ui.label}>Из библиотеки</span>
					<select className={ui.select} value={materialId} onChange={e => pickMaterial(e.target.value)}>
						<option value=''>— Новое задание —</option>
						{materials.map(m => (
							<option key={m.id} value={m.id}>
								{m.title}
								{m.subject ? ` · ${m.subject}` : ''}
								{m.topic ? ` · ${m.topic}` : ''}
							</option>
						))}
					</select>
				</label>
			)}

			<div className={styles.formRow}>
				<label className={ui.field}>
					<span className={ui.label}>Название *</span>
					<input className={ui.input} value={title} maxLength={200} onChange={e => setTitle(e.target.value)} />
				</label>
				<label className={ui.field}>
					<span className={ui.label}>Предмет</span>
					<input
						className={ui.input}
						list='hw-subjects'
						value={subject}
						maxLength={100}
						onChange={e => setSubject(e.target.value)}
					/>
				</label>
			</div>

			<label className={ui.field}>
				<span className={ui.label}>Задание</span>
				<textarea
					className={ui.textarea}
					style={{ minHeight: 140 }}
					value={description}
					maxLength={10000}
					onChange={e => setDescription(e.target.value)}
					placeholder='Что нужно сделать'
				/>
			</label>

			<div className={ui.field}>
				<span className={ui.label}>Файлы</span>
				<FileAttachments files={files} onChange={setFiles} onUploadingChange={setIsUploading} />
			</div>

			<div className={styles.formRow}>
				<label className={ui.field}>
					<span className={ui.label}>Срок сдачи</span>
					<input
						className={ui.input}
						type='datetime-local'
						value={deadline}
						min={toLocalInput(new Date().toISOString())}
						onChange={e => setDeadline(e.target.value)}
					/>
				</label>
				{!materialId && (
					<label className={ui.checkbox} style={{ alignSelf: 'end', minHeight: 40 }}>
						<input type='checkbox' checked={saveToLibrary} onChange={e => setSaveToLibrary(e.target.checked)} />
						Сохранить в библиотеку
					</label>
				)}
			</div>
			<SubjectsDatalist />
		</Modal>
	)
}
