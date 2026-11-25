import { useEffect, useMemo, useState } from 'react'
import {
	bookSlot,
	getApiErrorMessage,
	getBookableStudents,
	type AvailabilitySlot,
	type BookableStudent,
} from '@api/availability'
import { useAlert } from '@components/ui/alert/AlertContext'
import {
	LESSON_CATEGORY_LABELS,
	LESSON_CONFIG_MAP,
	LESSON_TYPE_LABELS,
	LESSON_TYPE_OPTIONS,
	LessonCategory,
	LessonType,
} from '@appTypes/LessonConfig'
import { formatDayTitle, fromDateKey, minutesToTime, shortTime, timeToMinutes } from '../../../utils/date'
import styles from './BookingModal.module.scss'

interface BookingModalProps {
	slot: AvailabilitySlot
	onClose: () => void
	onBooked: () => void
}

const DURATIONS = [30, 45, 60, 90, 120]
const STEP = 15

const formatDuration = (minutes: number) =>
	minutes < 60 ? `${minutes} мин` : minutes % 60 === 0 ? `${minutes / 60} ч` : `${Math.floor(minutes / 60)} ч ${minutes % 60} мин`

const studentName = (student: BookableStudent) =>
	student.isSelf ? 'Я' : `${student.firstName ?? ''} ${student.lastName ?? ''}`.trim() || 'Ребёнок'

export const BookingModal = ({ slot, onClose, onBooked }: BookingModalProps) => {
	const { showAlert } = useAlert()

	const windowStart = timeToMinutes(shortTime(slot.startTime))
	const windowEnd = timeToMinutes(shortTime(slot.endTime))

	const [students, setStudents] = useState<BookableStudent[]>([])
	const [studentId, setStudentId] = useState<string>('')
	const [start, setStart] = useState(windowStart)
	const [duration, setDuration] = useState(Math.min(60, windowEnd - windowStart))
	const [lessonType, setLessonType] = useState<LessonType>(LessonType.Mathematics)
	const [lessonCategory, setLessonCategory] = useState<LessonCategory>(LESSON_CONFIG_MAP[LessonType.Mathematics][0])
	const [note, setNote] = useState('')
	const [isSubmitting, setIsSubmitting] = useState(false)

	useEffect(() => {
		getBookableStudents(slot.tutorId)
			.then(items => {
				setStudents(items)
				setStudentId(items[0]?.id ?? '')
			})
			.catch(() => setStudents([]))
	}, [slot.tutorId])

	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
		document.addEventListener('keydown', onKeyDown)
		return () => document.removeEventListener('keydown', onKeyDown)
	}, [onClose])

	const startOptions = useMemo(() => {
		const options: number[] = []
		for (let minute = windowStart; minute + DURATIONS[0] <= windowEnd; minute += STEP) options.push(minute)
		return options
	}, [windowStart, windowEnd])

	const durationOptions = DURATIONS.filter(value => start + value <= windowEnd)

	useEffect(() => {
		if (!durationOptions.includes(duration) && durationOptions.length > 0) {
			setDuration(durationOptions.includes(60) ? 60 : durationOptions[durationOptions.length - 1])
		}
	}, [durationOptions, duration])

	const categoryOptions = LESSON_CONFIG_MAP[lessonType]

	const changeLessonType = (value: LessonType) => {
		setLessonType(value)
		if (!LESSON_CONFIG_MAP[value].includes(lessonCategory)) setLessonCategory(LESSON_CONFIG_MAP[value][0])
	}

	const submit = async (event: React.FormEvent) => {
		event.preventDefault()
		setIsSubmitting(true)

		try {
			await bookSlot({
				availabilityId: slot.id,
				startTime: minutesToTime(start),
				durationMinutes: duration,
				lessonType: LESSON_TYPE_LABELS[lessonType],
				lessonCategory: LESSON_CATEGORY_LABELS[lessonCategory],
				studentId: studentId || undefined,
				note: note.trim() || undefined,
			})
			showAlert('Вы записаны на занятие! Репетитор получит уведомление.', 'success')
			onBooked()
		} catch (error) {
			showAlert(getApiErrorMessage(error, 'Не удалось записаться на занятие'), 'error')
		} finally {
			setIsSubmitting(false)
		}
	}

	const noStudents = students.length === 0

	return (
		<div className={styles.overlay} onClick={onClose}>
			<form
				className={styles.modal}
				onClick={event => event.stopPropagation()}
				onSubmit={submit}
				role='dialog'
				aria-modal='true'
				aria-labelledby='booking-title'
			>
				<button type='button' className={styles.close} onClick={onClose} aria-label='Закрыть'>
					×
				</button>

				<h2 id='booking-title' className={styles.title}>
					Запись на занятие
				</h2>
				<p className={styles.subtitle}>
					{slot.tutorName} · {formatDayTitle(fromDateKey(slot.date))}
					<br />
					Свободно {shortTime(slot.startTime)}–{shortTime(slot.endTime)} (МСК)
				</p>

				{students.length > 1 && (
					<label className={styles.field}>
						<span>Кого записать</span>
						<select value={studentId} onChange={event => setStudentId(event.target.value)}>
							{students.map(student => (
								<option key={student.id} value={student.id}>
									{studentName(student)}
								</option>
							))}
						</select>
					</label>
				)}

				<div className={styles.row}>
					<label className={styles.field}>
						<span>Начало (МСК)</span>
						<select value={start} onChange={event => setStart(Number(event.target.value))}>
							{startOptions.map(minute => (
								<option key={minute} value={minute}>
									{minutesToTime(minute)}
								</option>
							))}
						</select>
					</label>

					<label className={styles.field}>
						<span>Длительность</span>
						<select value={duration} onChange={event => setDuration(Number(event.target.value))}>
							{durationOptions.map(value => (
								<option key={value} value={value}>
									{formatDuration(value)}
								</option>
							))}
						</select>
					</label>
				</div>

				<div className={styles.row}>
					<label className={styles.field}>
						<span>Предмет</span>
						<select value={lessonType} onChange={event => changeLessonType(event.target.value as LessonType)}>
							{LESSON_TYPE_OPTIONS.map(option => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</select>
					</label>

					<label className={styles.field}>
						<span>Направление</span>
						<select value={lessonCategory} onChange={event => setLessonCategory(event.target.value as LessonCategory)}>
							{categoryOptions.map(category => (
								<option key={category} value={category}>
									{LESSON_CATEGORY_LABELS[category]}
								</option>
							))}
						</select>
					</label>
				</div>

				<label className={styles.field}>
					<span>Комментарий для репетитора</span>
					<textarea
						value={note}
						onChange={event => setNote(event.target.value)}
						rows={2}
						maxLength={500}
						placeholder='Например, тема, которую хочется разобрать'
					/>
				</label>

				<div className={styles.summary}>
					{minutesToTime(start)}–{minutesToTime(start + duration)} · {formatDuration(duration)}
				</div>

				{noStudents && (
					<p className={styles.warning}>Вы не закреплены за этим репетитором. Обратитесь к администратору.</p>
				)}

				<div className={styles.actions}>
					<button type='button' className={styles.cancel} onClick={onClose}>
						Отмена
					</button>
					<button
						type='submit'
						className={styles.submit}
						disabled={isSubmitting || noStudents || durationOptions.length === 0}
					>
						{isSubmitting ? 'Записываем…' : 'Записаться'}
					</button>
				</div>
			</form>
		</div>
	)
}
