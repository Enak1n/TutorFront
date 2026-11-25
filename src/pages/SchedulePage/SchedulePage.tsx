import { useEffect, useState } from 'react'
// @ts-ignore
import styles from './SchedulePage.module.scss'
import WeeklyCalendar from '@components/layout/schedule/WeeklyCalendar'
import { MonthCalendar } from '@components/layout/schedule/MonthCalendar'
import { AvailabilityPanel } from '@components/layout/schedule/AvailabilityPanel'
import { CalendarToolbar, type CalendarView } from '@components/layout/schedule/CalendarToolbar'
import {
	addDays,
	addMonths,
	formatDayTitle,
	formatMonthTitle,
	formatWeekTitle,
	isSameDay,
	mondayBasedDayIndex,
	startOfDay,
	startOfWeek,
	weekOffsetFromToday,
} from '../../shared/utils/date'

interface SchedulePageProps {
	userRole?: 'tutor' | 'student_or_parent'
	userName?: string
}

const VIEW_STORAGE_KEY = 'scheduleView'
const VIEWS: CalendarView[] = ['month', 'week', 'day']

const readStoredView = (): CalendarView => {
	try {
		const stored = localStorage.getItem(VIEW_STORAGE_KEY)
		return stored === 'week' || stored === 'day' ? stored : 'month'
	} catch {
		return 'month'
	}
}

export const SchedulePage = ({ userRole }: SchedulePageProps) => {
	const [role, setRole] = useState<'tutor' | 'student_or_parent'>(userRole || 'student_or_parent')
	const [view, setView] = useState<CalendarView>(readStoredView)
	const [cursor, setCursor] = useState<Date>(() => startOfDay(new Date()))
	const [refreshKey, setRefreshKey] = useState(0)

	useEffect(() => {
		if (userRole) {
			setRole(userRole)
			return
		}
		const storedRole = localStorage.getItem('role')
		if (storedRole === 'tutor' || storedRole === 'student_or_parent') setRole(storedRole)
	}, [userRole])

	const changeView = (next: CalendarView) => {
		setView(next)
		try {
			localStorage.setItem(VIEW_STORAGE_KEY, next)
		} catch {
			// не критично
		}
	}

	const shift = (direction: 1 | -1) => {
		setCursor(current => {
			if (view === 'month') return addMonths(current, direction)
			if (view === 'week') return addDays(current, 7 * direction)
			return addDays(current, direction)
		})
	}

	const today = new Date()
	const isTodayVisible =
		view === 'month'
			? cursor.getFullYear() === today.getFullYear() && cursor.getMonth() === today.getMonth()
			: view === 'week'
				? isSameDay(startOfWeek(cursor), startOfWeek(today))
				: isSameDay(cursor, today)

	const title =
		view === 'month' ? formatMonthTitle(cursor) : view === 'week' ? formatWeekTitle(cursor) : formatDayTitle(cursor)

	const openDay = (date: Date) => {
		setCursor(startOfDay(date))
		changeView('day')
	}

	const refresh = () => setRefreshKey(key => key + 1)

	return (
		<div className={styles.schedulePage}>
			<div className={styles.pageHeader}>
				<h1 className={styles.title}>Расписание</h1>
				<p className={styles.subtitle}>
					{role === 'tutor'
						? 'Нажмите на день, чтобы посмотреть занятия и отметить свободное время'
						: 'Нажмите на день, чтобы посмотреть занятия и записаться в свободное окно'}
				</p>
			</div>

			<div className={styles.calendarWrapper}>
				<CalendarToolbar
					views={VIEWS}
					view={view}
					onViewChange={changeView}
					title={title}
					onPrev={() => shift(-1)}
					onNext={() => shift(1)}
					onToday={() => setCursor(startOfDay(new Date()))}
					isTodayVisible={isTodayVisible}
				/>

				{view === 'month' && (
					<MonthCalendar
						role={role}
						month={cursor}
						selectedDate={cursor}
						onSelectDate={openDay}
						refreshKey={refreshKey}
					/>
				)}

				{view === 'week' && (
					<WeeklyCalendar
						weekOffset={weekOffsetFromToday(cursor)}
						userRole={role}
						refreshKey={refreshKey}
						onLessonsChanged={refresh}
					/>
				)}

				{view === 'day' && (
					<div className={styles.dayLayout}>
						<div className={styles.dayGrid}>
							<WeeklyCalendar
								weekOffset={weekOffsetFromToday(cursor)}
								dayIndex={mondayBasedDayIndex(cursor)}
								userRole={role}
								refreshKey={refreshKey}
								onLessonsChanged={refresh}
							/>
						</div>
						<AvailabilityPanel role={role} date={cursor} refreshKey={refreshKey} onChanged={refresh} />
					</div>
				)}
			</div>
		</div>
	)
}
