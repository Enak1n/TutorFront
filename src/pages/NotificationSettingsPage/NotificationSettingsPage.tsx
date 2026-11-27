import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
	getNotificationSettings,
	resetNotificationRule,
	saveNotificationRule,
	sendTestNotification,
	type NotificationChannel,
	type NotificationContactStats,
	type NotificationRule,
	type NotificationRuleDraft,
	type NotificationSettings,
	type NotificationVariable,
} from '@api/notification-settings'
import { getApiErrorMessage } from '@api/files'
import { useAlert } from '@components/ui/alert/AlertContext'
import { ProPaywall } from '@components/pro/ProPaywall'
// @ts-ignore
import ui from '@components/pro/ui.module.scss'
// @ts-ignore
import styles from './NotificationSettingsPage.module.scss'

const GROUPS: { key: string; title: string }[] = [
	{ key: 'lessons', title: 'Занятия' },
	{ key: 'payments', title: 'Оплата' },
	{ key: 'homework', title: 'Домашние задания' },
]

const CHANNELS: { key: NotificationChannel; label: string; hint: string }[] = [
	{ key: 'vk', label: 'VK', hint: 'Сообщение от бота сообщества' },
	{ key: 'email', label: 'Email', hint: 'Письмо на почту из профиля' },
	{ key: 'sms', label: 'SMS', hint: 'На номер из профиля, расходует лимит' },
]

const BEFORE_OPTIONS = [15, 30, 60, 120, 180, 360, 720, 1440, 2880, 4320, 10080]
const AFTER_OPTIONS = [0, 15, 30, 60, 180, 720, 1440]

const SAMPLE: Record<string, string> = {
	student: 'Иван Петров',
	tutor: 'Анна Сергеевна',
	subject: 'Математика',
	date: '28.11.2026',
	time: '18:00',
	end_time: '19:00',
	payment_details: 'по номеру телефона, Т-Банк',
	homework: 'Квадратные уравнения',
	deadline: '01.12.2026 20:00 (МСК)',
	grade: '5',
	comment: 'Отличная работа!',
	link: 'https://ugolok-repetitora.ru',
}

const formatOffset = (minutes: number) => {
	if (minutes === 0) return 'сразу'
	if (minutes % 1440 === 0) {
		const d = minutes / 1440
		return d === 1 ? '1 день' : d < 5 ? `${d} дня` : `${d} дней`
	}
	if (minutes % 60 === 0) {
		const h = minutes / 60
		return h === 1 ? '1 час' : h < 5 ? `${h} часа` : `${h} часов`
	}
	return `${minutes} мин`
}

const renderTemplate = (template: string) =>
	template.replace(/\{([a-z_]+)\}/g, (match, key) => SAMPLE[key] ?? match).replace(/[ \t]{2,}/g, ' ').trim()

const toDraft = (rule: NotificationRule): NotificationRuleDraft => ({
	isEnabled: rule.isEnabled,
	offsetMinutes: rule.offsetMinutes,
	channels: rule.channels,
	notifyStudent: rule.notifyStudent,
	notifyParents: rule.notifyParents,
	notifyTutor: rule.notifyTutor,
	template: rule.template,
})

const sameDraft = (a: NotificationRuleDraft, b: NotificationRuleDraft) =>
	a.isEnabled === b.isEnabled &&
	a.offsetMinutes === b.offsetMinutes &&
	a.notifyStudent === b.notifyStudent &&
	a.notifyParents === b.notifyParents &&
	a.notifyTutor === b.notifyTutor &&
	a.template === b.template &&
	[...a.channels].sort().join() === [...b.channels].sort().join()

interface RuleCardProps {
	rule: NotificationRule
	variables: NotificationVariable[]
	contacts: NotificationContactStats
	isPro: boolean
	onSaved: (rule: NotificationRule) => void
}

const RuleCard = ({ rule, variables, contacts, isPro, onSaved }: RuleCardProps) => {
	const { showAlert } = useAlert()
	const [draft, setDraft] = useState<NotificationRuleDraft>(() => toDraft(rule))
	const [isOpen, setIsOpen] = useState(false)
	const [busy, setBusy] = useState<'save' | 'test' | 'reset' | null>(null)
	const textareaRef = useRef<HTMLTextAreaElement>(null)

	useEffect(() => setDraft(toDraft(rule)), [rule])

	const isDirty = !sameDraft(draft, toDraft(rule))
	const isTimed = rule.timing !== 'Instant'
	const options = rule.timing === 'AfterLessonEnd' ? AFTER_OPTIONS : BEFORE_OPTIONS
	const offsetOptions = options.includes(draft.offsetMinutes)
		? options
		: [...options, draft.offsetMinutes].sort((a, b) => a - b)

	const allowedVariables = variables.filter(v => rule.variables.includes(v.key))
	const preview = renderTemplate(draft.template)
	const smsParts = preview.length <= 70 ? 1 : Math.ceil(preview.length / 67)

	const update = (patch: Partial<NotificationRuleDraft>) => setDraft(prev => ({ ...prev, ...patch }))

	const toggleChannel = (channel: NotificationChannel) =>
		update({
			channels: draft.channels.includes(channel)
				? draft.channels.filter(c => c !== channel)
				: [...draft.channels, channel],
		})

	const insertVariable = (key: string) => {
		const token = `{${key}}`
		const el = textareaRef.current
		if (!el) {
			update({ template: draft.template + token })
			return
		}
		const start = el.selectionStart ?? draft.template.length
		const end = el.selectionEnd ?? start
		const next = draft.template.slice(0, start) + token + draft.template.slice(end)
		update({ template: next })
		requestAnimationFrame(() => {
			el.focus()
			el.setSelectionRange(start + token.length, start + token.length)
		})
	}

	const save = async (override?: Partial<NotificationRuleDraft>) => {
		setBusy('save')
		try {
			const saved = await saveNotificationRule(rule.type, { ...draft, ...override })
			onSaved(saved)
			showAlert('Настройка сохранена', 'success')
		} catch (err) {
			showAlert(getApiErrorMessage(err, 'Не удалось сохранить'), 'error')
			if (override) setDraft(toDraft(rule))
		} finally {
			setBusy(null)
		}
	}

	const test = async () => {
		setBusy('test')
		try {
			const result = await sendTestNotification(rule.type, draft)
			if (result.errors.length === 0) showAlert('Тестовое уведомление отправлено вам', 'success')
			else showAlert(`Отправлено на сайт. Не дошло: ${result.errors.join('; ')}`, 'warning')
		} catch (err) {
			showAlert(getApiErrorMessage(err, 'Не удалось отправить тест'), 'error')
		} finally {
			setBusy(null)
		}
	}

	const reset = async () => {
		setBusy('reset')
		try {
			onSaved(await resetNotificationRule(rule.type))
			showAlert('Возвращены настройки по умолчанию', 'success')
		} catch (err) {
			showAlert(getApiErrorMessage(err, 'Не удалось сбросить'), 'error')
		} finally {
			setBusy(null)
		}
	}

	const coverage = (channel: NotificationChannel) => {
		const count = channel === 'vk' ? contacts.withVk : channel === 'email' ? contacts.withEmail : contacts.withPhone
		return `${count} из ${contacts.recipients}`
	}

	return (
		<article className={`${styles.rule} ${draft.isEnabled ? '' : styles.ruleOff}`}>
			<div className={styles.ruleHead}>
				<label className={styles.switch} title={draft.isEnabled ? 'Выключить' : 'Включить'}>
					<input
						type='checkbox'
						checked={draft.isEnabled}
						disabled={!isPro || busy !== null}
						onChange={e => {
							const isEnabled = e.target.checked
							update({ isEnabled })
							// Переключатель сохраняем сразу, если остальное не меняли.
							if (!isDirty) save({ isEnabled })
						}}
					/>
					<span />
				</label>

				<button type='button' className={styles.ruleTitle} onClick={() => setIsOpen(v => !v)} aria-expanded={isOpen}>
					<span>
						<strong>{rule.title}</strong>
						{rule.isCustomized && <span className={ui.badgeAccent}>настроено</span>}
						{isDirty && <span className={ui.badgeWarning}>не сохранено</span>}
					</span>
					<span className={ui.muted}>
						{isTimed
							? rule.timing === 'AfterLessonEnd'
								? draft.offsetMinutes === 0
									? 'Сразу после окончания занятия'
									: `Через ${formatOffset(draft.offsetMinutes)} после окончания`
								: `За ${formatOffset(draft.offsetMinutes)} до ${rule.timing === 'BeforeLessonStart' ? 'начала' : 'срока сдачи'}`
							: 'Сразу при событии'}
						{' · '}
						{['Сайт', ...draft.channels.map(c => CHANNELS.find(x => x.key === c)?.label ?? c)].join(', ')}
					</span>
				</button>

				<span className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`} aria-hidden='true' />
			</div>

			{isOpen && (
				<div className={styles.ruleBody}>
					<p className={ui.muted}>{rule.description}</p>

					<div className={styles.grid}>
						{isTimed && (
							<div className={ui.field}>
								<span className={ui.label}>
									{rule.timing === 'AfterLessonEnd' ? 'Когда отправить' : 'За сколько до события'}
								</span>
								<select
									className={ui.select}
									value={draft.offsetMinutes}
									disabled={!isPro}
									onChange={e => update({ offsetMinutes: Number(e.target.value) })}
								>
									{offsetOptions.map(m => (
										<option key={m} value={m}>
											{rule.timing === 'AfterLessonEnd'
												? m === 0
													? 'Сразу после окончания'
													: `Через ${formatOffset(m)}`
												: `За ${formatOffset(m)}`}
										</option>
									))}
								</select>
							</div>
						)}

						<div className={ui.field}>
							<span className={ui.label}>Кому</span>
							<div className={ui.row}>
								<label className={ui.checkbox}>
									<input
										type='checkbox'
										checked={draft.notifyStudent}
										disabled={!isPro}
										onChange={e => update({ notifyStudent: e.target.checked })}
									/>
									Ученику
								</label>
								<label className={ui.checkbox}>
									<input
										type='checkbox'
										checked={draft.notifyParents}
										disabled={!isPro}
										onChange={e => update({ notifyParents: e.target.checked })}
									/>
									Родителям
								</label>
								<label className={ui.checkbox}>
									<input
										type='checkbox'
										checked={draft.notifyTutor}
										disabled={!isPro}
										onChange={e => update({ notifyTutor: e.target.checked })}
									/>
									Копию мне
								</label>
							</div>
						</div>
					</div>

					<div className={ui.field}>
						<span className={ui.label}>Каналы (на сайте уведомление приходит всегда)</span>
						<div className={styles.channels}>
							{CHANNELS.map(channel => {
								const active = draft.channels.includes(channel.key)
								return (
									<button
										key={channel.key}
										type='button'
										className={active ? styles.channelActive : styles.channel}
										disabled={!isPro}
										onClick={() => toggleChannel(channel.key)}
										aria-pressed={active}
									>
										<strong>{channel.label}</strong>
										<span>{channel.hint}</span>
										<em>контакт есть у {coverage(channel.key)}</em>
									</button>
								)
							})}
						</div>
					</div>

					<div className={ui.field}>
						<span className={ui.label}>Текст уведомления</span>
						<textarea
							ref={textareaRef}
							className={ui.textarea}
							value={draft.template}
							maxLength={1000}
							disabled={!isPro}
							onChange={e => update({ template: e.target.value })}
						/>
						<div className={styles.variables}>
							{allowedVariables.map(v => (
								<button
									key={v.key}
									type='button'
									className={styles.variable}
									disabled={!isPro}
									onClick={() => insertVariable(v.key)}
									title={v.description}
								>
									{`{${v.key}}`}
									<span>{v.description}</span>
								</button>
							))}
						</div>
					</div>

					<div className={styles.preview}>
						<div className={styles.previewHead}>
							<span className={ui.label}>Так увидит ученик</span>
							<span className={ui.muted}>
								{preview.length} симв.
								{draft.channels.includes('sms') && ` · ${smsParts} SMS`}
							</span>
						</div>
						<p>{preview || '—'}</p>
					</div>

					<div className={ui.row}>
						<button
							type='button'
							className={ui.btnPrimary}
							disabled={!isPro || !isDirty || busy !== null}
							onClick={() => save()}
						>
							{busy === 'save' ? 'Сохраняем…' : 'Сохранить'}
						</button>
						<button type='button' className={ui.btn} disabled={!isPro || busy !== null} onClick={test}>
							{busy === 'test' ? 'Отправляем…' : 'Отправить тест себе'}
						</button>
						{isDirty && (
							<button type='button' className={ui.btnGhost} onClick={() => setDraft(toDraft(rule))}>
								Отменить изменения
							</button>
						)}
						<span className={ui.spacer} />
						{rule.isCustomized && (
							<button type='button' className={ui.btnGhost} disabled={busy !== null} onClick={reset}>
								Сбросить по умолчанию
							</button>
						)}
						{draft.template !== rule.defaultTemplate && (
							<button
								type='button'
								className={ui.btnGhost}
								disabled={!isPro}
								onClick={() => update({ template: rule.defaultTemplate })}
							>
								Вернуть стандартный текст
							</button>
						)}
					</div>
				</div>
			)}
		</article>
	)
}

const NotificationSettingsPage = () => {
	const navigate = useNavigate()
	const [settings, setSettings] = useState<NotificationSettings | null>(null)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		getNotificationSettings()
			.then(setSettings)
			.catch(err => setError(getApiErrorMessage(err, 'Не удалось загрузить настройки')))
	}, [])

	const grouped = useMemo(
		() =>
			GROUPS.map(group => ({
				...group,
				rules: settings?.rules.filter(r => r.group === group.key) ?? [],
			})),
		[settings],
	)

	const handleSaved = (saved: NotificationRule) =>
		setSettings(prev => (prev ? { ...prev, rules: prev.rules.map(r => (r.type === saved.type ? saved : r)) } : prev))

	if (error) {
		return (
			<div className={ui.page}>
				<div className={ui.noticeWarning}>{error}</div>
			</div>
		)
	}

	if (!settings) {
		return (
			<div className={ui.page}>
				{Array.from({ length: 5 }).map((_, i) => (
					<div key={i} className={ui.skeleton} />
				))}
			</div>
		)
	}

	const isPro = settings.subscription.isActive
	const { contacts } = settings
	const missingOwn = [
		!contacts.tutorHasVk && 'VK',
		!contacts.tutorHasEmail && 'email',
		!contacts.tutorHasPhone && 'телефон',
	].filter(Boolean)

	return (
		<div className={ui.page}>
			<div className={ui.pageHeader}>
				<div>
					<h1 className={ui.pageTitle}>Уведомления для учеников</h1>
					<p className={ui.pageSubtitle}>
						Выберите, о чём, когда и как напоминать ученикам и родителям. Пока настройка не изменена,
						работают стандартные уведомления.
					</p>
				</div>
				{isPro && (
					<div className={styles.smsBox}>
						<span className={ui.muted}>SMS в этом месяце</span>
						<strong>
							{settings.subscription.smsUsedThisMonth} / {settings.subscription.smsMonthlyLimit}
						</strong>
					</div>
				)}
			</div>

			{!isPro && (
				<ProPaywall text='В стандартном режиме ученики получают базовые напоминания в VK. С Pro вы сами задаёте тексты, время и получателей, а также подключаете email и SMS.' />
			)}

			<div className={styles.stats}>
				<div>
					<strong>{contacts.recipients}</strong>
					<span>учеников и родителей</span>
				</div>
				<div>
					<strong>{contacts.withVk}</strong>
					<span>с VK</span>
				</div>
				<div>
					<strong>{contacts.withEmail}</strong>
					<span>с email</span>
				</div>
				<div>
					<strong>{contacts.withPhone}</strong>
					<span>с телефоном</span>
				</div>
			</div>

			{contacts.recipients > 0 && contacts.withPhone < contacts.recipients && isPro && (
				<div className={ui.notice}>
					SMS придут только тем, кто указал телефон в своём профиле. Попросите учеников и родителей
					заполнить номер в разделе «Мой профиль».
				</div>
			)}

			{missingOwn.length > 0 && isPro && (
				<div className={ui.notice}>
					Чтобы проверять уведомления «Отправить тест себе», добавьте в профиль: {missingOwn.join(', ')}.
					<button type='button' className={`${ui.btn} ${ui.btnSmall}`} onClick={() => navigate('/profile')}>
						Открыть профиль
					</button>
				</div>
			)}

			{grouped.map(group => (
				<section key={group.key} className={styles.group}>
					<h2 className={ui.sectionTitle}>{group.title}</h2>
					<div className={`${styles.rules} ${isPro ? '' : styles.rulesLocked}`}>
						{group.rules.map(rule => (
							<RuleCard
								key={rule.type}
								rule={rule}
								variables={settings.variables}
								contacts={contacts}
								isPro={isPro}
								onSaved={handleSaved}
							/>
						))}
					</div>
				</section>
			))}
		</div>
	)
}

export default NotificationSettingsPage
