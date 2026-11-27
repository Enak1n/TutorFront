import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '@auth/AuthContext'
import {
	deleteMaterial,
	getAssignments,
	getHomeworkStudents,
	getHomeworkSummary,
	getMaterials,
	STATUS_LABELS,
	userName,
	type HomeworkListItem,
	type HomeworkMaterial,
	type HomeworkSummary,
	type HomeworkUser,
} from '@api/homework'
import { getApiErrorMessage } from '@api/files'
import { useAlert } from '@components/ui/alert/AlertContext'
import { ProPaywall } from '@components/pro/ProPaywall'
import { FileIcon, SearchIcon } from '@components/ui/icons'
import { AssignModal, MaterialModal, SUBJECTS } from './HomeworkModals'
import { formatDateTime, HomeworkDetailModal, statusBadgeClass } from './HomeworkDetail'
// @ts-ignore
import ui from '@components/pro/ui.module.scss'
// @ts-ignore
import styles from './HomeworkPage.module.scss'

type Tab = 'assignments' | 'library'

const STATUS_FILTERS: { value: string; label: string; tutorOnly?: boolean }[] = [
	{ value: '', label: 'Все' },
	{ value: 'submitted', label: 'На проверке' },
	{ value: 'open', label: 'Ждут решения' },
	{ value: 'reviewed', label: 'Проверено' },
]

const useDebounced = <T,>(value: T, delay = 300) => {
	const [debounced, setDebounced] = useState(value)
	useEffect(() => {
		const timer = setTimeout(() => setDebounced(value), delay)
		return () => clearTimeout(timer)
	}, [value, delay])
	return debounced
}

const HomeworkPage = () => {
	const { role } = useAuth()
	const { showAlert, showConfirm } = useAlert()
	const [searchParams, setSearchParams] = useSearchParams()
	const isTutor = role === 'tutor'

	const [tab, setTab] = useState<Tab>('assignments')
	const [summary, setSummary] = useState<HomeworkSummary | null>(null)

	// Задания
	const [assignments, setAssignments] = useState<HomeworkListItem[] | null>(null)
	const [status, setStatus] = useState(isTutor ? 'submitted' : 'open')
	const [studentId, setStudentId] = useState('')
	const [search, setSearch] = useState('')
	const debouncedSearch = useDebounced(search)
	const [students, setStudents] = useState<HomeworkUser[]>([])

	// Библиотека
	const [materials, setMaterials] = useState<HomeworkMaterial[] | null>(null)
	const [materialSearch, setMaterialSearch] = useState('')
	const [materialSubject, setMaterialSubject] = useState('')
	const debouncedMaterialSearch = useDebounced(materialSearch)

	// Модальные окна
	const [assignFrom, setAssignFrom] = useState<{ material: HomeworkMaterial | null } | null>(null)
	const [editingMaterial, setEditingMaterial] = useState<HomeworkMaterial | null | undefined>(undefined)
	const openedId = searchParams.get('assignment')

	const isPro = summary?.isPro ?? false

	const loadSummary = useCallback(() => {
		getHomeworkSummary()
			.then(setSummary)
			.catch(() => undefined)
	}, [])

	const loadAssignments = useCallback(async () => {
		try {
			setAssignments(await getAssignments({ status, studentId, search: debouncedSearch }))
		} catch (err) {
			showAlert(getApiErrorMessage(err, 'Не удалось загрузить задания'), 'error')
			setAssignments([])
		}
	}, [status, studentId, debouncedSearch, showAlert])

	const loadMaterials = useCallback(async () => {
		try {
			setMaterials(await getMaterials(debouncedMaterialSearch, materialSubject))
		} catch (err) {
			showAlert(getApiErrorMessage(err, 'Не удалось загрузить библиотеку'), 'error')
			setMaterials([])
		}
	}, [debouncedMaterialSearch, materialSubject, showAlert])

	useEffect(() => {
		loadSummary()
		if (isTutor) getHomeworkStudents().then(setStudents).catch(() => undefined)
	}, [loadSummary, isTutor])

	useEffect(() => {
		loadAssignments()
	}, [loadAssignments])

	useEffect(() => {
		if (isTutor && tab === 'library') loadMaterials()
	}, [isTutor, tab, loadMaterials])

	// Новые решения/проверки приходят уведомлением — обновим список «тихо».
	useEffect(() => {
		const refresh = () => {
			loadSummary()
			loadAssignments()
		}
		window.addEventListener('app:notification', refresh)
		return () => window.removeEventListener('app:notification', refresh)
	}, [loadSummary, loadAssignments])

	const refreshAll = useCallback(() => {
		loadSummary()
		loadAssignments()
	}, [loadSummary, loadAssignments])

	const openAssignment = (id: string) => setSearchParams({ assignment: id })
	const closeAssignment = () => setSearchParams({})

	const statusFilters = useMemo(
		() => (isTutor ? STATUS_FILTERS : STATUS_FILTERS.filter(f => f.value !== 'submitted').concat({ value: 'submitted', label: 'Отправлено' })),
		[isTutor],
	)

	const removeMaterial = (material: HomeworkMaterial) =>
		showConfirm(`Удалить «${material.title}» из библиотеки? Уже выданные задания останутся.`, async () => {
			try {
				await deleteMaterial(material.id)
				setMaterials(prev => prev?.filter(m => m.id !== material.id) ?? null)
				loadSummary()
			} catch (err) {
				showAlert(getApiErrorMessage(err, 'Не удалось удалить'), 'error')
			}
		})

	const renderAssignments = () => {
		if (assignments === null) {
			return Array.from({ length: 4 }).map((_, i) => <div key={i} className={ui.skeleton} />)
		}

		if (assignments.length === 0) {
			return (
				<div className={`${ui.card} ${ui.empty}`}>
					<h3>{status || studentId || search ? 'Ничего не нашли' : 'Заданий пока нет'}</h3>
					<p>
						{isTutor
							? isPro
								? 'Выдайте первое задание — ученик получит уведомление и сможет прислать решение здесь же.'
								: 'Оформите подписку Pro, чтобы выдавать задания ученикам.'
							: 'Когда репетитор выдаст задание, оно появится здесь.'}
					</p>
				</div>
			)
		}

		return (
			<ul className={styles.list}>
				{assignments.map(item => (
					<li key={item.id}>
						<button type='button' className={styles.item} onClick={() => openAssignment(item.id)}>
							<div className={styles.itemMain}>
								<div className={styles.itemTitle}>
									<strong>{item.title}</strong>
									{item.subject && <span className={ui.badge}>{item.subject}</span>}
								</div>
								<div className={ui.muted}>
									{isTutor ? userName(item.student) : userName(item.tutor)}
									{item.deadline && ` · до ${formatDateTime(item.deadline)}`}
									{item.filesCount > 0 && (
										<span className={styles.itemFiles}>
											<FileIcon size={14} /> {item.filesCount}
										</span>
									)}
								</div>
							</div>
							<div className={styles.itemSide}>
								<span className={statusBadgeClass(item.status, item.isOverdue)}>
									{item.isOverdue ? 'Просрочено' : STATUS_LABELS[item.status]}
								</span>
								{item.grade && <span className={ui.badgeSuccess}>{item.grade}</span>}
							</div>
						</button>
					</li>
				))}
			</ul>
		)
	}

	const renderLibrary = () => (
		<>
			<div className={styles.filters}>
				<label className={styles.search}>
					<SearchIcon size={18} />
					<input
						type='search'
						value={materialSearch}
						onChange={e => setMaterialSearch(e.target.value)}
						placeholder='Поиск по названию, теме, тексту'
					/>
				</label>
				<select className={`${ui.select} ${styles.filterSelect}`} value={materialSubject} onChange={e => setMaterialSubject(e.target.value)}>
					<option value=''>Все предметы</option>
					{SUBJECTS.map(s => (
						<option key={s} value={s}>
							{s}
						</option>
					))}
				</select>
			</div>

			{materials === null ? (
				<div className={styles.grid}>
					{Array.from({ length: 3 }).map((_, i) => (
						<div key={i} className={ui.skeleton} style={{ height: 160 }} />
					))}
				</div>
			) : materials.length === 0 ? (
				<div className={`${ui.card} ${ui.empty}`}>
					<h3>{materialSearch || materialSubject ? 'Ничего не нашли' : 'Библиотека пуста'}</h3>
					<p>Собирайте сюда свои задания, варианты и файлы — потом их можно выдавать ученикам в пару кликов.</p>
					{isPro && !materialSearch && !materialSubject && (
						<button type='button' className={ui.btnPrimary} onClick={() => setEditingMaterial(null)} style={{ marginTop: 16 }}>
							Добавить материал
						</button>
					)}
				</div>
			) : (
				<div className={styles.grid}>
					{materials.map(material => (
						<article key={material.id} className={styles.material}>
							<div className={styles.materialTags}>
								{material.subject && <span className={ui.badgeAccent}>{material.subject}</span>}
								{material.topic && <span className={ui.badge}>{material.topic}</span>}
							</div>
							<h3>{material.title}</h3>
							{material.description && <p className={styles.materialText}>{material.description}</p>}
							<div className={ui.muted}>
								{material.files.length > 0 && `Файлов: ${material.files.length} · `}
								{material.usageCount > 0 ? `выдано ${material.usageCount} раз` : 'ещё не выдавали'}
							</div>
							<div className={styles.materialActions}>
								<button
									type='button'
									className={`${ui.btnPrimary} ${ui.btnSmall}`}
									disabled={!isPro}
									onClick={() => setAssignFrom({ material })}
								>
									Выдать
								</button>
								<button
									type='button'
									className={`${ui.btn} ${ui.btnSmall}`}
									disabled={!isPro}
									onClick={() => setEditingMaterial(material)}
								>
									Изменить
								</button>
								<button type='button' className={`${ui.btnGhost} ${ui.btnSmall}`} onClick={() => removeMaterial(material)}>
									Удалить
								</button>
							</div>
						</article>
					))}
				</div>
			)}
		</>
	)

	return (
		<div className={ui.page}>
			<div className={ui.pageHeader}>
				<div>
					<h1 className={ui.pageTitle}>Домашние задания</h1>
					<p className={ui.pageSubtitle}>
						{isTutor
							? 'Выдавайте задания, принимайте решения и храните готовые материалы в одном месте.'
							: 'Задания от репетиторов: смотрите условия, отправляйте решения и получайте оценки.'}
					</p>
				</div>
				{isTutor && isPro && (
					<div className={ui.row}>
						{tab === 'library' && (
							<button type='button' className={ui.btn} onClick={() => setEditingMaterial(null)}>
								Добавить материал
							</button>
						)}
						<button type='button' className={ui.btnPrimary} onClick={() => setAssignFrom({ material: null })}>
							Выдать задание
						</button>
					</div>
				)}
			</div>

			{isTutor && summary && !isPro && (
				<ProPaywall text='Раздел «Домашние задания» и библиотека материалов входят в подписку Pro. Уже выданные задания остаются доступны: их можно смотреть и проверять.' />
			)}

			{summary && (
				<div className={styles.summary}>
					{isTutor ? (
						<>
							<button type='button' className={styles.summaryItem} onClick={() => { setTab('assignments'); setStatus('submitted') }}>
								<strong>{summary.toReview}</strong>
								<span>ждут проверки</span>
							</button>
							<button type='button' className={styles.summaryItem} onClick={() => { setTab('assignments'); setStatus('open') }}>
								<strong>{summary.active}</strong>
								<span>ждут решения</span>
							</button>
							<div className={styles.summaryItem}>
								<strong className={summary.overdue > 0 ? styles.danger : ''}>{summary.overdue}</strong>
								<span>просрочено</span>
							</div>
							<button type='button' className={styles.summaryItem} onClick={() => setTab('library')}>
								<strong>{summary.materials}</strong>
								<span>в библиотеке</span>
							</button>
						</>
					) : (
						<>
							<div className={styles.summaryItem}>
								<strong>{summary.active}</strong>
								<span>нужно сделать</span>
							</div>
							<div className={styles.summaryItem}>
								<strong className={summary.overdue > 0 ? styles.danger : ''}>{summary.overdue}</strong>
								<span>просрочено</span>
							</div>
						</>
					)}
				</div>
			)}

			{isTutor && (
				<div className={styles.tabs} role='tablist'>
					<button
						type='button'
						role='tab'
						aria-selected={tab === 'assignments'}
						className={tab === 'assignments' ? styles.tabActive : styles.tab}
						onClick={() => setTab('assignments')}
					>
						Задания
					</button>
					<button
						type='button'
						role='tab'
						aria-selected={tab === 'library'}
						className={tab === 'library' ? styles.tabActive : styles.tab}
						onClick={() => setTab('library')}
					>
						Библиотека материалов
					</button>
				</div>
			)}

			{tab === 'assignments' ? (
				<>
					<div className={styles.filters}>
						<div className={styles.statusChips}>
							{statusFilters.map(filter => (
								<button
									key={filter.value}
									type='button'
									className={status === filter.value ? ui.chipActive : ui.chip}
									onClick={() => setStatus(filter.value)}
								>
									{filter.label}
								</button>
							))}
						</div>
						{isTutor && students.length > 0 && (
							<select className={`${ui.select} ${styles.filterSelect}`} value={studentId} onChange={e => setStudentId(e.target.value)}>
								<option value=''>Все ученики</option>
								{students.map(s => (
									<option key={s.id} value={s.id}>
										{userName(s)}
									</option>
								))}
							</select>
						)}
						<label className={styles.search}>
							<SearchIcon size={18} />
							<input type='search' value={search} onChange={e => setSearch(e.target.value)} placeholder='Поиск' />
						</label>
					</div>
					{renderAssignments()}
				</>
			) : (
				renderLibrary()
			)}

			{openedId && <HomeworkDetailModal assignmentId={openedId} onClose={closeAssignment} onChanged={refreshAll} />}

			{assignFrom && (
				<AssignModal
					initialMaterial={assignFrom.material}
					onClose={() => setAssignFrom(null)}
					onCreated={count => {
						setAssignFrom(null)
						showAlert(count > 1 ? `Задание выдано ${count} ученикам` : 'Задание выдано', 'success')
						setTab('assignments')
						setStatus('')
						refreshAll()
						if (isTutor) loadMaterials()
					}}
				/>
			)}

			{editingMaterial !== undefined && (
				<MaterialModal
					material={editingMaterial}
					onClose={() => setEditingMaterial(undefined)}
					onSaved={() => {
						setEditingMaterial(undefined)
						loadMaterials()
						loadSummary()
					}}
				/>
			)}
		</div>
	)
}

export default HomeworkPage
