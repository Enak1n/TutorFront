// src/shared/components/layout/Header/LoginModal.tsx
'use client'

import type React from 'react'
import { useState, useEffect, useCallback } from 'react'
import {
	TelegramLoginButton,
	type TelegramUser,
} from '@components/auth/TelegramLoginButton'
// @ts-ignore
import styles from './LoginModal.module.scss'
import {
	loginV2,
	attachEmail,
	requestCode,
	verifyEmail,
	loginWithTelegram,
} from '@api/auth'

export interface LoginModalProps {
	isOpen: boolean
	onClose: () => void
	onLogin: (
		role: 'tutor' | 'student_or_parent',
		telegramData: TelegramUser,
	) => void
	isClosable?: boolean
}

interface MigrationFormData {
	email: string
	password: string
	confirmPassword: string
}

export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
const CODE_TIMER_DURATION = 2 * 60 * 1000

const STORAGE_KEYS = {
	PENDING_ROLE: 'pendingRole',
	MIGRATION_TIMER: 'migration_code_timer',
	MIGRATION_EMAIL: 'migration_email',
	MIGRATION_SHOW_CODE_VERIFICATION: 'migration_show_code_verification',
	MIGRATION_PENDING: 'migration_pending',
	MIGRATION_TG_USER: 'migration_tg_user', // 🔹 NEW: для сохранения ника/аватарки
	AUTH_TOKEN: 'authToken',
	USER_ROLE: 'userRole',
} as const

export const LoginModal: React.FC<LoginModalProps> = ({
	isOpen,
	onClose,
	onLogin,
	isClosable = true,
}) => {
	// ========================================================================
	// 🔹 ЛЕНИВАЯ ИНИЦИАЛИЗАЦИЯ (СИНХРОННО ИЗ LS)
	// ========================================================================
	const [selectedRole, setSelectedRole] = useState<
		'tutor' | 'student_or_parent' | null
	>(null)

	const [showMigrationModal, setShowMigrationModal] = useState(
		() =>
			typeof window !== 'undefined' &&
			localStorage.getItem(STORAGE_KEYS.MIGRATION_PENDING) === 'true',
	)

	const [showCodeVerification, setShowCodeVerification] = useState(
		() =>
			typeof window !== 'undefined' &&
			localStorage.getItem(STORAGE_KEYS.MIGRATION_SHOW_CODE_VERIFICATION) ===
				'true',
	)

	const [emailFormData, setEmailFormData] = useState<MigrationFormData>(() => {
		const savedEmail =
			typeof window !== 'undefined'
				? localStorage.getItem(STORAGE_KEYS.MIGRATION_EMAIL)
				: null
		return { email: savedEmail || '', password: '', confirmPassword: '' }
	})

	const [codeTimer, setCodeTimer] = useState(() => {
		if (typeof window === 'undefined') return 0
		const savedTimer = localStorage.getItem(STORAGE_KEYS.MIGRATION_TIMER)
		if (savedTimer) {
			const diff = parseInt(savedTimer, 10) - Date.now()
			return diff > 0 ? Math.ceil(diff / 1000) : 0
		}
		return 0
	})

	// 🔹 Восстанавливаем данные пользователя ТГ после перезагрузки
	const [telegramUserData, setTelegramUserData] = useState<TelegramUser | null>(
		() => {
			if (typeof window === 'undefined') return null
			try {
				const saved = localStorage.getItem(STORAGE_KEYS.MIGRATION_TG_USER)
				return saved ? JSON.parse(saved) : null
			} catch {
				return null
			}
		},
	)

	const [telegramAuthToken, setTelegramAuthToken] = useState<string | null>(
		null,
	)
	const [loginMethod, setLoginMethod] = useState<'telegram' | 'email'>(
		'telegram',
	)
	const [formErrors, setFormErrors] = useState<Partial<MigrationFormData>>({})
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [globalError, setGlobalError] = useState<string>('')
	const [verificationCode, setVerificationCode] = useState('')
	const [codeError, setCodeError] = useState<string>('')
	const [isCodeSubmitting, setIsCodeSubmitting] = useState(false)
	const [emailLoginData, setEmailLoginData] = useState({
		email: '',
		password: '',
	})
	const [emailLoginErrors, setEmailLoginErrors] = useState<
		Partial<Record<keyof typeof emailLoginData, string>>
	>({})

	// Тикер таймера
	useEffect(() => {
		if (codeTimer <= 0) return
		const interval = setInterval(() => {
			setCodeTimer(prev => {
				if (prev <= 1) {
					localStorage.removeItem(STORAGE_KEYS.MIGRATION_TIMER)
					localStorage.removeItem(STORAGE_KEYS.MIGRATION_EMAIL)
					localStorage.removeItem(STORAGE_KEYS.MIGRATION_SHOW_CODE_VERIFICATION)
					localStorage.removeItem(STORAGE_KEYS.MIGRATION_PENDING)
					localStorage.removeItem(STORAGE_KEYS.MIGRATION_TG_USER)
					return 0
				}
				return prev - 1
			})
		}, 1000)
		return () => clearInterval(interval)
	}, [codeTimer])

	// Восстановление роли
	useEffect(() => {
		if (!isOpen) return
		const savedRole = localStorage.getItem(STORAGE_KEYS.PENDING_ROLE) as
			| 'tutor'
			| 'student_or_parent'
			| null
		if (savedRole) setSelectedRole(savedRole)
	}, [isOpen])

	// handleClose
	const handleClose = useCallback(() => {
		const isMigrationPending =
			localStorage.getItem(STORAGE_KEYS.MIGRATION_PENDING) === 'true'
		if (isMigrationPending && isClosable === false) return

		setSelectedRole(null)
		setTelegramUserData(null)
		setTelegramAuthToken(null)
		setShowMigrationModal(false)
		setShowCodeVerification(false)
		setCodeTimer(0)
		setVerificationCode('')
		setEmailFormData({ email: '', password: '', confirmPassword: '' })
		setEmailLoginData({ email: '', password: '' })
		setFormErrors({})
		setEmailLoginErrors({})
		setGlobalError('')
		setCodeError('')
		localStorage.removeItem(STORAGE_KEYS.PENDING_ROLE)
		localStorage.removeItem(STORAGE_KEYS.MIGRATION_TIMER)
		localStorage.removeItem(STORAGE_KEYS.MIGRATION_EMAIL)
		localStorage.removeItem(STORAGE_KEYS.MIGRATION_SHOW_CODE_VERIFICATION)
		localStorage.removeItem(STORAGE_KEYS.MIGRATION_PENDING)
		localStorage.removeItem(STORAGE_KEYS.MIGRATION_TG_USER) // 🔹 Очистка
		onClose()
	}, [onClose, isClosable])

	// ========================================================================
	if (!isOpen) return null
	// ========================================================================

	const handleRoleSelect = (role: 'tutor' | 'student_or_parent') => {
		setSelectedRole(role)
		localStorage.setItem(STORAGE_KEYS.PENDING_ROLE, role)
		setGlobalError('')
	}

	const validatePassword = (password: string): string | null => {
		if (!password) return 'Пароль обязателен'
		if (!PASSWORD_REGEX.test(password)) {
			return 'Пароль должен содержать: минимум 8 символов, 1 заглавную букву, 1 строчную букву и 1 цифру'
		}
		return null
	}

	const validateMigrationForm = (): boolean => {
		const errors: Partial<MigrationFormData> = {}
		if (!emailFormData.email.trim()) errors.email = 'Email обязателен'
		else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailFormData.email))
			errors.email = 'Некорректный формат email'

		const passwordError = validatePassword(emailFormData.password)
		if (passwordError) errors.password = passwordError
		if (emailFormData.password !== emailFormData.confirmPassword)
			errors.confirmPassword = 'Пароли не совпадают'

		setFormErrors(errors)
		return Object.keys(errors).length === 0
	}

	const validateEmailLogin = (): boolean => {
		const errors: Partial<Record<keyof typeof emailLoginData, string>> = {}
		if (!emailLoginData.email.trim()) errors.email = 'Email обязателен'
		else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLoginData.email))
			errors.email = 'Некорректный формат email'
		if (!emailLoginData.password) errors.password = 'Пароль обязателен'
		setEmailLoginErrors(errors)
		return Object.keys(errors).length === 0
	}

	const handleMigrationSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setGlobalError('')
		if (!validateMigrationForm()) return

		const token =
			telegramAuthToken || localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
		if (!token) {
			setGlobalError(
				'Ошибка авторизации. Попробуйте войти через Telegram ещё раз',
			)
			return
		}

		setIsSubmitting(true)
		setCodeError('')
		try {
			console.log('🚀 [MIGRATION] Отправка attachEmail...')
			await attachEmail(emailFormData.email, emailFormData.password, token)
			console.log('✅ [MIGRATION] attachEmail успех. Отправка requestCode...')

			const endTime = Date.now() + CODE_TIMER_DURATION
			localStorage.setItem(STORAGE_KEYS.MIGRATION_TIMER, endTime.toString())
			localStorage.setItem(STORAGE_KEYS.MIGRATION_EMAIL, emailFormData.email)
			setCodeTimer(120)
			setShowCodeVerification(true)
			localStorage.setItem(
				STORAGE_KEYS.MIGRATION_SHOW_CODE_VERIFICATION,
				'true',
			)
			localStorage.setItem(STORAGE_KEYS.MIGRATION_PENDING, 'true')
		} catch (error: any) {
			console.error('❌ [MIGRATION] Ошибка:', error)
			setGlobalError(error.message || 'Произошла ошибка. Попробуйте ещё раз')
		} finally {
			setIsSubmitting(false)
		}
	}

	const handleCodeSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!verificationCode.trim() || !emailFormData.email) return
		setIsCodeSubmitting(true)
		setCodeError('')
		try {
			await verifyEmail(emailFormData.email, verificationCode)
			localStorage.removeItem(STORAGE_KEYS.MIGRATION_TIMER)
			localStorage.removeItem(STORAGE_KEYS.MIGRATION_EMAIL)
			localStorage.removeItem(STORAGE_KEYS.MIGRATION_SHOW_CODE_VERIFICATION)
			localStorage.removeItem(STORAGE_KEYS.MIGRATION_PENDING)
			localStorage.removeItem(STORAGE_KEYS.MIGRATION_TG_USER) // 🔹 Очистка при успехе
			if (selectedRole && telegramUserData && onLogin) {
				onLogin(selectedRole, telegramUserData)
			}
			handleClose()
		} catch (error: any) {
			console.error('❌ [VERIFY] Ошибка:', error)
			setCodeError(error.message || 'Неверный код. Попробуйте ещё раз')
		} finally {
			setIsCodeSubmitting(false)
		}
	}

	const handleResendCode = async () => {
		if (codeTimer > 0 || !emailFormData.email) return
		try {
			await requestCode(emailFormData.email)
			const endTime = Date.now() + CODE_TIMER_DURATION
			localStorage.setItem(STORAGE_KEYS.MIGRATION_TIMER, endTime.toString())
			setCodeTimer(120)
			setCodeError('')
		} catch (error: any) {
			setCodeError(error.message || 'Не удалось отправить код')
		}
	}

	const formatTimer = (seconds: number): string => {
		const mins = Math.floor(seconds / 60)
		const secs = seconds % 60
		return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
	}

	const handleTelegramAuth = async (user: TelegramUser) => {
		if (!selectedRole) return
		setIsSubmitting(true)
		setGlobalError('')
		try {
			const response = await loginWithTelegram(user, selectedRole)
			if (response.accessToken) {
				localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, response.accessToken)
				setTelegramAuthToken(response.accessToken)
			}
			const needsMigration =
				response.hasEmailAttached === undefined
					? true
					: !response.hasEmailAttached
			if (needsMigration) {
				setTelegramUserData(user)
				localStorage.setItem(
					STORAGE_KEYS.MIGRATION_TG_USER,
					JSON.stringify(user),
				) // 🔹 Сохраняем в LS
				setShowMigrationModal(true)
				localStorage.setItem(STORAGE_KEYS.MIGRATION_PENDING, 'true')
				if (user.username) {
					setEmailFormData(prev => ({
						...prev,
						email: `${user.username}@telegram.local`,
					}))
				}
			} else {
				if (response.role)
					localStorage.setItem(STORAGE_KEYS.USER_ROLE, response.role)
				if (onLogin) onLogin(selectedRole, user)
				handleClose()
			}
		} catch (error: any) {
			console.error('❌ [TG AUTH] Ошибка:', error)
			setGlobalError(error.message || 'Ошибка входа через Telegram')
		} finally {
			setIsSubmitting(false)
		}
	}

	const handleEmailLogin = async (e: React.FormEvent) => {
		e.preventDefault()
		setGlobalError('')
		if (!validateEmailLogin()) return
		setIsSubmitting(true)
		try {
			const response = await loginV2({
				email: emailLoginData.email,
				password: emailLoginData.password,
			})
			if (response.role)
				localStorage.setItem(STORAGE_KEYS.USER_ROLE, response.role)
			if (selectedRole && onLogin) {
				onLogin(selectedRole, {
					id: 0,
					first_name: emailLoginData.email.split('@')[0],
					last_name: '',
					username: emailLoginData.email.split('@')[0],
					photo_url: undefined,
					auth_date: Math.floor(Date.now() / 1000).toString(),
					hash: '',
				})
			}
			handleClose()
		} catch (error: any) {
			console.error('❌ [EMAIL LOGIN] Ошибка:', error)
			setEmailLoginErrors({
				password: error.message || 'Неверный email или пароль',
			})
		} finally {
			setIsSubmitting(false)
		}
	}

	const handleBackToRoleSelect = () => {
		setShowMigrationModal(false)
		setShowCodeVerification(false)
		setTelegramUserData(null)
		setTelegramAuthToken(null)
		setEmailFormData({ email: '', password: '', confirmPassword: '' })
		setFormErrors({})
		setCodeTimer(0)
		setVerificationCode('')
		localStorage.removeItem(STORAGE_KEYS.MIGRATION_TIMER)
		localStorage.removeItem(STORAGE_KEYS.MIGRATION_EMAIL)
		localStorage.removeItem(STORAGE_KEYS.MIGRATION_SHOW_CODE_VERIFICATION)
		localStorage.removeItem(STORAGE_KEYS.MIGRATION_PENDING)
		localStorage.removeItem(STORAGE_KEYS.MIGRATION_TG_USER) // 🔹 Очистка
		setGlobalError('')
	}

	// ========================================================================
	// 🔹 РЕНДЕР-МЕТОДЫ
	// ========================================================================

	const renderCloseButton = () => {
		if (showMigrationModal || isClosable === false) return null
		return (
			<button
				type='button'
				className={styles.closeButton}
				onClick={handleClose}
				aria-label='Закрыть'
			>
				×
			</button>
		)
	}

	const renderCodeVerification = () => (
		<div className={styles.modal}>
			<div className={styles.modalHeader}>
				<h3 className={styles.modalTitle}>Подтвердите email</h3>
				{renderCloseButton()}
			</div>
			<div className={styles.modalContent}>
				<p className={styles.description}>
					Мы отправили код подтверждения на{' '}
					<strong>{emailFormData.email}</strong>
				</p>
				<form onSubmit={handleCodeSubmit} className={styles.codeForm}>
					<div className={styles.formGroup}>
						<label htmlFor='code' className={styles.formLabel}>
							Код из письма *
						</label>
						<input
							id='code'
							type='text'
							inputMode='numeric'
							pattern='[0-9]*'
							maxLength={6}
							className={`${styles.formInput} ${styles.codeInput} ${codeError ? styles.inputError : ''}`}
							value={verificationCode}
							onChange={e => {
								setVerificationCode(
									e.target.value.replace(/\D/g, '').slice(0, 6),
								)
								if (codeError) setCodeError('')
							}}
							placeholder='000000'
							disabled={isCodeSubmitting || codeTimer <= 0}
							autoFocus
						/>
						{codeError && (
							<span className={styles.errorMessage}>{codeError}</span>
						)}
					</div>
					<button
						type='submit'
						className={styles.submitButton}
						disabled={isCodeSubmitting || verificationCode.length !== 6}
					>
						{isCodeSubmitting ? 'Проверка...' : 'Подтвердить'}
					</button>
				</form>
				<div className={styles.timerSection}>
					{codeTimer > 0 ? (
						<p className={styles.timerText}>
							Повторная отправка через{' '}
							<span className={styles.timerValue}>
								{formatTimer(codeTimer)}
							</span>
						</p>
					) : (
						<button
							type='button'
							className={styles.resendButton}
							onClick={handleResendCode}
							disabled={isSubmitting}
						>
							Отправить код ещё раз
						</button>
					)}
				</div>
				<button
					type='button'
					className={styles.backButton}
					onClick={handleBackToRoleSelect}
				>
					← Изменить email
				</button>
			</div>
		</div>
	)

	const renderMigrationForm = () => (
		<div className={styles.modal}>
			<div className={styles.modalHeader}>
				<h3 className={styles.modalTitle}>Завершите регистрацию</h3>
				{renderCloseButton()}
			</div>
			<div className={styles.modalContent}>
				<p className={styles.description}>
					Так как телеграмм на территории Российской федерации испытывает
					трудности для продолжения работы укажите email и создайте пароль. Это
					нужно для миграции вашего аккаунта.
				</p>
				{telegramUserData && (
					<div className={styles.userInfo}>
						<div className={styles.userInfoAvatar}>
							{telegramUserData.photo_url ? (
								<img src={telegramUserData.photo_url} alt='Avatar' />
							) : (
								<span>
									{telegramUserData.first_name?.[0]?.toUpperCase() || '👤'}
								</span>
							)}
						</div>
						<div className={styles.userInfoText}>
							<strong>
								{telegramUserData.first_name} {telegramUserData.last_name}
							</strong>
							{telegramUserData.username && (
								<span>@{telegramUserData.username}</span>
							)}
						</div>
					</div>
				)}
				{globalError && <div className={styles.globalError}>{globalError}</div>}
				<form onSubmit={handleMigrationSubmit} className={styles.migrationForm}>
					<div className={styles.formGroup}>
						<label htmlFor='email' className={styles.formLabel}>
							Email *
						</label>
						<input
							id='email'
							type='email'
							className={`${styles.formInput} ${formErrors.email ? styles.inputError : ''}`}
							value={emailFormData.email}
							onChange={e => {
								setEmailFormData(prev => ({ ...prev, email: e.target.value }))
								if (formErrors.email)
									setFormErrors(prev => ({ ...prev, email: undefined }))
								if (globalError) setGlobalError('')
							}}
							placeholder='your@email.com'
							disabled={isSubmitting || showCodeVerification}
						/>
						{formErrors.email && (
							<span className={styles.errorMessage}>{formErrors.email}</span>
						)}
					</div>
					<div className={styles.formGroup}>
						<label htmlFor='password' className={styles.formLabel}>
							Пароль *
						</label>
						<input
							id='password'
							type='password'
							className={`${styles.formInput} ${formErrors.password ? styles.inputError : ''}`}
							value={emailFormData.password}
							onChange={e => {
								setEmailFormData(prev => ({
									...prev,
									password: e.target.value,
								}))
								if (formErrors.password)
									setFormErrors(prev => ({ ...prev, password: undefined }))
								if (globalError) setGlobalError('')
							}}
							placeholder='Мин. 8 симв., 1 заглавная, 1 строчная, 1 цифра'
							disabled={isSubmitting || showCodeVerification}
						/>
						{formErrors.password && (
							<span className={styles.errorMessage}>{formErrors.password}</span>
						)}
						<p className={styles.passwordHint}>
							Пароль должен содержать: минимум 8 символов, 1 заглавную букву, 1
							строчную букву и 1 цифру
						</p>
					</div>
					<div className={styles.formGroup}>
						<label htmlFor='confirmPassword' className={styles.formLabel}>
							Подтвердите пароль *
						</label>
						<input
							id='confirmPassword'
							type='password'
							className={`${styles.formInput} ${formErrors.confirmPassword ? styles.inputError : ''}`}
							value={emailFormData.confirmPassword}
							onChange={e => {
								setEmailFormData(prev => ({
									...prev,
									confirmPassword: e.target.value,
								}))
								if (formErrors.confirmPassword)
									setFormErrors(prev => ({
										...prev,
										confirmPassword: undefined,
									}))
							}}
							placeholder='Повторите пароль'
							disabled={isSubmitting || showCodeVerification}
						/>
						{formErrors.confirmPassword && (
							<span className={styles.errorMessage}>
								{formErrors.confirmPassword}
							</span>
						)}
					</div>
					<button
						type='submit'
						className={styles.submitButton}
						disabled={isSubmitting || showCodeVerification}
					>
						{isSubmitting ? (
							<span className={styles.loadingSpinner}>Загрузка...</span>
						) : (
							'Продолжить'
						)}
					</button>
				</form>
				<p className={styles.privacyText}>
					Нажимая «Продолжить», вы соглашаетесь с обработкой персональных данных
				</p>
			</div>
		</div>
	)

	const renderAuthMethodSelect = () => (
		<div className={styles.modal}>
			<div className={styles.modalHeader}>
				<h3 className={styles.modalTitle}>
					{loginMethod === 'telegram' ? 'Выберите роль' : 'Вход по email'}
				</h3>
				{renderCloseButton()}
			</div>
			<div className={styles.modalContent}>
				{globalError && <div className={styles.globalError}>{globalError}</div>}
				{selectedRole && (
					<div className={styles.loginMethodToggle}>
						<button
							type='button'
							className={`${styles.methodBtn} ${loginMethod === 'telegram' ? styles.active : ''}`}
							onClick={() => {
								setLoginMethod('telegram')
								setGlobalError('')
							}}
						>
							Telegram
						</button>
						<button
							type='button'
							className={`${styles.methodBtn} ${loginMethod === 'email' ? styles.active : ''}`}
							onClick={() => {
								setLoginMethod('email')
								setGlobalError('')
							}}
						>
							Email
						</button>
					</div>
				)}
				{loginMethod === 'telegram' ? (
					<>
						<p className={styles.description}>
							Выберите, как вы хотите использовать платформу:
						</p>
						<div className={styles.roleOptions}>
							<div
								className={`${styles.roleCard} ${selectedRole === 'tutor' ? styles.selected : ''}`}
								onClick={() => handleRoleSelect('tutor')}
								role='button'
								tabIndex={0}
								onKeyDown={e => e.key === 'Enter' && handleRoleSelect('tutor')}
							>
								<span className={styles.roleIcon}>👨‍🏫</span>
								<h4 className={styles.roleTitle}>Репетитор</h4>
								<p className={styles.roleDescription}>
									Я хочу преподавать и находить учеников
								</p>
								{selectedRole === 'tutor' && (
									<div className={styles.checkmark}>✓</div>
								)}
							</div>
							<div
								className={`${styles.roleCard} ${selectedRole === 'student_or_parent' ? styles.selected : ''}`}
								onClick={() => handleRoleSelect('student_or_parent')}
								role='button'
								tabIndex={0}
								onKeyDown={e =>
									e.key === 'Enter' && handleRoleSelect('student_or_parent')
								}
							>
								<span className={styles.roleIcon}>🎓</span>
								<h4 className={styles.roleTitle}>Ищу репетитора</h4>
								<p className={styles.roleDescription}>
									Я хочу найти репетитора для обучения
								</p>
								{selectedRole === 'student_or_parent' && (
									<div className={styles.checkmark}>✓</div>
								)}
							</div>
						</div>
						{selectedRole && (
							<>
								<div className={styles.telegramButtonWrapper}>
									<TelegramLoginButton
										botName='ugolrep_bot'
										buttonSize='large'
										requestAccess={true}
										usePic={true}
										dataOnauth={handleTelegramAuth}
										lang='ru'
									/>
								</div>
								<p className={styles.privacyText}>
									Выполняя вход на сайте, вы соглашаетесь с обработкой
									персональных данных.
								</p>
							</>
						)}
					</>
				) : (
					<>
						<p className={styles.description}>
							Войдите с помощью email и пароля
						</p>
						<form
							onSubmit={handleEmailLogin}
							className={styles.migrationForm}
							noValidate
						>
							<div className={styles.formGroup}>
								<label htmlFor='login-email' className={styles.formLabel}>
									Email
								</label>
								<input
									id='login-email'
									type='email'
									className={`${styles.formInput} ${emailLoginErrors.email ? styles.inputError : ''}`}
									value={emailLoginData.email}
									onChange={e => {
										setEmailLoginData(prev => ({
											...prev,
											email: e.target.value,
										}))
										if (emailLoginErrors.email)
											setEmailLoginErrors(prev => ({
												...prev,
												email: undefined,
											}))
										if (globalError) setGlobalError('')
									}}
									placeholder='your@email.com'
									disabled={isSubmitting}
								/>
								{emailLoginErrors.email && (
									<span className={styles.errorMessage}>
										{emailLoginErrors.email}
									</span>
								)}
							</div>
							<div className={styles.formGroup}>
								<label htmlFor='login-password' className={styles.formLabel}>
									Пароль
								</label>
								<input
									id='login-password'
									type='password'
									className={`${styles.formInput} ${emailLoginErrors.password ? styles.inputError : ''}`}
									value={emailLoginData.password}
									onChange={e => {
										setEmailLoginData(prev => ({
											...prev,
											password: e.target.value,
										}))
										if (emailLoginErrors.password)
											setEmailLoginErrors(prev => ({
												...prev,
												password: undefined,
											}))
										if (globalError) setGlobalError('')
									}}
									placeholder='••••••••'
									disabled={isSubmitting}
								/>
								{emailLoginErrors.password && (
									<span className={styles.errorMessage}>
										{emailLoginErrors.password}
									</span>
								)}
							</div>
							<button
								type='submit'
								className={styles.submitButton}
								disabled={isSubmitting}
							>
								{isSubmitting ? 'Вход...' : 'Войти'}
							</button>
						</form>
					</>
				)}
			</div>
		</div>
	)

	// ========================================================================
	return (
		<>
			{/* 🔒 Клик по фону НЕ закрывает модалку, если идет миграция */}
			<div
				className={styles.overlay}
				onClick={
					showMigrationModal || isClosable === false ? undefined : handleClose
				}
				style={{
					cursor:
						showMigrationModal || isClosable === false ? 'default' : 'pointer',
				}}
			/>
			{showMigrationModal &&
				(showCodeVerification
					? renderCodeVerification()
					: renderMigrationForm())}
			{!showMigrationModal && renderAuthMethodSelect()}
		</>
	)
}

export default LoginModal
