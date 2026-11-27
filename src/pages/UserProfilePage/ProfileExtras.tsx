import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
	formatPhone,
	getMyContacts,
	getUserSubscription,
	pluralMonths,
	setUserSubscription,
	updateMyPhone,
	type MyContacts,
	type SubscriptionStatus,
} from '@api/subscription'
import { getApiErrorMessage } from '@api/files'
import { useAlert } from '@components/ui/alert/AlertContext'
// @ts-ignore
import ui from '@components/pro/ui.module.scss'

const formatDate = (iso: string) =>
	new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })

/** Свой профиль: телефон для SMS и статус подписки (для репетитора). */
export const MyContactsCard = ({ isTutor }: { isTutor: boolean }) => {
	const { showAlert } = useAlert()
	const navigate = useNavigate()
	const [contacts, setContacts] = useState<MyContacts | null>(null)
	const [phone, setPhone] = useState('')
	const [isSaving, setIsSaving] = useState(false)

	useEffect(() => {
		getMyContacts()
			.then(data => {
				setContacts(data)
				setPhone(formatPhone(data.phone))
			})
			.catch(() => undefined)
	}, [])

	const save = async () => {
		setIsSaving(true)
		try {
			const result = await updateMyPhone(phone.trim() || null)
			setContacts(prev => (prev ? { ...prev, phone: result.phone } : prev))
			setPhone(formatPhone(result.phone))
			showAlert(result.phone ? 'Телефон сохранён' : 'Телефон удалён', 'success')
		} catch (err) {
			showAlert(getApiErrorMessage(err, 'Не удалось сохранить телефон'), 'error')
		} finally {
			setIsSaving(false)
		}
	}

	if (!contacts) return null

	const isDirty = phone.trim() !== formatPhone(contacts.phone)

	return (
		<section className={ui.card} style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'left' }}>
			<h2 className={ui.sectionTitle} style={{ margin: 0 }}>
				Контакты для уведомлений
			</h2>
			<div className={ui.row}>
				<span className={contacts.hasVk ? ui.badgeSuccess : ui.badge}>VK {contacts.hasVk ? 'подключён' : 'не подключён'}</span>
				<span className={contacts.email ? ui.badgeSuccess : ui.badge}>{contacts.email ? `Email: ${contacts.email}` : 'Email не указан'}</span>
			</div>
			<label className={ui.field}>
				<span className={ui.label}>Телефон для SMS</span>
				<div className={ui.row} style={{ flexWrap: 'nowrap' }}>
					<input
						className={ui.input}
						type='tel'
						inputMode='tel'
						autoComplete='tel'
						value={phone}
						onChange={e => setPhone(e.target.value)}
						placeholder='+7 900 123-45-67'
						maxLength={20}
					/>
					<button type='button' className={ui.btnPrimary} onClick={save} disabled={!isDirty || isSaving}>
						Сохранить
					</button>
				</div>
				<span className={ui.muted}>
					{isTutor
						? 'Номер нужен, чтобы проверять SMS-уведомления на себе. Ученикам и родителям он не показывается.'
						: 'Репетитор может присылать напоминания о занятиях и домашних заданиях по SMS. Номер виден только вам и администратору.'}
				</span>
			</label>

			{isTutor && (
				<div className={ui.notice}>
					{contacts.isPro ? (
						<>
							<span className={ui.badgePro}>PRO</span> Подписка активна.
						</>
					) : (
						'Стандартный режим.'
					)}
					<span className={ui.spacer} />
					<button type='button' className={`${ui.btn} ${ui.btnSmall}`} onClick={() => navigate('/subscription')}>
						{contacts.isPro ? 'Управлять подпиской' : 'Подключить Pro'}
					</button>
				</div>
			)}
		</section>
	)
}

/** Администратор на странице репетитора: выдать / продлить / отключить подписку. */
export const AdminSubscriptionCard = ({ userId }: { userId: string }) => {
	const { showAlert, showConfirm } = useAlert()
	const [status, setStatus] = useState<SubscriptionStatus | null>(null)
	const [isSaving, setIsSaving] = useState(false)

	useEffect(() => {
		getUserSubscription(userId)
			.then(setStatus)
			.catch(() => undefined)
	}, [userId])

	const apply = async (body: { months?: number | null; expiresAt?: string | null }, message: string) => {
		setIsSaving(true)
		try {
			setStatus(await setUserSubscription(userId, body))
			showAlert(message, 'success')
		} catch (err) {
			showAlert(getApiErrorMessage(err, 'Не удалось изменить подписку'), 'error')
		} finally {
			setIsSaving(false)
		}
	}

	if (!status) return null

	return (
		<section className={ui.card} style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 12, textAlign: 'left' }}>
			<h2 className={ui.sectionTitle} style={{ margin: 0 }}>
				Подписка репетитора
			</h2>
			<div>
				{status.isActive ? (
					<>
						<span className={ui.badgePro}>PRO</span> до {formatDate(status.expiresAt!)} · SMS:{' '}
						{status.smsUsedThisMonth}/{status.smsMonthlyLimit}
					</>
				) : (
					<span className={ui.muted}>
						Стандартный режим{status.expiresAt ? ` (Pro закончилась ${formatDate(status.expiresAt)})` : ''}
					</span>
				)}
			</div>
			<div className={ui.row}>
				{[1, 3, 12].map(months => (
					<button
						key={months}
						type='button'
						className={`${ui.btn} ${ui.btnSmall}`}
						disabled={isSaving}
						onClick={() => apply({ months }, `Подписка продлена на ${pluralMonths(months)}`)}
					>
						+{pluralMonths(months)}
					</button>
				))}
				{status.isActive && (
					<button
						type='button'
						className={`${ui.btnDanger} ${ui.btnSmall}`}
						disabled={isSaving}
						onClick={() =>
							showConfirm('Отключить подписку Pro у этого репетитора?', () =>
								apply({ months: null, expiresAt: null }, 'Подписка отключена'),
							)
						}
					>
						Отключить
					</button>
				)}
			</div>
		</section>
	)
}
