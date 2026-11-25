import { useCallback, useEffect, useMemo, useState } from 'react'
import {
	createAvailability,
	deleteAvailability,
	getApiErrorMessage,
	getAvailability,
	type AvailabilitySlot,
} from '@api/availability'
import { useAlert } from '@components/ui/alert/AlertContext'
import { minutesToTime, shortTime, startOfDay, timeToMinutes, toDateKey, toMonthKey } from '../../../utils/date'
import { BookingModal } from './BookingModal'
import styles from './AvailabilityPanel.module.scss'

interface AvailabilityPanelProps {
	role: 'tutor' | 'student_or_parent'
	date: Date
	refreshKey: number
	/** Вызывается после изменения окон или записи на занятие. */
	onChanged: () => void
}

// Рабочий день, в пределах которого отмечаются окна (МСК).
const DAY_START = 8 * 60
const DAY_END = 22 * 60
const TIME_OPTIONS = Array.from({ length: (DAY_END - DAY_START) / 30 + 1 }, (_, index) => minutesToTime(DAY_START + index * 30))

export const AvailabilityPanel = ({ role, date, refreshKey, onChanged }: AvailabilityPanelProps) => {
	const { showAlert } = useAlert()
	const [slots, setSlots] = useState<AvailabilitySlot[]>([])
	const [isLoading, setIsLoading] = useState(false)
	const [start, setStart] = useState('10:00')
	const [end, setEnd] = useState('12:00')
	const [isSaving, setIsSaving] = useState(false)
	const [slotToBook, setSlotToBook] = useState<AvailabilitySlot | null>(null)

	const dateKey = toDateKey(date)
	const monthKey = toMonthKey(date)
	const isPast = startOfDay(date) < startOfDay(new Date())

	const load = useCallback(async () => {
		setIsLoading(true)
		try {
			const items = await getAvailability(monthKey)
			setSlots(items.filter(slot => slot.date === dateKey))
		} catch {
			setSlots([])
		} finally {
			setIsLoading(false)
		}
	}, [monthKey, dateKey])

	useEffect(() => {
		load()
	}, [load, refreshKey])

	const endOptions = useMemo(
		() => TIME_OPTIONS.filter(time => timeToMinutes(time) > timeToMinutes(start)),
		[start],
	)

	useEffect(() => {
		if (timeToMinutes(end) <= timeToMinutes(start)) setEnd(endOptions[Math.min(3, endOptions.length - 1)] ?? end)
	}, [start, end, endOptions])

	const addWindow = async (from: string, to: string) => {
		setIsSaving(true)
		try {
			await createAvailability({ date: dateKey, startTime: from, endTime: to })
			showAlert(`Свободное время ${from}–${to} отмечено`, 'success')
			onChanged()
		} catch (error) {
			showAlert(getApiErrorMessage(error, 'Не удалось сохранить окно'), 'error')
		} finally {
			setIsSaving(false)
		}
	}

	const removeWindow = async (slot: AvailabilitySlot) => {
		try {
			await deleteAvailability(slot.id)
			showAlert('Окно удалено', 'success')
			onChanged()
		} catch (error) {
			showAlert(getApiErrorMessage(error, 'Не удалось удалить окно'), 'error')
		}
	}

	const isWholeDayTaken = slots.some(
		slot => timeToMinutes(shortTime(slot.startTime)) <= DAY_START && timeToMinutes(shortTime(slot.endTime)) >= DAY_END,
	)

	return (
		<section className={styles.panel} aria-label='Свободное время'>
			<header className={styles.header}>
				<h3>{role === 'tutor' ? 'Свободное время' : 'Записаться на занятие'}</h3>
				<span className={styles.timezone}>время московское</span>
			</header>

			{isLoading ? (
				<p className={styles.muted}>Загрузка…</p>
			) : slots.length === 0 ? (
				<p className={styles.muted}>
					{role === 'tutor'
						? isPast
							? 'В этот день свободное время не отмечалось.'
							: 'Отметьте окна, в которые ученики смогут записаться сами.'
						: 'В этот день у ваших репетиторов нет свободных окон.'}
				</p>
			) : (
				<ul className={styles.list}>
					{slots.map(slot => (
						<li key={`${slot.id}-${slot.startTime}`} className={styles.slot}>
							<div className={styles.slotInfo}>
								<span className={styles.slotTime}>
									{shortTime(slot.startTime)}–{shortTime(slot.endTime)}
								</span>
								{role === 'student_or_parent' && <span className={styles.slotTutor}>{slot.tutorName}</span>}
							</div>

							{role === 'tutor' ? (
								<button
									type='button'
									className={styles.removeButton}
									onClick={() => removeWindow(slot)}
									aria-label={`Удалить окно ${shortTime(slot.startTime)}–${shortTime(slot.endTime)}`}
								>
									Удалить
								</button>
							) : (
								<button type='button' className={styles.bookButton} onClick={() => setSlotToBook(slot)}>
									Записаться
								</button>
							)}
						</li>
					))}
				</ul>
			)}

			{role === 'tutor' && !isPast && (
				<div className={styles.form}>
					<div className={styles.timeRow}>
						<label>
							<span>С</span>
							<select value={start} onChange={event => setStart(event.target.value)}>
								{TIME_OPTIONS.slice(0, -1).map(time => (
									<option key={time} value={time}>
										{time}
									</option>
								))}
							</select>
						</label>
						<label>
							<span>До</span>
							<select value={end} onChange={event => setEnd(event.target.value)}>
								{endOptions.map(time => (
									<option key={time} value={time}>
										{time}
									</option>
								))}
							</select>
						</label>
					</div>

					<div className={styles.formActions}>
						<button
							type='button'
							className={styles.primaryButton}
							disabled={isSaving}
							onClick={() => addWindow(start, end)}
						>
							Добавить окно
						</button>
						<button
							type='button'
							className={styles.secondaryButton}
							disabled={isSaving || slots.length > 0 || isWholeDayTaken}
							onClick={() => addWindow(minutesToTime(DAY_START), minutesToTime(DAY_END))}
							title={slots.length > 0 ? 'Сначала удалите отмеченные окна' : 'Отметить свободным весь день (08:00–22:00)'}
						>
							Весь день свободен
						</button>
					</div>
				</div>
			)}

			{slotToBook && (
				<BookingModal
					slot={slotToBook}
					onClose={() => setSlotToBook(null)}
					onBooked={() => {
						setSlotToBook(null)
						onChanged()
					}}
				/>
			)}
		</section>
	)
}
