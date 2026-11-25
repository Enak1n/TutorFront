import { useEffect, useMemo, useState } from 'react'
import { getAvailability, getLessonCountByDay } from '@api/availability'
import {
	getMonthGrid,
	isSameDay,
	toDateKey,
	toMonthKey,
	WEEKDAY_SHORT,
} from '../../../utils/date'
import styles from './MonthCalendar.module.scss'

export type CalendarRole = 'tutor' | 'student_or_parent' | 'admin'

interface MonthCalendarProps {
	role: CalendarRole
	month: Date
	selectedDate: Date | null
	onSelectDate: (date: Date) => void
	/** Изменение значения заставляет перезагрузить данные (после создания/удаления занятий и окон). */
	refreshKey?: number
}

interface DayStats {
	lessons: number
	freeWindows: number
}

const MAX_DOTS = 5

const pluralLessons = (count: number) => {
	const mod10 = count % 10
	const mod100 = count % 100
	if (mod10 === 1 && mod100 !== 11) return 'занятие'
	if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'занятия'
	return 'занятий'
}

export const MonthCalendar = ({ role, month, selectedDate, onSelectDate, refreshKey = 0 }: MonthCalendarProps) => {
	const [stats, setStats] = useState<Record<string, DayStats>>({})
	const [isLoading, setIsLoading] = useState(false)

	const monthKey = toMonthKey(month)
	const days = useMemo(() => getMonthGrid(month), [monthKey])
	const today = new Date()

	useEffect(() => {
		let cancelled = false
		setIsLoading(true)

		const load = async () => {
			const [counts, slots] = await Promise.all([
				getLessonCountByDay(monthKey).catch(() => []),
				role === 'admin' ? Promise.resolve([]) : getAvailability(monthKey).catch(() => []),
			])

			if (cancelled) return

			const next: Record<string, DayStats> = {}
			const entry = (key: string) => (next[key] ??= { lessons: 0, freeWindows: 0 })

			counts.forEach(item => {
				entry(item.date).lessons = item.count
			})
			slots.forEach(slot => {
				entry(slot.date).freeWindows += 1
			})

			setStats(next)
			setIsLoading(false)
		}

		load()
		return () => {
			cancelled = true
		}
	}, [monthKey, role, refreshKey])

	return (
		<div className={styles.calendar}>
			<div className={styles.weekdays}>
				{WEEKDAY_SHORT.map((name, index) => (
					<span key={name} className={index >= 5 ? styles.weekendName : undefined}>
						{name}
					</span>
				))}
			</div>

			<div className={`${styles.grid} ${isLoading ? styles.loading : ''}`}>
				{days.map(day => {
					const key = toDateKey(day)
					const dayStats = stats[key]
					const isCurrentMonth = day.getMonth() === month.getMonth()
					const isToday = isSameDay(day, today)
					const isSelected = isSameDay(day, selectedDate)
					const lessons = isCurrentMonth ? (dayStats?.lessons ?? 0) : 0
					const freeWindows = isCurrentMonth ? (dayStats?.freeWindows ?? 0) : 0

					const label = [
						day.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }),
						lessons > 0 ? `${lessons} ${pluralLessons(lessons)}` : 'нет занятий',
						freeWindows > 0 ? 'есть свободное время' : '',
					]
						.filter(Boolean)
						.join(', ')

					return (
						<button
							key={key}
							type='button'
							className={[
								styles.day,
								!isCurrentMonth ? styles.outside : '',
								isToday ? styles.today : '',
								isSelected ? styles.selected : '',
								role === 'tutor' && freeWindows > 0 ? styles.hasFree : '',
							].join(' ')}
							onClick={() => onSelectDate(day)}
							aria-label={label}
							aria-pressed={isSelected}
						>
							<span className={styles.number}>{day.getDate()}</span>

							<span className={styles.markers}>
								{lessons > 0 &&
									(role === 'admin' ? (
										<span className={styles.count} title={`${lessons} ${pluralLessons(lessons)}`}>
											{lessons}
										</span>
									) : (
										<span className={styles.dots} title={`${lessons} ${pluralLessons(lessons)}`}>
											{Array.from({ length: Math.min(lessons, MAX_DOTS) }).map((_, index) => (
												<span key={index} className={styles.dot} />
											))}
											{lessons > MAX_DOTS && <span className={styles.more}>+{lessons - MAX_DOTS}</span>}
										</span>
									))}

								{freeWindows > 0 && (
									<span className={styles.free} title={role === 'tutor' ? 'Отмечено свободное время' : 'Можно записаться'}>
										{role === 'tutor' ? 'окно' : 'свободно'}
									</span>
								)}
							</span>
						</button>
					)
				})}
			</div>

			<div className={styles.legend}>
				{role === 'admin' ? (
					<span className={styles.legendItem}>
						<span className={styles.legendCount}>N</span> занятий за день у всех репетиторов
					</span>
				) : (
					<span className={styles.legendItem}>
						<span className={styles.dot} /> занятие
					</span>
				)}
				{role !== 'admin' && (
					<span className={styles.legendItem}>
						<span className={styles.free}>{role === 'tutor' ? 'окно' : 'свободно'}</span>
						{role === 'tutor' ? 'отмеченное свободное время' : 'можно записаться'}
					</span>
				)}
				<span className={styles.legendItem}>
					<span className={`${styles.legendSwatch} ${styles.legendToday}`} /> сегодня
				</span>
			</div>
		</div>
	)
}
