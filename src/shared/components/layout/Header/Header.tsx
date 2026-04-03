'use client'

import type React from 'react'
import { useState, useEffect } from 'react'
// @ts-ignore
import styles from './Header.module.scss'
// @ts-ignore
import logoImage from '@icons/book.svg'
import { useNavigate } from 'react-router'
import { LoginModal } from './LoginModal'
import type { TelegramUser } from '@components/auth/TelegramLoginButton'
import { useSSE } from '../../../sse/SSEComponent/SSEContext'

export interface HeaderProps {
	isAuthenticated?: boolean
	userName?: string
	userAvatar?: string
	userRole?: 'tutor' | 'student_or_parent' | 'admin' | null
	onLogin?: (
		role: 'tutor' | 'student_or_parent' | 'admin',
		telegramData: TelegramUser,
	) => void | Promise<void>
	onLogout?: () => void
}

export const Header: React.FC<HeaderProps> = ({
	isAuthenticated = false,
	userName = 'Пользователь',
	userAvatar,
	userRole: userRoleProp,
	onLogin,
	onLogout,
}) => {
	const [isMenuOpen, setIsMenuOpen] = useState(false)
	const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
	const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false)

	const [userRole, setUserRole] = useState<
		'tutor' | 'student_or_parent' | 'admin' | null | undefined
	>(userRoleProp)

	const { sseData } = useSSE()
	const globalNotificationCount = sseData.globalNotificationCount

	const navigate = useNavigate()

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			const target = event.target as HTMLElement
			if (
				isProfileDropdownOpen &&
				!target.closest(`.${styles.profileContainer}`)
			) {
				setIsProfileDropdownOpen(false)
			}
			if (
				isMenuOpen &&
				!target.closest(`.${styles.menuButton}`) &&
				!target.closest(`.${styles.dropdownMenu}`)
			) {
				setIsMenuOpen(false)
			}
		}

		if (isProfileDropdownOpen || isMenuOpen) {
			document.addEventListener('mousedown', handleClickOutside)
			return () => document.removeEventListener('mousedown', handleClickOutside)
		}
	}, [isProfileDropdownOpen, isMenuOpen])

	useEffect(() => {
		if (!userRoleProp) {
			try {
				const storedRole = localStorage.getItem('role') as
					| 'tutor'
					| 'student_or_parent'
					| 'admin'
					| null
				if (storedRole) {
					setUserRole(storedRole)
				}
			} catch (error) {
				console.error('Error reading role from localStorage:', error)
			}
		} else {
			setUserRole(userRoleProp)
		}
	}, [userRoleProp])

	const toggleMenu = () => {
		setIsProfileDropdownOpen(false)
		setIsMenuOpen(prev => !prev)
	}

	const toggleProfileDropdown = () => {
		setIsMenuOpen(false)
		setIsProfileDropdownOpen(prev => !prev)
	}

	const handleLogin = () => {
		setIsMenuOpen(false)
		setIsProfileDropdownOpen(false)
		setIsLoginModalOpen(true)
	}

	const handleLoginWithTelegram = (
		role: 'tutor' | 'student_or_parent' | 'admin',
		telegramData: TelegramUser,
	) => {
		setIsLoginModalOpen(false)
		onLogin?.(role, telegramData)
	}

	const handleLogout = () => {
		setIsMenuOpen(false)
		setIsProfileDropdownOpen(false)
		onLogout?.()
	}

	const handleLogoClick = () => {
		navigate('/')
	}

	const scrollToSection = (sectionId: string) => {
		const element = document.getElementById(sectionId)
		if (element) {
			element.scrollIntoView({ behavior: 'smooth', block: 'start' })
		}
		setIsMenuOpen(false)
	}

	const navigateToPage = (path: string) => {
		navigate(path)
		setIsMenuOpen(false)
		setIsProfileDropdownOpen(false)
	}
	const getRoleLabel = () => {
		if (userRole === 'tutor') return 'Репетитор'
		if (userRole === 'student_or_parent') return 'Ученик/Родитель'
		if (userRole === 'admin') return 'Администратор'
		return ''
	}

	return (
		<header className={styles.header}>
			<div className={styles.container}>
				<div className={styles.leftSection}>
					<div className={styles.logo} onClick={handleLogoClick}>
						<img
							src={logoImage || '/placeholder.svg'}
							alt='Уголок репетитора'
						/>
					</div>
					<nav className={styles.nav}>
						<button onClick={handleLogoClick} className={styles.navLink}>
							Уголок репетитора
						</button>
					</nav>
				</div>

				<nav className={styles.centerNav}>
					{isAuthenticated ? (
						<>
							<button
								onClick={() =>
									navigateToPage(userRole === 'admin' ? '/admin' : '/schedule')
								}
								className={styles.centerNavLink}
							>
								Расписание
							</button>
							<button
								onClick={() =>
									navigateToPage(
										userRole === 'admin' ? '/tutor-student-link' : '/students',
									)
								}
								className={styles.centerNavLink}
							>
								{userRole === 'tutor'
									? 'Мои ученики'
									: userRole === 'admin'
										? 'Связи'
										: 'Мои репетиторы'}
							</button>
							<button
								onClick={() =>
									navigateToPage(
										userRole === 'admin' ? '/all-statistic' : '/statistic',
									)
								}
								className={styles.centerNavLink}
							>
								Статистика
							</button>
							<button
								onClick={() =>
									navigateToPage(
										userRole === 'admin' ? '/all-message' : '/messages',
									)
								}
								className={`${styles.centerNavLink} ${styles.notificationButton}`}
							>
								Сообщения
								{globalNotificationCount > 0 && (
									<span className={styles.notificationBadge}>
										{globalNotificationCount}
									</span>
								)}
							</button>
						</>
					) : (
						<>
							<button
								onClick={() => scrollToSection('features')}
								className={styles.centerNavLink}
							>
								Возможности
							</button>
							<button
								onClick={() => scrollToSection('pricing')}
								className={styles.centerNavLink}
							>
								Тарифы
							</button>
							<button
								onClick={() => scrollToSection('testimonials')}
								className={styles.centerNavLink}
							>
								Отзывы
							</button>
							<button
								onClick={() => scrollToSection('faq')}
								className={styles.centerNavLink}
							>
								Вопросы
							</button>
						</>
					)}
				</nav>

				<button
					className={styles.menuButton}
					onClick={toggleMenu}
					aria-label='Меню'
					aria-expanded={isMenuOpen}
				>
					<span className={styles.menuIcon}></span>
					<span className={styles.menuIcon}></span>
					<span className={styles.menuIcon}></span>
				</button>

				<div className={styles.rightSection}>
					{isAuthenticated ? (
						<div className={styles.profileContainer}>
							<div
								className={styles.userAvatar}
								onClick={toggleProfileDropdown}
								role='button'
								tabIndex={0}
								aria-expanded={isProfileDropdownOpen}
								aria-label='Меню профиля'
							>
								{userAvatar ? (
									<img
										src={userAvatar || '/placeholder.svg'}
										alt='User Avatar'
									/>
								) : (
									<div className={styles.avatarPlaceholder}>
										{userName.charAt(0).toUpperCase()}
									</div>
								)}
							</div>

							{isProfileDropdownOpen && (
								<div className={styles.profileDropdown}>
									<div className={styles.userInfoMenu}>
										<div className={styles.userAvatar}>
											{userAvatar ? (
												<img
													src={userAvatar || '/placeholder.svg'}
													alt={userName}
												/>
											) : (
												<div className={styles.avatarPlaceholder}>
													{userName.charAt(0).toUpperCase()}
												</div>
											)}
										</div>
										<span className={styles.userName}>
											{userName} ({getRoleLabel()})
										</span>
									</div>

									<div className={styles.menuDividerBlue} />

									<button
										onClick={() => navigateToPage('/profile')}
										className={styles.mobileNavLink}
									>
										Мой профиль
									</button>
									{userRole === 'admin' && (
										<>
											<button
												onClick={() => navigateToPage('/admin/users')}
												className={styles.mobileNavLink}
											>
												Пользователи
											</button>
											<button
												onClick={() => navigateToPage('/admin/parent-links')}
												className={styles.mobileNavLink}
											>
												Родители
											</button>
										</>
									)}
									<div className={styles.menuDivider} />

									<button
										onClick={handleLogout}
										className={styles.dropdownLogoutButton}
									>
										Выйти
									</button>
								</div>
							)}
						</div>
					) : (
						<button className={styles.loginButton} onClick={handleLogin}>
							Войти
						</button>
					)}
				</div>
			</div>

			{isMenuOpen && (
				<>
					<div className={styles.overlay} onClick={toggleMenu} />

					<div className={styles.dropdownMenu}>
						<nav className={styles.mobileNav}>
							{isAuthenticated ? (
								<>
									<div className={styles.userInfoMenu}>
										<div className={styles.userAvatar}>
											{userAvatar ? (
												<img
													src={userAvatar || '/placeholder.svg'}
													alt={userName}
												/>
											) : (
												<div className={styles.avatarPlaceholder}>
													{userName.charAt(0).toUpperCase()}
												</div>
											)}
										</div>
										<span className={styles.userName}>
											{userName} ({getRoleLabel()})
										</span>
									</div>

									<div className={styles.menuDividerBlue} />

									<button
										onClick={() =>
											navigateToPage(
												userRole === 'admin' ? '/admin' : '/schedule',
											)
										}
										className={styles.mobileNavLink}
									>
										Расписание
									</button>
									<button
										onClick={() =>
											navigateToPage(
												userRole === 'admin'
													? '/tutor-student-link'
													: '/students',
											)
										}
										className={styles.mobileNavLink}
									>
										{userRole === 'tutor'
											? 'Мои ученики'
											: userRole === 'admin'
												? 'Связи'
												: 'Мои репетиторы'}
									</button>
									<button
										onClick={() =>
											navigateToPage(
												userRole === 'admin' ? '/all-statistic' : '/statistic',
											)
										}
										className={styles.mobileNavLink}
									>
										Статистика
									</button>
									<button
										onClick={() =>
											navigateToPage(
												userRole === 'admin' ? '/all-message' : '/messages',
											)
										}
										className={`${styles.mobileNavLink} ${styles.mobileNotificationButton}`}
									>
										Сообщения
										{globalNotificationCount > 0 && (
											<span className={styles.mobileNotificationBadge}>
												{globalNotificationCount}
											</span>
										)}
									</button>

									<div className={styles.menuDivider} />

									<button
										onClick={() => navigateToPage('/profile')}
										className={styles.mobileNavLink}
									>
										Мой профиль
									</button>
									{userRole === 'admin' && (
										<>
											<button
												onClick={() => navigateToPage('/admin/users')}
												className={styles.mobileNavLink}
											>
												Пользователи
											</button>
											<button
												onClick={() => navigateToPage('/admin/parent-links')}
												className={styles.mobileNavLink}
											>
												Родители
											</button>
										</>
									)}

									{/* Кнопка Выйти */}
									<button
										className={styles.logoutButton}
										onClick={handleLogout}
									>
										Выйти
									</button>
								</>
							) : (
								<>
									<button
										className={styles.loginMenuItem}
										onClick={handleLogin}
									>
										Войти
									</button>

									<div className={styles.menuDividerBlue} />

									<button
										onClick={() => scrollToSection('features')}
										className={styles.mobileNavLink}
									>
										Возможности
									</button>
									<button
										onClick={() => scrollToSection('pricing')}
										className={styles.mobileNavLink}
									>
										Тарифы
									</button>
									<button
										onClick={() => scrollToSection('testimonials')}
										className={styles.mobileNavLink}
									>
										Отзывы
									</button>
									<button
										onClick={() => scrollToSection('faq')}
										className={styles.mobileNavLink}
									>
										Вопросы
									</button>
								</>
							)}
						</nav>
					</div>
				</>
			)}

			<LoginModal
				isOpen={isLoginModalOpen}
				onClose={() => setIsLoginModalOpen(false)}
				onLogin={handleLoginWithTelegram}
			/>
		</header>
	)
}
