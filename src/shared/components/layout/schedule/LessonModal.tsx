import React, { useState, useEffect, useMemo } from 'react'
import {
	Student,
	CreateLessonDto,
	createLesson,
	getTutorStudents,
	Lesson,
	deleteLesson,
	updateLesson,
} from '@api/schedule'
import Select, { ActionMeta, SingleValue } from 'react-select'
import { useAlert } from '@components/ui/alert/AlertContext'
import makeAnimated from 'react-select/animated'
// @ts-ignore
import styles from './LessonModal.module.scss'
import {
	LessonType,
	LessonCategory,
	LESSON_CONFIG_MAP,
	LESSON_TYPE_OPTIONS,
	LESSON_CATEGORY_LABELS,
	LESSON_TYPE_LABELS,
} from '@appTypes/LessonConfig'

interface LessonModalProps {
	isOpen: boolean
	onClose: () => void
	isReadOnly?: boolean
	initialDate: Date | null
	lesson?: Lesson | null
	onCreateSuccess: (lesson: any) => void
	onUpdateSuccess?: (lesson: Lesson) => void
	onDeleteSuccess?: (lessonId: string) => void
	fromMonthlyCalendar?: boolean
}

interface OptionType {
	value: string
	label: string
}

const animatedComponents = makeAnimated()

const generateTimeOptions = (
	startHour: number,
	endHour: number,
	stepMinutes: number,
): OptionType[] => {
	const options: string[] = []
	for (let h = startHour; h <= endHour; h++) {
		for (let m = 0; m < 60; m += stepMinutes) {
			if (h === endHour && m > 0) break
			const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
			options.push(time)
		}
	}
	const uniqueOptions = Array.from(new Set(options))
	if (!uniqueOptions.includes('22:00')) {
		uniqueOptions.push('22:00')
	}

	return uniqueOptions
		.filter(time => {
			const [h, m] = time.split(':').map(Number)
			return h >= 8 && (h < 22 || (h === 22 && m === 0))
		})
		.sort()
		.map(time => ({ value: time, label: time }))
}

const TIME_OPTIONS = generateTimeOptions(8, 22, 5)
const DURATION_OPTIONS: OptionType[] = [
	{ value: '60', label: '60 мин' },
	{ value: '90', label: '90 мин' },
	{ value: '120', label: '120 мин' },
]

const timeToMinutes = (time: string): number => {
	const [h, m] = time.split(':').map(Number)
	return h * 60 + m
}

const addMinutesToTime = (time: string, minutes: number): string => {
	const totalMinutes = timeToMinutes(time) + minutes
	// Ограничиваем часы в пределах 0-23
	const h = Math.floor(totalMinutes / 60) % 24
	const m = totalMinutes % 60
	return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export const LessonModal: React.FC<LessonModalProps> = ({
	isOpen,
	onClose,
	isReadOnly = false,
	initialDate,
	onCreateSuccess,
	lesson,
	onDeleteSuccess,
	onUpdateSuccess,
	fromMonthlyCalendar,
}) => {
	const { showAlert, showConfirm } = useAlert()
	const isEditMode = !!lesson
	const isCreateMode = !isEditMode
	const canPerformActions = !isReadOnly

	const modalTitle = isCreateMode
		? 'Создание нового занятия'
		: isReadOnly
			? 'Просмотр занятия'
			: 'Просмотр и редактирование занятия'

	const getInitialTime = (
		lesson: Lesson | null | undefined,
		_initialDate: Date | null,
		timeOptions: OptionType[],
	): string => {
		if (lesson && lesson.startLessonDate) {
			const localStart = new Date(lesson.startLessonDate)
			return `${String(localStart.getHours()).padStart(2, '0')}:${String(localStart.getMinutes()).padStart(2, '0')}`
		}
		return timeOptions[0]?.value || ''
	}

	const findKeyByValue = (
		map: Record<string, string>,
		value: string | undefined,
	): string | undefined => {
		if (!value) return undefined
		return Object.keys(map).find(key => map[key] === value)
	}

	const initialLessonType =
		LESSON_TYPE_OPTIONS[0]?.value || LessonType.Mathematics
	const initialLessonCategory =
		LESSON_CONFIG_MAP[initialLessonType]?.[0] || LessonCategory.School

	const [selectedStudentId, setSelectedStudentId] = useState<string>('')
	const [lessonType, setLessonType] = useState<LessonType>(initialLessonType)
	const [lessonCategory, setLessonCategory] = useState<LessonCategory>(
		initialLessonCategory,
	)
	const [note, setNote] = useState<string>('')
	const [duration, setDuration] = useState<number>(
		Number(DURATION_OPTIONS[0]?.value) || 60,
	)
	const [isRepeated, setIsRepeated] = useState<boolean>(false)

	const [localStudents, setLocalStudents] = useState<Student[] | null>(null)
	const [isStudentsLoading, setIsStudentsLoading] = useState(false)

	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const studentOptions: OptionType[] = useMemo(
		() =>
			(localStudents || []).map(s => ({
				value: s.id,
				label: `${(s as any).name || s.firstName || ''} ${s.lastName || ''}`,
			})),
		[localStudents],
	)

	const initialStartTime = useMemo(
		() => getInitialTime(lesson, initialDate, TIME_OPTIONS),
		[lesson, initialDate],
	)
	const [startTime, setStartTime] = useState<string>(initialStartTime)

	const availableTimeOptions = useMemo(() => {
		if (fromMonthlyCalendar && isCreateMode) {
			return TIME_OPTIONS
		}
		let lessonLimitHour = -1
		let isTodayCutoff = false
		let nextValidTimeInMinutes = -1
		let initialHour = -1

		if (isEditMode && lesson) {
			initialHour = new Date(lesson.startLessonDate).getHours()
			lessonLimitHour = initialHour
		} else if (initialDate) {
			initialHour = initialDate.getHours()
			lessonLimitHour = initialHour

			const now = new Date()
			isTodayCutoff = now.toDateString() === initialDate.toDateString()

			if (isTodayCutoff) {
				const currentMinute = now.getMinutes()
				const currentHour = now.getHours()
				const nextValidMinute = Math.ceil(currentMinute / 5) * 5
				let nextValidHour = currentHour

				if (nextValidMinute >= 60) {
					nextValidHour += Math.floor(nextValidMinute / 60)
					const minute = nextValidMinute % 60
					nextValidTimeInMinutes = timeToMinutes(
						`${String(nextValidHour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
					)
				} else {
					nextValidTimeInMinutes = timeToMinutes(
						`${String(nextValidHour).padStart(2, '0')}:${String(nextValidMinute).padStart(2, '0')}`,
					)
				}
			}
		} else {
			return TIME_OPTIONS
		}

		if (lessonLimitHour === -1) return TIME_OPTIONS

		const filteredOptions = TIME_OPTIONS.filter(option => {
			const timeString = option.value
			const timeInMinutes = timeToMinutes(timeString)
			const currentOptionHour = Math.floor(timeInMinutes / 60)

			if (currentOptionHour !== lessonLimitHour) {
				return false
			}

			const currentMinute = timeInMinutes % 60
			if (currentMinute > 55) {
				return false
			}

			if (isTodayCutoff && timeInMinutes < nextValidTimeInMinutes) {
				return timeInMinutes >= nextValidTimeInMinutes
			}

			return true
		})

		if (isEditMode && lesson) {
			const currentLessonStartTime = getInitialTime(lesson, null, TIME_OPTIONS)
			if (!filteredOptions.find(opt => opt.value === currentLessonStartTime)) {
				filteredOptions.push({
					value: currentLessonStartTime,
					label: currentLessonStartTime,
				})
				filteredOptions.sort(
					(a, b) => timeToMinutes(a.value) - timeToMinutes(b.value),
				)
			}
		}

		return filteredOptions
	}, [
		isEditMode,
		lesson,
		initialDate,
		fromMonthlyCalendar,
		TIME_OPTIONS,
		getInitialTime,
	])

	const fetchStudents = async (): Promise<Student[]> => {
		if (localStudents !== null) return localStudents

		setIsStudentsLoading(true)
		try {
			const response = await getTutorStudents()

			const studentData = response.availableStudents || []

			setLocalStudents(studentData)
			return studentData
		} catch (err) {
			const serverMessage = (err as any).response?.data?.errorMessage
			const errorMessage =
				serverMessage ||
				'Не удалось загрузить список студентов. Попробуйте обновить страницу.'
			setError(errorMessage)
			setLocalStudents([])
			return []
		} finally {
			setIsStudentsLoading(false)
		}
	}

	// Сброс состояния при открытии/изменении начальной даты
	useEffect(() => {
		if (isOpen) {
			const loadAndSetStudent = async () => {
				const students = await fetchStudents()

				if (isCreateMode && !lesson) {
					setSelectedStudentId(students[0]?.id || '')
				}
			}

			loadAndSetStudent()

			if (lesson) {
				const localStart = new Date(lesson.startLessonDate)
				const localEnd = new Date(lesson.endLessonDate)

				setSelectedStudentId(lesson.user?.id || '')

				const initialTypeKey =
					(findKeyByValue(
						LESSON_TYPE_LABELS,
						lesson.lessonType,
					) as LessonType) || (initialLessonType as LessonType)
				const initialCategoryKey =
					(findKeyByValue(
						LESSON_CATEGORY_LABELS,
						lesson.lessonCategory,
					) as LessonCategory) || (initialLessonCategory as LessonCategory)

				setLessonType(initialTypeKey)
				setLessonCategory(initialCategoryKey)

				setNote(lesson.note || '')
				setIsRepeated(lesson.isRepeated || false)
				setError(null)

				const lessonDuration =
					(localEnd.getTime() - localStart.getTime()) / (1000 * 60)
				setDuration(lessonDuration)
				setStartTime(getInitialTime(lesson, null, TIME_OPTIONS))
			} else if (initialDate) {
				const initialHour = initialDate.getHours()
				const defaultStartTime = `${String(initialHour).padStart(2, '0')}:00`
				setStartTime(defaultStartTime)

				setDuration(Number(DURATION_OPTIONS[0]?.value) || 60)
				setNote('')
				setIsRepeated(false)
				setError(null)
				setLessonType(initialLessonType as LessonType)
				setLessonCategory(initialLessonCategory as LessonCategory)
			}
		}
		return () => {}
	}, [isOpen, lesson, initialDate, isCreateMode])

	const endTime = useMemo(() => {
		return addMinutesToTime(startTime, duration)
	}, [startTime, duration])

	const availableCategoryOptions = useMemo(() => {
		const availableKeys = LESSON_CONFIG_MAP[lessonType] || []
		return availableKeys.map(key => ({
			value: key,
			label: LESSON_CATEGORY_LABELS[key],
		}))
	}, [lessonType])

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		if (isReadOnly) return

		if (!selectedStudentId) {
			setError('Пожалуйста, выберите студента.')
			return
		}

		if (isCreateMode && !initialDate) {
			setError('Дата занятия не определена.')
			return
		}

		setIsLoading(true)
		setError(null)

		const baseDate =
			isCreateMode && initialDate
				? initialDate
				: new Date(lesson!.startLessonDate)

		const startDate = new Date(baseDate)
		const [startHour, startMinute] = startTime.split(':').map(Number)
		startDate.setHours(startHour, startMinute, 0, 0)

		const endDate = new Date(startDate)
		endDate.setTime(endDate.getTime() + duration * 60 * 1000)

		const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone

		const payload: CreateLessonDto = {
			startLessonDate: startDate.toISOString(),
			endLessonDate: endDate.toISOString(),
			studentId: selectedStudentId,
			lessonType: LESSON_TYPE_LABELS[lessonType],
			lessonCategory: LESSON_CATEGORY_LABELS[lessonCategory],
			note: note || undefined,
			isAccepted: false,
			isRepeated: isRepeated,

			timeZone: userTimeZone,
		}

		try {
			let resultLesson: Lesson

			if (isCreateMode) {
				resultLesson = await createLesson(payload)
				onCreateSuccess(resultLesson)
			} else {
				if (!lesson?.id || !onUpdateSuccess)
					throw new Error('ID занятия для обновления не найден.')
				resultLesson = await updateLesson(lesson.id, payload)
				onUpdateSuccess(resultLesson)
			}

			onClose()
		} catch (err) {
			const serverMessage = (err as any).response?.data?.errorMessage

			const message =
				serverMessage ||
				`Не удалось ${isCreateMode ? 'создать' : 'обновить'} занятие. Проверьте данные.`
			setError(message)
		} finally {
			setIsLoading(false)
		}
	}

	const dateToDisplay =
		isCreateMode && initialDate
			? initialDate
			: lesson
				? new Date(lesson.startLessonDate)
				: null

	const displayDate = dateToDisplay?.toLocaleDateString('ru-RU', {
		weekday: 'long',
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	})

	if (!isOpen) return null

	type SingleSelectChange = (
		newValue: SingleValue<OptionType>,
		actionMeta: ActionMeta<OptionType>,
	) => void

	const handleSelectChange = (
		newValue: SingleValue<OptionType>,
		_actionMeta: ActionMeta<OptionType>,
		setter: (value: any) => void,
		isNumber: boolean = false,
	) => {
		if (newValue) {
			setter(isNumber ? Number(newValue.value) : newValue.value)
		} else {
			setter(isNumber ? 0 : '')
		}
	}

	const handleDelete = async () => {
		if (isReadOnly || !lesson?.id || !onDeleteSuccess) {
			return
		}
		showConfirm(
			'Вы уверены, что хотите отменить (удалить) это занятие? Это действие необратимо.',
			async () => {
				const lessonIdToDelete = lesson.id
				setIsLoading(true)
				setError(null)

				try {
					await deleteLesson(lessonIdToDelete)
					onDeleteSuccess(lessonIdToDelete)
					onClose()
					showAlert('Занятие успешно удалено!', 'success')
				} catch (err) {
					const message =
						(err as any).response?.data?.message ||
						'Не удалось удалить занятие.'
					setError(message)
					showAlert(message, 'error')
				} finally {
					setIsLoading(false)
				}
			},
			'warning',
		)
	}

	const handleStudentChange: SingleSelectChange = (newValue, _actionMeta) =>
		handleSelectChange(newValue, _actionMeta, setSelectedStudentId)

	const handleStartTimeChange: SingleSelectChange = (newValue, _actionMeta) =>
		handleSelectChange(newValue, _actionMeta, setStartTime)

	const handleDurationChange: SingleSelectChange = (newValue, _actionMeta) =>
		handleSelectChange(newValue, _actionMeta, setDuration, true)

	const handleLessonTypeChange: SingleSelectChange = (newValue, _actionMeta) =>
		handleSelectChange(newValue, _actionMeta, setLessonType)

	const handleLessonCategoryChange: SingleSelectChange = (
		newValue,
		_actionMeta,
	) => handleSelectChange(newValue, _actionMeta, setLessonCategory)

	const selectedStudentOption =
		studentOptions.find(o => o.value === selectedStudentId) || null
	const selectedStartTimeOption =
		availableTimeOptions.find(o => o.value === startTime) || null
	const selectedDurationOption =
		DURATION_OPTIONS.find(o => Number(o.value) === duration) || null
	const selectedLessonTypeOption =
		LESSON_TYPE_OPTIONS.find((o: OptionType) => o.value === lessonType) || null
	const selectedLessonCategoryOption =
		availableCategoryOptions.find(o => o.value === lessonCategory) || null

	const selectCustomStyles = {
		menuPortal: (base: any) => ({
			...base,
			zIndex: 2000,
		}),
		menu: (provided: any) => ({
			...provided,
			position: 'absolute',
		}),
		control: (provided: any, state: any) => ({
			...provided,
			minHeight: '40px',
			borderRadius: '8px',
			border: `1px solid ${state.isFocused ? '#0066ff' : '#ccc'}`,
			boxShadow: state.isFocused ? '0 0 0 1px #0066ff' : 'none',
			'&:hover': {
				borderColor: '#0066ff',
			},
		}),
		option: (provided: any, state: any) => ({
			...provided,
			backgroundColor: state.isFocused ? 'rgba(0, 102, 255, 0.1)' : 'white',
			color: '#1a1a1a',
			cursor: 'pointer',
			padding: '12px 20px',
			transition: 'background-color 0.2s',
		}),
		indicatorSeparator: (provided: any) => ({
			...provided,
			backgroundColor: '#ddd',
		}),
	}

	return (
		<div className={styles.modalOverlay} onClick={onClose}>
			<div className={styles.modalContent} onClick={e => e.stopPropagation()}>
				<button
					className={styles.closeButton}
					onClick={onClose}
					aria-label='Закрыть модальное окно'
				>
					&times;
				</button>

				<h2 className={styles.modalTitle}>{modalTitle}</h2>

				{error && <p className={styles.errorText}>{error}</p>}

				{availableTimeOptions.length === 0 && (
					<p className={styles.errorText}>
						В выбранном часовом интервале нет доступного времени для начала
						занятия.
					</p>
				)}

				<form
					onSubmit={canPerformActions ? handleSubmit : e => e.preventDefault()}
				>
					<div className={styles.formSection}>
						<label>Дата занятия:</label>
						<input
							type='text'
							value={displayDate || ''}
							readOnly
							className={styles.readOnlyInput}
						/>
					</div>

					<div className={styles.timeGroup}>
						<div className={styles.formGroup}>
							<label htmlFor='startTime'>
								Начало:
								<span className={styles.requiredAsterisk}>*</span>
							</label>
							<Select
								id='startTime'
								value={selectedStartTimeOption}
								onChange={handleStartTimeChange as any}
								options={availableTimeOptions}
								components={animatedComponents}
								styles={selectCustomStyles}
								isDisabled={
									isLoading || availableTimeOptions.length === 0 || isReadOnly
								}
								placeholder='--:--'
								menuPortalTarget={document.body}
								menuPosition='fixed'
							/>
						</div>

						<div className={styles.formGroup}>
							<label htmlFor='duration'>
								Длительность:
								<span className={styles.requiredAsterisk}>*</span>
							</label>
							<Select
								id='duration'
								value={selectedDurationOption}
								onChange={handleDurationChange as any}
								options={DURATION_OPTIONS}
								components={animatedComponents}
								styles={selectCustomStyles}
								isDisabled={isLoading || isReadOnly}
								menuPortalTarget={document.body}
								menuPosition='fixed'
							/>
						</div>

						<div className={styles.timeDisplay}>
							<label>Конец:</label>
							<p className={styles.timeValue}>{endTime}</p>
						</div>
					</div>

					<div className={styles.formGroup}>
						<label htmlFor='studentId'>
							Студент:
							<span className={styles.requiredAsterisk}>*</span>
						</label>
						<Select
							id='studentId'
							value={selectedStudentOption}
							onChange={handleStudentChange as any}
							options={studentOptions}
							components={animatedComponents}
							styles={selectCustomStyles}
							placeholder='Выберите студента'
							isDisabled={
								isLoading ||
								isStudentsLoading ||
								(localStudents?.length || 0) === 0 ||
								isReadOnly
							}
							required
							menuPortalTarget={document.body}
							menuPosition='fixed'
						/>
						{(localStudents?.length || 0) === 0 &&
							!isStudentsLoading &&
							localStudents !== null &&
							canPerformActions && (
								<p className={styles.warningText}>Нет доступных студентов.</p>
							)}
						{isStudentsLoading && (
							<p className={styles.warningText}>Загрузка студентов...</p>
						)}
					</div>

					<div className={styles.categoryGroup}>
						<div className={styles.formGroup}>
							<label htmlFor='lessonType'>
								Предмет (Тип занятия):
								<span className={styles.requiredAsterisk}>*</span>
							</label>
							<Select
								id='lessonType'
								value={selectedLessonTypeOption}
								onChange={handleLessonTypeChange as any}
								options={LESSON_TYPE_OPTIONS}
								components={animatedComponents}
								styles={selectCustomStyles}
								isDisabled={isLoading || isReadOnly}
								menuPortalTarget={document.body}
								menuPosition='fixed'
							/>
						</div>
						<div className={styles.formGroup}>
							<label htmlFor='lessonCategory'>
								Категория:
								<span className={styles.requiredAsterisk}>*</span>
							</label>
							<Select
								id='lessonCategory'
								value={selectedLessonCategoryOption}
								onChange={handleLessonCategoryChange as any}
								options={availableCategoryOptions}
								components={animatedComponents}
								styles={selectCustomStyles}
								isDisabled={isLoading || isReadOnly}
								menuPortalTarget={document.body}
								menuPosition='fixed'
							/>
						</div>
					</div>

					<div className={styles.formGroup}>
						<label htmlFor='note'>Примечание:</label>
						<textarea
							id='note'
							value={note}
							onChange={e => setNote(e.target.value)}
							className={styles.textareaInput}
							rows={3}
							readOnly={isReadOnly}
						/>
					</div>

					<div className={styles.checkboxGroup}>
						<input
							type='checkbox'
							id='isRepeated'
							checked={isRepeated}
							onChange={e => setIsRepeated(e.target.checked)}
							disabled={isReadOnly}
						/>
						<label htmlFor='isRepeated'>Повторяющееся занятие</label>
					</div>

					{canPerformActions && (
						<div className={styles.buttonGroup}>
							{isEditMode && (
								<button
									type='button'
									onClick={handleDelete}
									disabled={isLoading}
									className={styles.deleteButton}
								>
									{isLoading ? 'Удаление...' : 'Удалить'}
								</button>
							)}

							<button
								type='submit'
								disabled={
									isLoading ||
									!selectedStudentId ||
									availableTimeOptions.length === 0
								}
								className={styles.primaryButton}
							>
								{isLoading
									? 'Сохранение...'
									: isEditMode
										? 'Сохранить изменения'
										: 'Создать занятие'}
							</button>
						</div>
					)}
				</form>
			</div>
		</div>
	)
}
