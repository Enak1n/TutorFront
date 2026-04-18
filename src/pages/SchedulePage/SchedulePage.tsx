'use client'

import { useState, useEffect } from 'react'
// @ts-ignore
import styles from './SchedulePage.module.scss'
import WeeklyCalendar from '@components/layout/schedule/WeeklyCalendar'
import { MonthlyCalendar } from '@components/layout/schedule/MonthlyCalendar'

interface SchedulePageProps {
	userRole?: 'tutor' | 'student_or_parent'
	userName?: string
}

type CalendarView = 'week' | 'month'

export const SchedulePage = ({ userRole, userName }: SchedulePageProps) => {
	const [currentWeekOffset, setCurrentWeekOffset] = useState(0)
	const [role, setRole] = useState<'tutor' | 'student_or_parent'>(
		userRole || 'student_or_parent',
	)
	const [view, setView] = useState<CalendarView>('month')

	useEffect(() => {
		if (!userRole) {
			const storedRole = localStorage.getItem('role') as
				| 'tutor'
				| 'student_or_parent'
			if (storedRole) {
				setRole(storedRole)
			}
		}
	}, [userRole])

	const handlePreviousWeek = () => {
		setCurrentWeekOffset(prev => prev - 1)
	}

	const handleNextWeek = () => {
		setCurrentWeekOffset(prev => prev + 1)
	}

	const handleToday = () => {
		setCurrentWeekOffset(0)
	}

	const handleDayClick = (date: Date) => {
		console.log('Clicked on day:', date)
	}

	return (
		<div className={styles.schedulePage}>
			{/* Заголовок по центру */}
			<div className={styles.pageHeader}>
				<h1 className={styles.title}>Расписание</h1>
			</div>

			{/* Панель управления с переключателями */}
			<div className={styles.controlsBar}>
				<div className={styles.viewToggle}>
					<button
						className={`${styles.viewBtn} ${view === 'month' ? styles.active : ''}`}
						onClick={() => setView('month')}
					>
						📅 Месяц
					</button>
					<button
						className={`${styles.viewBtn} ${view === 'week' ? styles.active : ''}`}
						onClick={() => setView('week')}
					>
						📆 Неделя
					</button>
				</div>
			</div>

			{/* Календарь в красивой рамке */}
			<div className={styles.calendarWrapper}>
				{view === 'month' ? (
					<MonthlyCalendar userRole={role} onDayClick={handleDayClick} />
				) : (
					<div className={styles.weeklyView}>
						<div className={styles.weekControls}>
							<button onClick={handleToday} className={styles.todayBtn}>
								📍 Сегодня
							</button>
							<button
								onClick={handlePreviousWeek}
								className={styles.navWeekBtn}
							>
								← Предыдущая
							</button>
							<button onClick={handleNextWeek} className={styles.navWeekBtn}>
								Следующая →
							</button>
						</div>
						<WeeklyCalendar weekOffset={currentWeekOffset} userRole={role} />
					</div>
				)}
			</div>
		</div>
	)
}
