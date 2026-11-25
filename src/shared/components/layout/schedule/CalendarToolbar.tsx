import styles from './CalendarToolbar.module.scss'

export type CalendarView = 'month' | 'week' | 'day'

const VIEW_LABELS: Record<CalendarView, string> = {
	month: 'Месяц',
	week: 'Неделя',
	day: 'День',
}

interface CalendarToolbarProps {
	views: CalendarView[]
	view: CalendarView
	onViewChange: (view: CalendarView) => void
	title: string
	onPrev: () => void
	onNext: () => void
	onToday: () => void
	isTodayVisible?: boolean
}

const TodayIcon = () => (
	<svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
		<path d='M3 12a9 9 0 1 0 3-6.7L3 8' />
		<path d='M3 3v5h5' />
		<path d='M12 7v5l3 2' />
	</svg>
)

/** Шапка календаря: вид (Месяц/Неделя/День), навигация и возврат к сегодняшнему дню. */
export const CalendarToolbar = ({
	views,
	view,
	onViewChange,
	title,
	onPrev,
	onNext,
	onToday,
	isTodayVisible = false,
}: CalendarToolbarProps) => (
	<div className={styles.toolbar}>
		{views.length > 1 && (
			<div className={styles.segmented} role='tablist' aria-label='Вид календаря'>
				{views.map(option => (
					<button
						key={option}
						type='button'
						role='tab'
						aria-selected={view === option}
						className={`${styles.segment} ${view === option ? styles.segmentActive : ''}`}
						onClick={() => onViewChange(option)}
					>
						{VIEW_LABELS[option]}
					</button>
				))}
			</div>
		)}

		<div className={styles.navigation}>
			<button type='button' className={styles.arrow} onClick={onPrev} aria-label='Назад'>
				‹
			</button>
			<span className={styles.title}>{title}</span>
			<button type='button' className={styles.arrow} onClick={onNext} aria-label='Вперёд'>
				›
			</button>
			<button
				type='button'
				className={styles.todayButton}
				onClick={onToday}
				disabled={isTodayVisible}
				title='К сегодняшнему дню'
				aria-label='К сегодняшнему дню'
			>
				<TodayIcon />
			</button>
		</div>
	</div>
)
