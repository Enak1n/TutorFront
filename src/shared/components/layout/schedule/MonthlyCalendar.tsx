// ===== src/shared/components/layout/schedule/MonthlyCalendar.tsx =====
'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
// @ts-ignore
import styles from './MonthlyCalendar.module.scss'
import {
	getTutorAvailability,
	getLessonCountByDay,
	updateAvailability,
	type AvailabilitySlot,
	type DayLessonCount,
} from '@api/availability'
import { useAuth } from '../../../auth/AuthContext'
import { useAlert } from '@components/ui/alert/AlertContext'
import { LessonModal } from './LessonModal'
import { Lesson } from '@api/schedule'

interface MonthlyCalendarProps {
	userRole: 'tutor' | 'student_or_parent' | 'admin'
	onDayClick?: (date: Date) => void
}

interface DayData {
	date: Date
	dayNumber: number
	isToday: boolean
	isWeekend: boolean
	lessonCount: number
	availabilitySlots: AvailabilitySlot[]
}

const MONTH_NAMES = [
	'Январь',
	'Февраль',
	'Март',
	'Апрель',
	'Май',
	'Июнь',
	'Июль',
	'Август',
	'Сентябрь',
	'Октябрь',
	'Ноябрь',
	'Декабрь',
]
const DAY_NAMES = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

export const MonthlyCalendar: React.FC<MonthlyCalendarProps> = ({
	userRole,
	onDayClick,
}) => {
	const { showAlert } = useAlert()
	const { userId } = useAuth()
	const [currentMonth, setCurrentMonth] = useState(new Date())
	const [daysData, setDaysData] = useState<Map<string, DayData>>(new Map())
	const [isLoading, setIsLoading] = useState(false)

	// LessonModal states
	const [isLessonModalOpen, setIsLessonModalOpen] = useState(false)
	const [modalInitialDate, setModalInitialDate] = useState<Date | null>(null)
	const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)
	const [modalReadOnly, setModalReadOnly] = useState(false)

	// Availability slot modal states
	const [isAvailabilityModalOpen, setIsAvailabilityModalOpen] = useState(false)
	const [selectedDayForSlot, setSelectedDayForSlot] = useState<Date | null>(
		null,
	)
	const [slotStartTime, setSlotStartTime] = useState('10:00')
	const [slotEndTime, setSlotEndTime] = useState('11:00')

	const monthKey = useMemo(() => {
		const y = currentMonth.getFullYear()
		const m = String(currentMonth.getMonth() + 1).padStart(2, '0')
		return `${y}-${m}`
	}, [currentMonth])

	// Генерация вариантов времени (8:00 - 22:00, шаг 30 мин)
	const generateTimeOptions = useCallback(() => {
		const options: string[] = []
		for (let h = 8; h <= 22; h++) {
			for (let m = 0; m < 60; m += 30) {
				if (h === 22 && m > 0) break
				const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
				options.push(time)
			}
		}
		return options
	}, [])

	const timeOptions = useMemo(
		() => generateTimeOptions(),
		[generateTimeOptions],
	)

	// Инициализация дней месяца
	const initDays = useCallback(() => {
		const map = new Map<string, DayData>()
		const y = currentMonth.getFullYear()
		const m = currentMonth.getMonth()
		const daysInMonth = new Date(y, m + 1, 0).getDate()
		const today = new Date()

		for (let d = 1; d <= daysInMonth; d++) {
			const date = new Date(y, m, d)
			// 🔥 Формируем dateStr вручную, чтобы избежать проблем с таймзоной
			const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
			const dayOfWeek = date.getDay()

			map.set(dateStr, {
				date,
				dayNumber: d,
				isToday: date.toDateString() === today.toDateString(),
				// 🔥 0 = Вс, 6 = Сб
				isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
				lessonCount: 0,
				availabilitySlots: [],
			})
		}
		return map
	}, [currentMonth])

	// Загрузка данных с бэкенда
	const fetchData = useCallback(async () => {
		setIsLoading(true)
		try {
			const daysMap = initDays()

			if (userRole === 'tutor') {
				const slots = await getTutorAvailability(monthKey).catch(() => [])
				if (Array.isArray(slots)) {
					slots.forEach(slot => {
						const day = daysMap.get(slot.date)
						if (day) day.availabilitySlots.push(slot)
					})
				}
			} else if (userRole === 'student_or_parent') {
				const [counts, slots] = await Promise.all([
					getLessonCountByDay(monthKey).catch(() => []),
					getTutorAvailability(monthKey).catch(() => []),
				])
				if (Array.isArray(counts)) {
					counts.forEach(c => {
						const day = daysMap.get(c.date)
						if (day) day.lessonCount = c.count
					})
				}
				if (Array.isArray(slots)) {
					slots.forEach(slot => {
						const day = daysMap.get(slot.date)
						if (day) day.availabilitySlots.push(slot)
					})
				}
			} else if (userRole === 'admin') {
				const counts = await getLessonCountByDay(monthKey).catch(() => [])
				if (Array.isArray(counts)) {
					counts.forEach(c => {
						const day = daysMap.get(c.date)
						if (day) day.lessonCount = c.count
					})
				}
			}

			setDaysData(daysMap)
		} catch (err) {
			console.error('Fetch error:', err)
			setDaysData(initDays())
		} finally {
			setIsLoading(false)
		}
	}, [monthKey, userRole, initDays])

	useEffect(() => {
		fetchData()
	}, [fetchData])

	// Генерация сетки календаря
	const calendarDays = useMemo(() => {
		const y = currentMonth.getFullYear()
		const m = currentMonth.getMonth()
		const firstDay = new Date(y, m, 1)
		const lastDay = new Date(y, m + 1, 0)

		// 🔥 Правильное смещение для сетки с понедельника
		// getDay(): 0=Вс, 1=Пн, ..., 6=Сб
		// Нам нужно: Пн=0, Вт=1, ..., Вс=6
		const jsDayOfWeek = firstDay.getDay()
		const startOffset = jsDayOfWeek === 0 ? 6 : jsDayOfWeek - 1

		const daysInMonth = lastDay.getDate()
		const result: (DayData | null)[] = []

		for (let i = 0; i < startOffset; i++) result.push(null)

		for (let d = 1; d <= daysInMonth; d++) {
			const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
			result.push(daysData.get(dateStr) || null)
		}

		return result
	}, [currentMonth, daysData])

	// Навигация
	const handlePrev = () =>
		setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))
	const handleNext = () =>
		setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))
	const handleToday = () => setCurrentMonth(new Date())

	// Клик по дню — открытие LessonModal
	const handleDayClick = useCallback(
		(day: DayData) => {
			if (userRole === 'tutor' || userRole === 'admin') {
				const dateWithTime = new Date(day.date)
				dateWithTime.setHours(10, 0, 0, 0)
				setModalInitialDate(dateWithTime)
				setSelectedLesson(null)
				setModalReadOnly(false)
				setIsLessonModalOpen(true)
			} else if (onDayClick) {
				onDayClick(day.date)
			}
		},
		[userRole, onDayClick],
	)

	// Клик по слоту доступности (студент)
	const handleSlotClick = useCallback(
		(slot: AvailabilitySlot, e: React.MouseEvent) => {
			e.stopPropagation()
			if (userRole === 'student_or_parent') {
				const [slotHour, slotMinute] = slot.startTime.split(':').map(Number)
				const slotDate = new Date(`${slot.date}T${slot.startTime}:00`)
				slotDate.setHours(slotHour, slotMinute, 0, 0)
				setModalInitialDate(slotDate)
				setSelectedLesson(null)
				setModalReadOnly(false)
				setIsLessonModalOpen(true)
			}
		},
		[userRole],
	)

	// Callbacks для LessonModal
	const handleLessonCreated = useCallback(
		(newLesson: any) => {
			showAlert('Занятие создано!', 'success')
			fetchData()
		},
		[showAlert, fetchData],
	)

	const handleLessonUpdated = useCallback(
		(updatedLesson: Lesson) => {
			showAlert('Занятие обновлено!', 'success')
			fetchData()
		},
		[showAlert, fetchData],
	)

	const handleLessonDeleted = useCallback(
		(lessonId: string) => {
			showAlert('Занятие удалено!', 'success')
			fetchData()
		},
		[showAlert, fetchData],
	)

	const handleOpenAvailabilityModal = useCallback(
		(day: DayData) => {
			console.log('🔘 Клик по "+" кнопке:', {
				day: day.date,
				userRole,
				isAvailabilityModalOpen: true,
			})
			setSelectedDayForSlot(day.date)
			setSlotStartTime('10:00')
			setSlotEndTime('11:00')
			setIsAvailabilityModalOpen(true)
		},
		[userRole],
	)

	// 🔥 Создание слота доступности
	const handleCreateAvailabilitySlot = useCallback(async () => {
		if (!selectedDayForSlot) return
		try {
			if (slotStartTime >= slotEndTime) {
				showAlert('Время начала должно быть раньше времени окончания', 'error')
				return
			}
			const formattedDate = `${selectedDayForSlot.getFullYear()}-${String(selectedDayForSlot.getMonth() + 1).padStart(2, '0')}-${String(selectedDayForSlot.getDate()).padStart(2, '0')}`

			await updateAvailability({
				date: formattedDate,
				startTime: slotStartTime,
				endTime: slotEndTime,
				isAvailable: true,
			})
			showAlert('Окно доступности добавлено', 'success')
			setIsAvailabilityModalOpen(false)
			fetchData()
		} catch {
			showAlert('Ошибка при создании окна', 'error')
		}
	}, [selectedDayForSlot, slotStartTime, slotEndTime, showAlert, fetchData])

	// Рендер ячейки дня
	const renderDay = useCallback(
		(day: DayData | null, idx: number) => {
			if (!day) return <div key={idx} className={styles.emptyCell} />

			const hasLessons = day.lessonCount > 0
			const available = day.availabilitySlots.filter(
				s => s.isAvailable !== false,
			)

			return (
				<div
					key={idx}
					className={`${styles.dayCell} ${day.isToday ? styles.today : ''} ${day.isWeekend ? styles.weekend : ''}`}
					onClick={() => handleDayClick(day)}
					style={{ cursor: 'pointer' }}
				>
					<div className={styles.dayHeader}>
						<span className={styles.dayNumber}>{day.dayNumber}</span>
						{day.isToday && <span className={styles.todayBadge}>Сегодня</span>}
					</div>

					{hasLessons && (
						<div
							className={styles.lessonBadge}
							onClick={e => e.stopPropagation()}
						>
							{day.lessonCount} зан.
						</div>
					)}

					{userRole === 'student_or_parent' && available.length > 0 && (
						<div className={styles.slots}>
							{available.map(slot => (
								<button
									key={slot.id}
									className={styles.slotBtn}
									onClick={e => handleSlotClick(slot, e)}
								>
									{slot.startTime}–{slot.endTime}
								</button>
							))}
						</div>
					)}

					{userRole === 'tutor' && (
						<button
							className={styles.addBtn}
							onClick={e => {
								e.stopPropagation()
								handleOpenAvailabilityModal(day)
							}}
							title='Добавить окно доступности'
							type='button'
						>
							+
						</button>
					)}
				</div>
			)
		},
		[handleDayClick, handleSlotClick, handleOpenAvailabilityModal, userRole],
	)

	return (
		<>
			<div className={styles.calendar}>
				{/* Шапка */}
				<div className={styles.header}>
					<div className={styles.headerLeft}>
						<button
							className={styles.navBtn}
							onClick={handlePrev}
							type='button'
						>
							‹
						</button>
					</div>
					<div className={styles.headerCenter}>
						<h2 className={styles.title}>
							{MONTH_NAMES[currentMonth.getMonth()]}{' '}
							{currentMonth.getFullYear()}
						</h2>
					</div>
					<div className={styles.headerRight}>
						<button
							className={styles.navBtn}
							onClick={handleNext}
							type='button'
						>
							›
						</button>
						<button
							className={styles.todayBtn}
							onClick={handleToday}
							type='button'
						>
							Сегодня
						</button>
					</div>
				</div>

				{/* Дни недели */}
				<div className={styles.weekdays}>
					{DAY_NAMES.map(d => (
						<div key={d} className={styles.wd}>
							{d}
						</div>
					))}
				</div>

				{/* Сетка дней */}
				<div className={styles.grid}>
					{calendarDays.map((day, i) => renderDay(day, i))}
				</div>

				{isLoading && <div className={styles.overlay}>Загрузка...</div>}

				{/* Легенда */}
				<div className={styles.legend}>
					<div className={styles.legendItem}>
						<span className={`${styles.dot} ${styles.lessonDot}`} />
						<span>Занятия</span>
					</div>
					{userRole === 'student_or_parent' && (
						<div className={styles.legendItem}>
							<span className={`${styles.dot} ${styles.availableDot}`} />
							<span>Доступно</span>
						</div>
					)}
				</div>
			</div>

			{/* 🔥 Модалка создания окна доступности (для репетиторов) */}
			{isAvailabilityModalOpen && (
				<div
					className={styles.modalOverlay}
					onClick={() => setIsAvailabilityModalOpen(false)}
				>
					<div
						className={styles.availabilityModal}
						onClick={e => e.stopPropagation()}
					>
						<button
							className={styles.closeButton}
							onClick={() => setIsAvailabilityModalOpen(false)}
						>
							&times;
						</button>
						<h3 className={styles.modalTitle}>Добавить окно доступности</h3>

						{selectedDayForSlot && (
							<p className={styles.modalDate}>
								{selectedDayForSlot.toLocaleDateString('ru-RU', {
									weekday: 'long',
									day: 'numeric',
									month: 'long',
									year: 'numeric',
								})}
							</p>
						)}

						<div className={styles.timeRow}>
							<div className={styles.formGroup}>
								<label>Время начала:</label>
								<select
									value={slotStartTime}
									onChange={e => setSlotStartTime(e.target.value)}
									className={styles.selectInput}
								>
									{timeOptions.map(time => (
										<option key={time} value={time}>
											{time}
										</option>
									))}
								</select>
							</div>
							<div className={styles.formGroup}>
								<label>Время окончания:</label>
								<select
									value={slotEndTime}
									onChange={e => setSlotEndTime(e.target.value)}
									className={styles.selectInput}
								>
									{timeOptions.map(time => (
										<option key={time} value={time}>
											{time}
										</option>
									))}
								</select>
							</div>
						</div>

						<div className={styles.modalActions}>
							<button
								onClick={handleCreateAvailabilitySlot}
								className={styles.confirmBtn}
							>
								Добавить окно
							</button>
							<button
								onClick={() => setIsAvailabilityModalOpen(false)}
								className={styles.cancelBtn}
							>
								Отмена
							</button>
						</div>
					</div>
				</div>
			)}

			{/* 🔥 Твоя существующая LessonModal */}
			<LessonModal
				isOpen={isLessonModalOpen}
				onClose={() => setIsLessonModalOpen(false)}
				isReadOnly={modalReadOnly}
				initialDate={modalInitialDate}
				fromMonthlyCalendar={true}
				lesson={selectedLesson || undefined}
				onCreateSuccess={handleLessonCreated}
				onUpdateSuccess={handleLessonUpdated}
				onDeleteSuccess={handleLessonDeleted}
			/>
		</>
	)
}
