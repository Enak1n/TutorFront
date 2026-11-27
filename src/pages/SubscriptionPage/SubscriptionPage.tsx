import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
	createSubscriptionPayment,
	getMySubscription,
	pluralMonths,
	type SubscriptionStatus,
} from '@api/subscription'
import { getApiErrorMessage } from '@api/files'
import { useAlert } from '@components/ui/alert/AlertContext'
// @ts-ignore
import ui from '@components/pro/ui.module.scss'
// @ts-ignore
import styles from './SubscriptionPage.module.scss'

const STANDARD_FEATURES = [
	'Расписание и календарь занятий',
	'Ученики, родители, статистика и оплаты',
	'Чаты с учениками и родителями',
	'Стандартные напоминания в VK: за час до занятия и об оплате',
]

const PRO_FEATURES = [
	'Всё, что есть в стандартном режиме',
	'Свои уведомления для учеников и родителей: тексты, время, получатели',
	'Каналы на выбор: VK, email и SMS',
	'Отдельный раздел «Домашние задания» — выдача, сдача и проверка',
	'Личная библиотека материалов: собирайте готовые задания один раз и выдавайте в пару кликов',
	'Напоминания о сроке сдачи ДЗ и о проверке',
]

const PENDING_KEY = 'subscriptionPaymentPending'

const formatDate = (iso: string) =>
	new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })

const SubscriptionPage = () => {
	const navigate = useNavigate()
	const { showAlert } = useAlert()
	const [status, setStatus] = useState<SubscriptionStatus | null>(null)
	const [months, setMonths] = useState(1)
	const [isPaying, setIsPaying] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const load = useCallback(async () => {
		try {
			setStatus(await getMySubscription())
			setError(null)
		} catch (err) {
			setError(getApiErrorMessage(err, 'Не удалось загрузить данные о подписке'))
		}
	}, [])

	useEffect(() => {
		load()
	}, [load])

	// После возврата из ЮKassa вебхук может прийти на несколько секунд позже — перепроверяем (до ~30 с).
	const [pollsLeft, setPollsLeft] = useState(() => {
		try {
			return sessionStorage.getItem(PENDING_KEY) ? 8 : 0
		} catch {
			return 0
		}
	})

	useEffect(() => {
		if (!status) return
		if (status.isActive || pollsLeft <= 0) {
			try {
				sessionStorage.removeItem(PENDING_KEY)
			} catch {
				/* недоступно — не страшно */
			}
			return
		}
		const timer = setTimeout(() => {
			setPollsLeft(n => n - 1)
			load()
		}, 4000)
		return () => clearTimeout(timer)
	}, [status, pollsLeft, load])

	const pay = async () => {
		setIsPaying(true)
		try {
			const result = await createSubscriptionPayment(months)
			if (result.confirmationUrl) {
				try {
					sessionStorage.setItem(PENDING_KEY, '1')
				} catch {
					/* недоступно — просто не будет автопроверки */
				}
				window.location.href = result.confirmationUrl
				return
			}
			showAlert('Подписка Pro активирована', 'success')
			await load()
		} catch (err) {
			showAlert(getApiErrorMessage(err, 'Не удалось создать платёж'), 'error')
		} finally {
			setIsPaying(false)
		}
	}

	if (error) {
		return (
			<div className={ui.page}>
				<div className={ui.noticeWarning}>{error}</div>
			</div>
		)
	}

	if (!status) {
		return (
			<div className={ui.page}>
				<div className={ui.skeleton} style={{ height: 160 }} />
				<div className={ui.skeleton} style={{ height: 320 }} />
			</div>
		)
	}

	const basePrice = status.periods.find(p => p.months === 1)?.price ?? 0
	const selected = status.periods.find(p => p.months === months) ?? status.periods[0]

	return (
		<div className={ui.page}>
			<div className={ui.pageHeader}>
				<div>
					<h1 className={ui.pageTitle}>Подписка</h1>
					<p className={ui.pageSubtitle}>
						Стандартный режим бесплатный и остаётся с вами навсегда. Pro добавляет настраиваемые
						уведомления, SMS и домашние задания.
					</p>
				</div>
			</div>

			{pollsLeft > 0 && !status.isActive && (
				<div className={ui.notice}>Проверяем оплату… Обычно это занимает несколько секунд.</div>
			)}

			<section className={`${ui.card} ${styles.current}`}>
				<div>
					<div className={ui.muted}>Текущий тариф</div>
					<div className={styles.currentPlan}>
						{status.isActive ? (
							<>
								<span className={ui.badgePro}>PRO</span> Pro
							</>
						) : (
							'Стандарт'
						)}
					</div>
					<div className={ui.muted}>
						{status.isActive && status.expiresAt
							? `Действует до ${formatDate(status.expiresAt)}`
							: status.expiresAt
								? `Подписка закончилась ${formatDate(status.expiresAt)}`
								: 'Бесплатно, без ограничений по времени'}
					</div>
				</div>

				{status.isActive && (
					<div className={styles.smsUsage}>
						<div className={ui.muted}>SMS в этом месяце</div>
						<div className={styles.smsCount}>
							{status.smsUsedThisMonth} <span>из {status.smsMonthlyLimit}</span>
						</div>
						<div className={styles.progress}>
							<span
								style={{
									width: `${Math.min(100, (status.smsUsedThisMonth / Math.max(1, status.smsMonthlyLimit)) * 100)}%`,
								}}
							/>
						</div>
					</div>
				)}

				{status.isActive && (
					<div className={ui.row}>
						<button type='button' className={ui.btn} onClick={() => navigate('/notification-settings')}>
							Настроить уведомления
						</button>
						<button type='button' className={ui.btn} onClick={() => navigate('/homework')}>
							Домашние задания
						</button>
					</div>
				)}
			</section>

			<section className={styles.plans}>
				<article className={`${ui.card} ${styles.plan}`}>
					<h2 className={styles.planTitle}>Стандарт</h2>
					<div className={styles.planPrice}>Бесплатно</div>
					<ul className={styles.features}>
						{STANDARD_FEATURES.map(item => (
							<li key={item}>{item}</li>
						))}
					</ul>
					{!status.isActive && <div className={ui.badge}>Ваш тариф</div>}
				</article>

				<article className={`${ui.card} ${styles.plan} ${styles.planPro}`}>
					<h2 className={styles.planTitle}>
						Pro <span className={ui.badgePro}>PRO</span>
					</h2>
					<div className={styles.planPrice}>
						{selected.price.toLocaleString('ru-RU')} ₽ <span>за {pluralMonths(selected.months)}</span>
					</div>
					<ul className={styles.features}>
						{PRO_FEATURES.map(item => (
							<li key={item}>{item}</li>
						))}
						<li>{status.smsMonthlyLimit} SMS в месяц включено</li>
					</ul>

					<div className={styles.periods} role='radiogroup' aria-label='Срок подписки'>
						{status.periods.map(period => {
							const discount =
								basePrice > 0 ? Math.round((1 - period.price / (basePrice * period.months)) * 100) : 0
							return (
								<button
									key={period.months}
									type='button'
									role='radio'
									aria-checked={months === period.months}
									className={months === period.months ? styles.periodActive : styles.period}
									onClick={() => setMonths(period.months)}
								>
									<strong>{pluralMonths(period.months)}</strong>
									<span>{period.price.toLocaleString('ru-RU')} ₽</span>
									{discount > 0 && <em>−{discount}%</em>}
								</button>
							)
						})}
					</div>

					<button type='button' className={ui.btnPrimary} onClick={pay} disabled={isPaying}>
						{isPaying ? 'Переходим к оплате…' : status.isActive ? 'Продлить подписку' : 'Оформить Pro'}
					</button>
					<p className={ui.muted}>
						Оплата картой или через СБП в ЮKassa. Продление добавляется к текущему сроку. Если подписка
						закончится, данные сохранятся, а уведомления вернутся к стандартным.
					</p>
				</article>
			</section>
		</div>
	)
}

export default SubscriptionPage
