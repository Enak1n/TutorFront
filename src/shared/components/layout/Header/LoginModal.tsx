// src/shared/components/layout/Header/LoginModal.tsx
'use client'

import React, { useEffect, useMemo, useState } from 'react'
import {
	type AuthRole,
	type LoginV2Response,
	loginV2,
	registerV2,
	requestPasswordReset,
	requestCode,
	resetPassword,
	verifyEmail,
} from '@api/auth'
// @ts-ignore
import styles from './LoginModal.module.scss'

export interface LoginModalProps {
	isOpen: boolean
	onClose: () => void
	onLogin: (authData: LoginV2Response) => void | Promise<void>
	isClosable?: boolean
	initialMode?: 'login' | 'register'
}

interface LoginFormData {
	email: string
	password: string
}

interface RegisterFormData extends LoginFormData {
	firstName: string
	lastName: string
	confirmPassword: string
	role: AuthRole | null
}

interface ForgotPasswordFormData {
	email: string
}

interface ResetPasswordFormData {
	password: string
	confirmPassword: string
}

type AuthMode = 'login' | 'register' | 'forgot-password'
type AuthStage = 'form' | 'verify' | 'reset-password'

export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const CODE_TIMER_DURATION = 2 * 60

const REGISTRATION_VERIFICATION_STORAGE_KEYS = {
	PENDING: 'registration_verification_pending',
	EMAIL: 'registration_verification_email',
	RESEND_AVAILABLE_AT: 'registration_verification_resend_available_at',
} as const

const emptyLoginForm: LoginFormData = {
	email: '',
	password: '',
}

const emptyRegisterForm: RegisterFormData = {
	email: '',
	password: '',
	firstName: '',
	lastName: '',
	confirmPassword: '',
	role: null,
}

const emptyForgotPasswordForm: ForgotPasswordFormData = {
	email: '',
}

const emptyResetPasswordForm: ResetPasswordFormData = {
	password: '',
	confirmPassword: '',
}

const getStoredRegistrationVerification = (): {
	email: string
	codeTimer: number
} | null => {
	if (typeof window === 'undefined') return null

	const isPending =
		localStorage.getItem(REGISTRATION_VERIFICATION_STORAGE_KEYS.PENDING) ===
		'true'
	const email = localStorage.getItem(
		REGISTRATION_VERIFICATION_STORAGE_KEYS.EMAIL,
	)

	if (!isPending || !email) return null

	const resendAvailableAt = Number(
		localStorage.getItem(
			REGISTRATION_VERIFICATION_STORAGE_KEYS.RESEND_AVAILABLE_AT,
		) ?? '0',
	)
	const codeTimer =
		resendAvailableAt > Date.now()
			? Math.ceil((resendAvailableAt - Date.now()) / 1000)
			: 0

	return { email, codeTimer }
}

export const hasPendingRegistrationVerification = () =>
	getStoredRegistrationVerification() !== null

const persistRegistrationVerification = (
	email: string,
	timerSeconds = CODE_TIMER_DURATION,
) => {
	if (typeof window === 'undefined') return

	localStorage.setItem(REGISTRATION_VERIFICATION_STORAGE_KEYS.PENDING, 'true')
	localStorage.setItem(REGISTRATION_VERIFICATION_STORAGE_KEYS.EMAIL, email)
	localStorage.setItem(
		REGISTRATION_VERIFICATION_STORAGE_KEYS.RESEND_AVAILABLE_AT,
		String(Date.now() + timerSeconds * 1000),
	)
}

const clearRegistrationVerification = () => {
	if (typeof window === 'undefined') return

	Object.values(REGISTRATION_VERIFICATION_STORAGE_KEYS).forEach(key => {
		localStorage.removeItem(key)
	})
}

export const LoginModal: React.FC<LoginModalProps> = ({
	isOpen,
	onClose,
	onLogin,
	isClosable = true,
	initialMode = 'login',
}) => {
	const [authMode, setAuthMode] = useState<AuthMode>(() =>
		hasPendingRegistrationVerification() ? 'register' : initialMode,
	)
	const [authStage, setAuthStage] = useState<AuthStage>(() =>
		hasPendingRegistrationVerification() ? 'verify' : 'form',
	)
	const [loginData, setLoginData] = useState<LoginFormData>(() => {
		const pendingVerification = getStoredRegistrationVerification()
		return pendingVerification
			? { ...emptyLoginForm, email: pendingVerification.email }
			: emptyLoginForm
	})
	const [registerData, setRegisterData] = useState<RegisterFormData>(() => {
		const pendingVerification = getStoredRegistrationVerification()
		return pendingVerification
			? { ...emptyRegisterForm, email: pendingVerification.email }
			: emptyRegisterForm
	})
	const [forgotPasswordData, setForgotPasswordData] =
		useState<ForgotPasswordFormData>(emptyForgotPasswordForm)
	const [resetPasswordData, setResetPasswordData] =
		useState<ResetPasswordFormData>(emptyResetPasswordForm)
	const [loginErrors, setLoginErrors] = useState<Partial<LoginFormData>>({})
	const [registerErrors, setRegisterErrors] = useState<
		Partial<Record<keyof RegisterFormData, string>>
	>({})
	const [forgotPasswordErrors, setForgotPasswordErrors] = useState<
		Partial<ForgotPasswordFormData>
	>({})
	const [resetPasswordErrors, setResetPasswordErrors] = useState<
		Partial<Record<keyof ResetPasswordFormData, string>>
	>({})
	const [verificationCode, setVerificationCode] = useState('')
	const [codeError, setCodeError] = useState('')
	const [globalError, setGlobalError] = useState('')
	const [successMessage, setSuccessMessage] = useState('')
	const [codeTimer, setCodeTimer] = useState(
		() => getStoredRegistrationVerification()?.codeTimer ?? 0,
	)
	const [isSubmitting, setIsSubmitting] = useState(false)

	const activeEmail =
		authMode === 'forgot-password'
			? forgotPasswordData.email.trim()
			: registerData.email.trim()
	const isRegistrationVerificationPending =
		authStage === 'verify' && Boolean(activeEmail)

	const canClose =
		isClosable && !isSubmitting && !isRegistrationVerificationPending

	const submitButtonText = useMemo(() => {
		if (isSubmitting)
			return authMode === 'login' ? 'Входим...' : 'Отправляем...'
		return authMode === 'login' ? 'Войти' : 'Зарегистрироваться'
	}, [authMode, isSubmitting])

	useEffect(() => {
		if (!isOpen) return

		const pendingVerification = getStoredRegistrationVerification()

		if (pendingVerification) {
			setAuthMode('register')
			setAuthStage('verify')
			setLoginData({ ...emptyLoginForm, email: pendingVerification.email })
			setRegisterData({
				...emptyRegisterForm,
				email: pendingVerification.email,
			})
			setForgotPasswordData(emptyForgotPasswordForm)
			setResetPasswordData(emptyResetPasswordForm)
			setCodeTimer(pendingVerification.codeTimer)
		} else {
			setAuthMode(initialMode)
			setAuthStage('form')
			setLoginData(emptyLoginForm)
			setRegisterData(emptyRegisterForm)
			setForgotPasswordData(emptyForgotPasswordForm)
			setResetPasswordData(emptyResetPasswordForm)
			setCodeTimer(0)
		}

		setLoginErrors({})
		setRegisterErrors({})
		setForgotPasswordErrors({})
		setResetPasswordErrors({})
		setVerificationCode('')
		setCodeError('')
		setGlobalError('')
		setSuccessMessage('')
	}, [isOpen, initialMode])

	useEffect(() => {
		if (codeTimer <= 0) return

		const interval = window.setInterval(() => {
			setCodeTimer(prev => Math.max(prev - 1, 0))
		}, 1000)

		return () => window.clearInterval(interval)
	}, [codeTimer])

	if (!isOpen) return null

	const clearMessages = () => {
		setGlobalError('')
		setSuccessMessage('')
	}

	const resetModalState = () => {
		setAuthStage('form')
		setLoginData(emptyLoginForm)
		setRegisterData(emptyRegisterForm)
		setForgotPasswordData(emptyForgotPasswordForm)
		setResetPasswordData(emptyResetPasswordForm)
		setLoginErrors({})
		setRegisterErrors({})
		setForgotPasswordErrors({})
		setResetPasswordErrors({})
		setVerificationCode('')
		setCodeError('')
		setGlobalError('')
		setSuccessMessage('')
		setCodeTimer(0)
	}

	const handleClose = () => {
		if (!canClose) return

		clearRegistrationVerification()
		resetModalState()
		onClose()
	}

	const validateEmail = (email: string) => {
		if (!email.trim()) return 'Email обязателен'
		if (!EMAIL_REGEX.test(email)) return 'Некорректный формат email'
		return null
	}

	const validatePassword = (password: string) => {
		if (!password) return 'Пароль обязателен'
		if (!PASSWORD_REGEX.test(password)) {
			return 'Минимум 8 символов, одна заглавная буква, одна строчная буква и одна цифра'
		}
		return null
	}

	const validateLoginForm = () => {
		const errors: Partial<LoginFormData> = {}
		const emailError = validateEmail(loginData.email)

		if (emailError) errors.email = emailError
		if (!loginData.password) errors.password = 'Пароль обязателен'

		setLoginErrors(errors)
		return Object.keys(errors).length === 0
	}

	const validateForgotPasswordForm = () => {
		const errors: Partial<ForgotPasswordFormData> = {}
		const emailError = validateEmail(forgotPasswordData.email)

		if (emailError) errors.email = emailError

		setForgotPasswordErrors(errors)
		return Object.keys(errors).length === 0
	}

	const validateResetPasswordForm = () => {
		const errors: Partial<Record<keyof ResetPasswordFormData, string>> = {}
		const passwordError = validatePassword(resetPasswordData.password)

		if (passwordError) errors.password = passwordError
		if (resetPasswordData.password !== resetPasswordData.confirmPassword) {
			errors.confirmPassword = 'Пароли не совпадают'
		}

		setResetPasswordErrors(errors)
		return Object.keys(errors).length === 0
	}

	const validateRegisterForm = () => {
		const errors: Partial<Record<keyof RegisterFormData, string>> = {}
		const emailError = validateEmail(registerData.email)
		const passwordError = validatePassword(registerData.password)

		if (!registerData.firstName.trim()) errors.firstName = 'Имя обязательно'
		if (!registerData.lastName.trim()) errors.lastName = 'Фамилия обязательна'
		if (!registerData.role) errors.role = 'Выберите роль'
		if (emailError) errors.email = emailError
		if (passwordError) errors.password = passwordError
		if (registerData.password !== registerData.confirmPassword) {
			errors.confirmPassword = 'Пароли не совпадают'
		}

		setRegisterErrors(errors)
		return Object.keys(errors).length === 0
	}

	const handleAuthSuccess = async (authData: LoginV2Response) => {
		await onLogin(authData)
		clearRegistrationVerification()
		resetModalState()
		onClose()
	}

	const showLoginAfterVerification = (
		email: string,
		message = 'Email подтвержден. Войдите с вашим паролем.',
	) => {
		clearRegistrationVerification()
		setAuthMode('login')
		setAuthStage('form')
		setLoginData({ ...emptyLoginForm, email })
		setRegisterData(emptyRegisterForm)
		setVerificationCode('')
		setCodeError('')
		setCodeTimer(0)
		setSuccessMessage(message)
	}

	const handleLoginSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		clearMessages()

		if (!validateLoginForm()) return

		setIsSubmitting(true)

		try {
			const authData = await loginV2({
				email: loginData.email.trim(),
				password: loginData.password,
			})
			await handleAuthSuccess(authData)
		} catch (error) {
			setLoginErrors({
				password: (error as Error).message || 'Неверный email или пароль',
			})
		} finally {
			setIsSubmitting(false)
		}
	}

	const handleRegisterSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		clearMessages()

		if (!validateRegisterForm() || !registerData.role) return

		setIsSubmitting(true)

		try {
			const email = registerData.email.trim()

			await registerV2({
				email,
				password: registerData.password,
				firstName: registerData.firstName.trim(),
				lastName: registerData.lastName.trim(),
				role: registerData.role,
			})
			persistRegistrationVerification(email, CODE_TIMER_DURATION)
			setRegisterData(prev => ({ ...prev, email }))
			setLoginData(prev => ({ ...prev, email }))
			setAuthStage('verify')
			setCodeTimer(CODE_TIMER_DURATION)
			setSuccessMessage('Код подтверждения отправлен на почту')
		} catch (error) {
			setGlobalError((error as Error).message || 'Ошибка регистрации')
		} finally {
			setIsSubmitting(false)
		}
	}

	const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		clearMessages()

		if (!validateForgotPasswordForm()) return

		const email = forgotPasswordData.email.trim()
		setIsSubmitting(true)
		setCodeError('')

		try {
			await requestPasswordReset(email)
			setForgotPasswordData({ email })
			setAuthStage('reset-password')
			setCodeTimer(CODE_TIMER_DURATION)
			setSuccessMessage(
				'Если такой email зарегистрирован, код восстановления отправлен на почту',
			)
		} catch (error) {
			setGlobalError((error as Error).message || 'Не удалось отправить код')
		} finally {
			setIsSubmitting(false)
		}
	}

	const handleCodeSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setCodeError('')
		clearMessages()

		if (verificationCode.length !== 6) {
			setCodeError('Введите 6 цифр из письма')
			return
		}

		setIsSubmitting(true)

		try {
			await verifyEmail(activeEmail, verificationCode)

			if (!registerData.password) {
				showLoginAfterVerification(activeEmail)
				return
			}

			try {
				const authData = await loginV2({
					email: activeEmail,
					password: registerData.password,
				})
				await handleAuthSuccess(authData)
			} catch (error) {
				showLoginAfterVerification(
					activeEmail,
					'Email подтвержден. Войдите с вашим паролем.',
				)
				setLoginErrors({
					password: (error as Error).message || 'Введите пароль для входа',
				})
			}
		} catch (error) {
			setCodeError((error as Error).message || 'Не удалось подтвердить email')
		} finally {
			setIsSubmitting(false)
		}
	}

	const handleResetPasswordSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setCodeError('')
		clearMessages()

		if (verificationCode.length !== 6) {
			setCodeError('Введите 6 цифр из письма')
			return
		}

		if (!validateResetPasswordForm()) return

		setIsSubmitting(true)

		try {
			await resetPassword(
				activeEmail,
				verificationCode,
				resetPasswordData.password,
			)
			clearRegistrationVerification()
			setAuthMode('login')
			setAuthStage('form')
			setLoginData({ ...emptyLoginForm, email: activeEmail })
			setForgotPasswordData(emptyForgotPasswordForm)
			setResetPasswordData(emptyResetPasswordForm)
			setVerificationCode('')
			setCodeTimer(0)
			setSuccessMessage('Пароль обновлен. Войдите с новым паролем.')
		} catch (error) {
			setCodeError((error as Error).message || 'Не удалось изменить пароль')
		} finally {
			setIsSubmitting(false)
		}
	}

	const handleResendCode = async () => {
		if (codeTimer > 0 || !activeEmail || isSubmitting) return

		setIsSubmitting(true)
		setCodeError('')
		clearMessages()

		try {
			if (authMode === 'forgot-password') {
				await requestPasswordReset(activeEmail)
			} else {
				await requestCode(activeEmail)
				persistRegistrationVerification(activeEmail, CODE_TIMER_DURATION)
			}
			setCodeTimer(CODE_TIMER_DURATION)
			setSuccessMessage('Новый код отправлен на почту')
		} catch (error) {
			setCodeError((error as Error).message || 'Не удалось отправить код')
		} finally {
			setIsSubmitting(false)
		}
	}

	const formatTimer = (seconds: number) => {
		const mins = Math.floor(seconds / 60)
		const secs = seconds % 60
		return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
	}

	const switchMode = (mode: AuthMode) => {
		if (isSubmitting || authMode === mode) return

		if (isRegistrationVerificationPending) return

		setAuthMode(mode)
		setAuthStage('form')
		setLoginErrors({})
		setRegisterErrors({})
		setForgotPasswordErrors({})
		setResetPasswordErrors({})
		setVerificationCode('')
		setCodeError('')
		clearMessages()
	}

	const openForgotPassword = () => {
		if (isSubmitting) return

		setAuthMode('forgot-password')
		setAuthStage('form')
		setForgotPasswordData({ email: loginData.email.trim() })
		setForgotPasswordErrors({})
		setResetPasswordErrors({})
		setVerificationCode('')
		setCodeError('')
		clearMessages()
	}

	const backToLogin = () => {
		if (isSubmitting) return

		setAuthMode('login')
		setAuthStage('form')
		setLoginData(prev => ({
			...prev,
			email: forgotPasswordData.email || prev.email,
		}))
		setForgotPasswordErrors({})
		setResetPasswordErrors({})
		setVerificationCode('')
		setCodeError('')
		clearMessages()
	}

	const renderCloseButton = () => {
		if (!isClosable) return null

		return (
			<button
				type='button'
				className={styles.closeButton}
				onClick={handleClose}
				aria-label='Закрыть'
				disabled={!canClose}
			>
				×
			</button>
		)
	}

	const renderTabs = () => (
		<div className={styles.authTabs}>
			<button
				type='button'
				className={`${styles.authTab} ${authMode === 'login' ? styles.active : ''}`}
				onClick={() => switchMode('login')}
			>
				Вход
			</button>
			<button
				type='button'
				className={`${styles.authTab} ${authMode === 'register' ? styles.active : ''}`}
				onClick={() => switchMode('register')}
			>
				Регистрация
			</button>
		</div>
	)

	const renderRoleSelect = () => (
		<div className={styles.roleOptions}>
			<button
				type='button'
				className={`${styles.roleCard} ${registerData.role === 'tutor' ? styles.selected : ''}`}
				onClick={() => {
					setRegisterData(prev => ({ ...prev, role: 'tutor' }))
					setRegisterErrors(prev => ({ ...prev, role: undefined }))
					clearMessages()
				}}
			>
				<h4 className={styles.roleTitle}>Репетитор</h4>
				<p className={styles.roleDescription}>
					Хочу преподавать и вести учеников
				</p>
			</button>
			<button
				type='button'
				className={`${styles.roleCard} ${registerData.role === 'student_or_parent' ? styles.selected : ''}`}
				onClick={() => {
					setRegisterData(prev => ({ ...prev, role: 'student_or_parent' }))
					setRegisterErrors(prev => ({ ...prev, role: undefined }))
					clearMessages()
				}}
			>
				<h4 className={styles.roleTitle}>Ученик или родитель</h4>
				<p className={styles.roleDescription}>Хочу найти репетитора</p>
			</button>
			{registerErrors.role && (
				<span className={styles.errorMessage}>{registerErrors.role}</span>
			)}
		</div>
	)

	const renderLoginForm = () => (
		<form
			onSubmit={handleLoginSubmit}
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
					className={`${styles.formInput} ${loginErrors.email ? styles.inputError : ''}`}
					value={loginData.email}
					onChange={e => {
						setLoginData(prev => ({ ...prev, email: e.target.value }))
						setLoginErrors(prev => ({ ...prev, email: undefined }))
						clearMessages()
					}}
					placeholder='name@example.com'
					autoComplete='email'
					disabled={isSubmitting}
				/>
				{loginErrors.email && (
					<span className={styles.errorMessage}>{loginErrors.email}</span>
				)}
			</div>
			<div className={styles.formGroup}>
				<label htmlFor='login-password' className={styles.formLabel}>
					Пароль
				</label>
				<input
					id='login-password'
					type='password'
					className={`${styles.formInput} ${loginErrors.password ? styles.inputError : ''}`}
					value={loginData.password}
					onChange={e => {
						setLoginData(prev => ({ ...prev, password: e.target.value }))
						setLoginErrors(prev => ({ ...prev, password: undefined }))
						clearMessages()
					}}
					placeholder='Введите пароль'
					autoComplete='current-password'
					disabled={isSubmitting}
				/>
				{loginErrors.password && (
					<span className={styles.errorMessage}>{loginErrors.password}</span>
				)}
			</div>
			<button
				type='submit'
				className={styles.submitButton}
				disabled={isSubmitting}
			>
				{submitButtonText}
			</button>
			<button
				type='button'
				className={styles.textButton}
				onClick={openForgotPassword}
				disabled={isSubmitting}
			>
				Забыли пароль?
			</button>
		</form>
	)

	const renderForgotPasswordForm = () => (
		<form
			onSubmit={handleForgotPasswordSubmit}
			className={styles.migrationForm}
			noValidate
		>
			<p className={styles.description}>
				Укажите email аккаунта, и мы отправим код для восстановления пароля.
			</p>
			<div className={styles.formGroup}>
				<label htmlFor='forgot-email' className={styles.formLabel}>
					Email
				</label>
				<input
					id='forgot-email'
					type='email'
					className={`${styles.formInput} ${forgotPasswordErrors.email ? styles.inputError : ''}`}
					value={forgotPasswordData.email}
					onChange={e => {
						setForgotPasswordData({ email: e.target.value })
						setForgotPasswordErrors({})
						clearMessages()
					}}
					placeholder='name@example.com'
					autoComplete='email'
					disabled={isSubmitting}
				/>
				{forgotPasswordErrors.email && (
					<span className={styles.errorMessage}>
						{forgotPasswordErrors.email}
					</span>
				)}
			</div>
			<button
				type='submit'
				className={styles.submitButton}
				disabled={isSubmitting}
			>
				{isSubmitting ? 'Отправляем...' : 'Получить код'}
			</button>
			<button
				type='button'
				className={styles.backButton}
				onClick={backToLogin}
				disabled={isSubmitting}
			>
				Вернуться ко входу
			</button>
		</form>
	)

	const renderRegisterForm = () => (
		<form
			onSubmit={handleRegisterSubmit}
			className={styles.migrationForm}
			noValidate
		>
			{renderRoleSelect()}
			<div className={styles.nameGrid}>
				<div className={styles.formGroup}>
					<label htmlFor='register-first-name' className={styles.formLabel}>
						Имя
					</label>
					<input
						id='register-first-name'
						type='text'
						className={`${styles.formInput} ${registerErrors.firstName ? styles.inputError : ''}`}
						value={registerData.firstName}
						onChange={e => {
							setRegisterData(prev => ({
								...prev,
								firstName: e.target.value,
							}))
							setRegisterErrors(prev => ({ ...prev, firstName: undefined }))
							clearMessages()
						}}
						placeholder='Иван'
						autoComplete='given-name'
						disabled={isSubmitting}
					/>
					{registerErrors.firstName && (
						<span className={styles.errorMessage}>
							{registerErrors.firstName}
						</span>
					)}
				</div>
				<div className={styles.formGroup}>
					<label htmlFor='register-last-name' className={styles.formLabel}>
						Фамилия
					</label>
					<input
						id='register-last-name'
						type='text'
						className={`${styles.formInput} ${registerErrors.lastName ? styles.inputError : ''}`}
						value={registerData.lastName}
						onChange={e => {
							setRegisterData(prev => ({
								...prev,
								lastName: e.target.value,
							}))
							setRegisterErrors(prev => ({ ...prev, lastName: undefined }))
							clearMessages()
						}}
						placeholder='Иванов'
						autoComplete='family-name'
						disabled={isSubmitting}
					/>
					{registerErrors.lastName && (
						<span className={styles.errorMessage}>
							{registerErrors.lastName}
						</span>
					)}
				</div>
			</div>
			<div className={styles.formGroup}>
				<label htmlFor='register-email' className={styles.formLabel}>
					Email
				</label>
				<input
					id='register-email'
					type='email'
					className={`${styles.formInput} ${registerErrors.email ? styles.inputError : ''}`}
					value={registerData.email}
					onChange={e => {
						setRegisterData(prev => ({ ...prev, email: e.target.value }))
						setRegisterErrors(prev => ({ ...prev, email: undefined }))
						clearMessages()
					}}
					placeholder='name@example.com'
					autoComplete='email'
					disabled={isSubmitting}
				/>
				{registerErrors.email && (
					<span className={styles.errorMessage}>{registerErrors.email}</span>
				)}
			</div>
			<div className={styles.formGroup}>
				<label htmlFor='register-password' className={styles.formLabel}>
					Пароль
				</label>
				<input
					id='register-password'
					type='password'
					className={`${styles.formInput} ${registerErrors.password ? styles.inputError : ''}`}
					value={registerData.password}
					onChange={e => {
						setRegisterData(prev => ({ ...prev, password: e.target.value }))
						setRegisterErrors(prev => ({ ...prev, password: undefined }))
						clearMessages()
					}}
					placeholder='Введите пароль'
					autoComplete='new-password'
					disabled={isSubmitting}
				/>
				{registerErrors.password && (
					<span className={styles.errorMessage}>{registerErrors.password}</span>
				)}
				<p className={styles.passwordHint}>
					Минимум 8 символов, одна заглавная буква, одна строчная буква и одна
					цифра.
				</p>
			</div>
			<div className={styles.formGroup}>
				<label htmlFor='register-confirm-password' className={styles.formLabel}>
					Повторите пароль
				</label>
				<input
					id='register-confirm-password'
					type='password'
					className={`${styles.formInput} ${registerErrors.confirmPassword ? styles.inputError : ''}`}
					value={registerData.confirmPassword}
					onChange={e => {
						setRegisterData(prev => ({
							...prev,
							confirmPassword: e.target.value,
						}))
						setRegisterErrors(prev => ({
							...prev,
							confirmPassword: undefined,
						}))
						clearMessages()
					}}
					placeholder='Повторите пароль'
					autoComplete='new-password'
					disabled={isSubmitting}
				/>
				{registerErrors.confirmPassword && (
					<span className={styles.errorMessage}>
						{registerErrors.confirmPassword}
					</span>
				)}
			</div>
			<button
				type='submit'
				className={styles.submitButton}
				disabled={isSubmitting}
			>
				{submitButtonText}
			</button>
		</form>
	)

	const renderPasswordResetForm = () => (
		<form
			onSubmit={handleResetPasswordSubmit}
			className={styles.codeForm}
			noValidate
		>
			<p className={styles.description}>
				Введите код из письма для <strong>{activeEmail}</strong> и задайте новый
				пароль.
			</p>
			<div className={styles.formGroup}>
				<label htmlFor='password-reset-code' className={styles.formLabel}>
					Код из письма
				</label>
				<input
					id='password-reset-code'
					type='text'
					inputMode='numeric'
					pattern='[0-9]*'
					maxLength={6}
					className={`${styles.formInput} ${styles.codeInput} ${codeError ? styles.inputError : ''}`}
					value={verificationCode}
					onChange={e => {
						setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))
						setCodeError('')
						clearMessages()
					}}
					placeholder='000000'
					autoComplete='one-time-code'
					disabled={isSubmitting}
					autoFocus
				/>
				{codeError && <span className={styles.errorMessage}>{codeError}</span>}
			</div>
			<div className={styles.formGroup}>
				<label htmlFor='reset-password' className={styles.formLabel}>
					Новый пароль
				</label>
				<input
					id='reset-password'
					type='password'
					className={`${styles.formInput} ${resetPasswordErrors.password ? styles.inputError : ''}`}
					value={resetPasswordData.password}
					onChange={e => {
						setResetPasswordData(prev => ({
							...prev,
							password: e.target.value,
						}))
						setResetPasswordErrors(prev => ({ ...prev, password: undefined }))
						clearMessages()
					}}
					placeholder='Введите новый пароль'
					autoComplete='new-password'
					disabled={isSubmitting}
				/>
				{resetPasswordErrors.password && (
					<span className={styles.errorMessage}>
						{resetPasswordErrors.password}
					</span>
				)}
				<p className={styles.passwordHint}>
					Минимум 8 символов, одна заглавная буква, одна строчная буква и одна
					цифра.
				</p>
			</div>
			<div className={styles.formGroup}>
				<label htmlFor='reset-confirm-password' className={styles.formLabel}>
					Повторите пароль
				</label>
				<input
					id='reset-confirm-password'
					type='password'
					className={`${styles.formInput} ${resetPasswordErrors.confirmPassword ? styles.inputError : ''}`}
					value={resetPasswordData.confirmPassword}
					onChange={e => {
						setResetPasswordData(prev => ({
							...prev,
							confirmPassword: e.target.value,
						}))
						setResetPasswordErrors(prev => ({
							...prev,
							confirmPassword: undefined,
						}))
						clearMessages()
					}}
					placeholder='Повторите новый пароль'
					autoComplete='new-password'
					disabled={isSubmitting}
				/>
				{resetPasswordErrors.confirmPassword && (
					<span className={styles.errorMessage}>
						{resetPasswordErrors.confirmPassword}
					</span>
				)}
			</div>
			<button
				type='submit'
				className={styles.submitButton}
				disabled={isSubmitting || verificationCode.length !== 6}
			>
				{isSubmitting ? 'Сохраняем...' : 'Сохранить пароль'}
			</button>
			<div className={styles.timerSection}>
				{codeTimer > 0 ? (
					<p className={styles.timerText}>
						Повторная отправка через{' '}
						<span className={styles.timerValue}>{formatTimer(codeTimer)}</span>
					</p>
				) : (
					<button
						type='button'
						className={styles.resendButton}
						onClick={handleResendCode}
						disabled={isSubmitting}
					>
						Отправить код еще раз
					</button>
				)}
			</div>
			<button
				type='button'
				className={styles.backButton}
				onClick={backToLogin}
				disabled={isSubmitting}
			>
				Вернуться ко входу
			</button>
		</form>
	)

	const renderCodeVerification = () => (
		<form onSubmit={handleCodeSubmit} className={styles.codeForm} noValidate>
			<p className={styles.description}>
				Код подтверждения отправлен на <strong>{activeEmail}</strong>
			</p>
			<div className={styles.formGroup}>
				<label htmlFor='verification-code' className={styles.formLabel}>
					Код из письма
				</label>
				<input
					id='verification-code'
					type='text'
					inputMode='numeric'
					pattern='[0-9]*'
					maxLength={6}
					className={`${styles.formInput} ${styles.codeInput} ${codeError ? styles.inputError : ''}`}
					value={verificationCode}
					onChange={e => {
						setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))
						setCodeError('')
						clearMessages()
					}}
					placeholder='000000'
					autoComplete='one-time-code'
					disabled={isSubmitting}
					autoFocus
				/>
				{codeError && <span className={styles.errorMessage}>{codeError}</span>}
			</div>
			<button
				type='submit'
				className={styles.submitButton}
				disabled={isSubmitting || verificationCode.length !== 6}
			>
				{isSubmitting ? 'Проверяем...' : 'Подтвердить'}
			</button>
			<div className={styles.timerSection}>
				{codeTimer > 0 ? (
					<p className={styles.timerText}>
						Повторная отправка через{' '}
						<span className={styles.timerValue}>{formatTimer(codeTimer)}</span>
					</p>
				) : (
					<button
						type='button'
						className={styles.resendButton}
						onClick={handleResendCode}
						disabled={isSubmitting}
					>
						Отправить код еще раз
					</button>
				)}
			</div>
			<button
				type='button'
				className={styles.backButton}
				onClick={() => {
					clearRegistrationVerification()
					setAuthStage('form')
					setAuthMode('register')
					setVerificationCode('')
					setCodeError('')
					setCodeTimer(0)
					clearMessages()
				}}
				disabled={isSubmitting}
			>
				Изменить данные
			</button>
		</form>
	)

	return (
		<>
			<div
				className={styles.overlay}
				onClick={canClose ? handleClose : undefined}
				style={{ cursor: canClose ? 'pointer' : 'default' }}
			/>
			<div className={styles.modal}>
				<div className={styles.modalHeader}>
					<h3 className={styles.modalTitle}>
						{authStage === 'verify'
							? 'Подтвердите email'
							: authMode === 'login'
								? 'Вход'
								: authMode === 'register'
									? 'Регистрация'
									: 'Восстановление пароля'}
					</h3>
					{renderCloseButton()}
				</div>
				<div className={styles.modalContent}>
					{authStage === 'form' &&
						authMode !== 'forgot-password' &&
						renderTabs()}
					{globalError && (
						<div className={styles.globalError}>{globalError}</div>
					)}
					{successMessage && (
						<div className={styles.successMessage}>{successMessage}</div>
					)}
					{authStage === 'verify'
						? renderCodeVerification()
						: authMode === 'forgot-password'
							? authStage === 'reset-password'
								? renderPasswordResetForm()
								: renderForgotPasswordForm()
							: authMode === 'login'
								? renderLoginForm()
								: renderRegisterForm()}
					{authStage === 'form' && authMode !== 'forgot-password' && (
						<p className={styles.privacyText}>
							Нажимая кнопку, вы соглашаетесь с обработкой персональных данных.
						</p>
					)}
				</div>
			</div>
		</>
	)
}

export default LoginModal
