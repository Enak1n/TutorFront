import { useCallback, useEffect, useState } from 'react'
import {
	deleteAssignment,
	getAssignment,
	reviewHomework,
	STATUS_LABELS,
	submitHomework,
	updateAssignment,
	userName,
	type HomeworkDetail,
	type HomeworkStatus,
} from '@api/homework'
import { getApiErrorMessage, type StoredFile } from '@api/files'
import { useAlert } from '@components/ui/alert/AlertContext'
import { FileAttachments, FileList } from '@components/pro/FileAttachments'
import { Avatar } from '@components/ui/Avatar/Avatar'
import { fromLocalInput, Modal, SubjectsDatalist, toLocalInput } from './HomeworkModals'
// @ts-ignore
import ui from '@components/pro/ui.module.scss'
// @ts-ignore
import styles from './HomeworkPage.module.scss'

export const statusBadgeClass = (status: HomeworkStatus, isOverdue: boolean) => {
	if (isOverdue) return ui.badgeDanger
	switch (status) {
		case 'submitted':
			return ui.badgeAccent
		case 'returned':
			return ui.badgeWarning
		case 'reviewed':
			return ui.badgeSuccess
		default:
			return ui.badge
	}
}

export const formatDateTime = (iso: string) =>
	new Date(iso).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

interface HomeworkDetailModalProps {
	assignmentId: string
	onClose: () => void
	onChanged: () => void
}

export const HomeworkDetailModal = ({ assignmentId, onClose, onChanged }: HomeworkDetailModalProps) => {
	const { showAlert, showConfirm } = useAlert()
	const [detail, setDetail] = useState<HomeworkDetail | null>(null)
	const [error, setError] = useState<string | null>(null)
	const [text, setText] = useState('')
	const [files, setFiles] = useState<StoredFile[]>([])
	const [isUploading, setIsUploading] = useState(false)
	const [isSending, setIsSending] = useState(false)
	const [grade, setGrade] = useState('')
	const [comment, setComment] = useState('')
	const [isEditing, setIsEditing] = useState(false)

	const load = useCallback(async () => {
		try {
			const data = await getAssignment(assignmentId)
			setDetail(data)
			setGrade(data.grade ?? '')
			setComment(data.tutorComment ?? '')
		} catch (err) {
			setError(getApiErrorMessage(err, 'Не удалось загрузить задание'))
		}
	}, [assignmentId])

	useEffect(() => {
		load()
	}, [load])

	// Пришло уведомление (например, ученик сдал решение) — обновим ленту.
	useEffect(() => {
		const onNotification = () => load()
		window.addEventListener('app:notification', onNotification)
		return () => window.removeEventListener('app:notification', onNotification)
	}, [load])

	const send = async () => {
		if (!detail) return
		setIsSending(true)
		try {
			setDetail(await submitHomework(detail.id, text.trim() || null, files))
			setText('')
			setFiles([])
			onChanged()
			showAlert(detail.permissions.canSubmit ? 'Решение отправлено репетитору' : 'Комментарий отправлен', 'success')
		} catch (err) {
			showAlert(getApiErrorMessage(err, 'Не удалось отправить'), 'error')
		} finally {
			setIsSending(false)
		}
	}

	const review = async (status: 'reviewed' | 'returned') => {
		if (!detail) return
		setIsSending(true)
		try {
			setDetail(await reviewHomework(detail.id, status, grade.trim() || null, comment.trim() || null))
			onChanged()
			showAlert(status === 'reviewed' ? 'Задание отмечено проверенным' : 'Задание возвращено на доработку', 'success')
		} catch (err) {
			showAlert(getApiErrorMessage(err, 'Не удалось сохранить проверку'), 'error')
		} finally {
			setIsSending(false)
		}
	}

	const remove = () =>
		showConfirm('Удалить задание вместе с решениями? Это действие необратимо.', async () => {
			try {
				await deleteAssignment(assignmentId)
				onChanged()
				onClose()
			} catch (err) {
				showAlert(getApiErrorMessage(err, 'Не удалось удалить'), 'error')
			}
		})

	if (error || !detail) {
		return (
			<Modal title='Домашнее задание' onClose={onClose} footer={<button type='button' className={ui.btn} onClick={onClose}>Закрыть</button>}>
				{error ? <div className={ui.noticeWarning}>{error}</div> : <div className={ui.skeleton} style={{ height: 200 }} />}
			</Modal>
		)
	}

	if (isEditing) {
		return (
			<EditAssignment
				detail={detail}
				onCancel={() => setIsEditing(false)}
				onSaved={updated => {
					setDetail(updated)
					setIsEditing(false)
					onChanged()
				}}
			/>
		)
	}

	const { permissions } = detail
	const canWrite = permissions.canSubmit || permissions.canComment

	return (
		<Modal
			wide
			title={detail.title}
			onClose={onClose}
			footer={
				<>
					{permissions.canEdit && (
						<>
							<button type='button' className={ui.btnDanger} onClick={remove}>
								Удалить
							</button>
							<button type='button' className={ui.btn} onClick={() => setIsEditing(true)}>
								Редактировать
							</button>
						</>
					)}
					<span className={ui.spacer} />
					<button type='button' className={ui.btn} onClick={onClose}>
						Закрыть
					</button>
				</>
			}
		>
			<div className={styles.detailMeta}>
				<span className={statusBadgeClass(detail.status, detail.isOverdue)}>
					{detail.isOverdue ? 'Просрочено' : STATUS_LABELS[detail.status]}
				</span>
				{detail.subject && <span className={ui.badge}>{detail.subject}</span>}
				{detail.deadline && <span className={ui.muted}>Сдать до {formatDateTime(detail.deadline)}</span>}
				{detail.grade && <span className={ui.badgeSuccess}>Оценка: {detail.grade}</span>}
			</div>

			<div className={styles.people}>
				<span>
					<span className={ui.muted}>Репетитор:</span> {userName(detail.tutor)}
				</span>
				<span>
					<span className={ui.muted}>Ученик:</span> {userName(detail.student)}
				</span>
			</div>

			{(detail.description || detail.files.length > 0) && (
				<section className={styles.taskBox}>
					{detail.description && <p className={styles.taskText}>{detail.description}</p>}
					<FileList files={detail.files} />
				</section>
			)}

			{detail.tutorComment && (
				<div className={detail.status === 'returned' ? ui.noticeWarning : ui.notice}>
					<strong>Комментарий репетитора:</strong> {detail.tutorComment}
				</div>
			)}

			<section>
				<h3 className={ui.sectionTitle}>
					Решение и обсуждение{' '}
					{detail.submissions.length > 0 && <span className={ui.badge}>{detail.submissions.length}</span>}
				</h3>
				{detail.submissions.length === 0 ? (
					<p className={ui.muted}>
						{permissions.canSubmit ? 'Решение ещё не отправлено.' : 'Ученик ещё не прислал решение.'}
					</p>
				) : (
					<ol className={styles.feed}>
						{detail.submissions.map(item => {
							const fromTutor = item.author.id === detail.tutor.id
							return (
								<li key={item.id} className={fromTutor ? styles.feedTutor : styles.feedItem}>
									<Avatar
										src={item.author.photoUrl}
										firstName={item.author.firstName ?? ''}
										lastName={item.author.lastName ?? ''}
										size={32}
									/>
									<div className={styles.feedBody}>
										<div className={styles.feedHead}>
											<strong>{userName(item.author)}</strong>
											<span className={ui.muted}>{formatDateTime(item.createdAt)}</span>
										</div>
										{item.text && <p className={styles.taskText}>{item.text}</p>}
										<FileList files={item.files} />
									</div>
								</li>
							)
						})}
					</ol>
				)}
			</section>

			{canWrite && (
				<section className={styles.composer}>
					<label className={ui.field}>
						<span className={ui.label}>
							{permissions.canSubmit
								? detail.status === 'returned'
									? 'Исправленное решение'
									: 'Ваше решение'
								: 'Комментарий ученику'}
						</span>
						<textarea
							className={ui.textarea}
							value={text}
							maxLength={10000}
							onChange={e => setText(e.target.value)}
							placeholder={permissions.canSubmit ? 'Ответ, пояснения или вопрос репетитору' : 'Пояснение, подсказка…'}
						/>
					</label>
					<div className={ui.row}>
						<FileAttachments files={files} onChange={setFiles} onUploadingChange={setIsUploading} />
						<span className={ui.spacer} />
						<button
							type='button'
							className={ui.btnPrimary}
							onClick={send}
							disabled={isSending || isUploading || (!text.trim() && files.length === 0)}
						>
							{permissions.canSubmit ? 'Отправить решение' : 'Отправить'}
						</button>
					</div>
				</section>
			)}

			{permissions.canReview && (
				<section className={styles.reviewBox}>
					<h3 className={ui.sectionTitle}>Проверка</h3>
					<div className={styles.formRow}>
						<label className={ui.field}>
							<span className={ui.label}>Оценка</span>
							<input
								className={ui.input}
								value={grade}
								maxLength={32}
								onChange={e => setGrade(e.target.value)}
								placeholder='5, зачёт, 8/10'
							/>
						</label>
						<label className={ui.field}>
							<span className={ui.label}>Комментарий</span>
							<input
								className={ui.input}
								value={comment}
								maxLength={4000}
								onChange={e => setComment(e.target.value)}
								placeholder='Что получилось, что исправить'
							/>
						</label>
					</div>
					<div className={ui.row}>
						<button type='button' className={ui.btnPrimary} disabled={isSending} onClick={() => review('reviewed')}>
							Принять
						</button>
						<button type='button' className={ui.btn} disabled={isSending} onClick={() => review('returned')}>
							Вернуть на доработку
						</button>
					</div>
				</section>
			)}
		</Modal>
	)
}

const EditAssignment = ({
	detail,
	onCancel,
	onSaved,
}: {
	detail: HomeworkDetail
	onCancel: () => void
	onSaved: (detail: HomeworkDetail) => void
}) => {
	const { showAlert } = useAlert()
	const [title, setTitle] = useState(detail.title)
	const [subject, setSubject] = useState(detail.subject ?? '')
	const [description, setDescription] = useState(detail.description ?? '')
	const [files, setFiles] = useState<StoredFile[]>(detail.files)
	const [deadline, setDeadline] = useState(toLocalInput(detail.deadline))
	const [isUploading, setIsUploading] = useState(false)
	const [isSaving, setIsSaving] = useState(false)

	const save = async () => {
		setIsSaving(true)
		try {
			onSaved(
				await updateAssignment(detail.id, {
					title,
					subject: subject || null,
					description: description || null,
					files,
					deadline: fromLocalInput(deadline),
				}),
			)
		} catch (err) {
			showAlert(getApiErrorMessage(err, 'Не удалось сохранить'), 'error')
		} finally {
			setIsSaving(false)
		}
	}

	return (
		<Modal
			wide
			title='Редактировать задание'
			onClose={onCancel}
			footer={
				<>
					<button type='button' className={ui.btn} onClick={onCancel}>
						Отмена
					</button>
					<button
						type='button'
						className={ui.btnPrimary}
						onClick={save}
						disabled={!title.trim() || isSaving || isUploading}
					>
						Сохранить
					</button>
				</>
			}
		>
			<div className={styles.formRow}>
				<label className={ui.field}>
					<span className={ui.label}>Название *</span>
					<input className={ui.input} value={title} maxLength={200} onChange={e => setTitle(e.target.value)} />
				</label>
				<label className={ui.field}>
					<span className={ui.label}>Предмет</span>
					<input className={ui.input} list='hw-subjects' value={subject} onChange={e => setSubject(e.target.value)} />
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
				/>
			</label>
			<div className={ui.field}>
				<span className={ui.label}>Файлы</span>
				<FileAttachments files={files} onChange={setFiles} onUploadingChange={setIsUploading} />
			</div>
			<label className={ui.field} style={{ maxWidth: 280 }}>
				<span className={ui.label}>Срок сдачи</span>
				<input className={ui.input} type='datetime-local' value={deadline} onChange={e => setDeadline(e.target.value)} />
			</label>
			<SubjectsDatalist />
		</Modal>
	)
}
