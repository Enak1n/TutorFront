import type React from 'react'
import { useEffect, useRef, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
// @ts-ignore
import styles from './Header.module.scss'
// @ts-ignore
import logoImage from '@icons/book.svg'
import { hasPendingRegistrationVerification, LoginModal } from './LoginModal'
import type { LoginV2Response } from '@api/auth'
import { useSSE } from '../../../sse/SSEComponent/SSEContext'
import { ThemeToggle } from '../../../theme/ThemeToggle'

type UserRole = 'tutor' | 'student_or_parent' | 'admin'

export interface HeaderProps {
	isAuthenticated?: boolean
	userName?: string
	userAvatar?: string
	userRole?: UserRole | null
	onLogin?: (authData: LoginV2Response) => void | Promise<void>
	onLogout?: () => void
}

interface NavItem {
	label: string
	to: string
	badge?: number
}

const ROLE_LABELS: Record<UserRole, string> = {
	tutor: 'Репетитор',
	student_or_parent: 'Ученик / родитель',
	admin: 'Администратор',
}

const LANDING_SECTIONS = [
	{ id: 'features', label: 'Возможности' },
	{ id: 'pricing', label: 'Тарифы' },
	{ id: 'testimonials', label: 'Отзывы' },
	{ id: 'faq', label: 'Вопросы' },
]

const getMainNav = (role: UserRole | null, unread: number): NavItem[] => {
	const isAdmin = role === 'admin'

	return [
		{ label: 'Расписание', to: isAdmin ? '/admin' : '/schedule' },
		{
			label: isAdmin ? 'Связи' : role === 'tutor' ? 'Мои ученики' : 'Мои репетиторы',
			to: isAdmin ? '/tutor-student-link' : '/students',
		},
		{ label: 'Статистика', to: isAdmin ? '/all-statistic' : '/statistic' },
		{ label: 'Сообщения', to: isAdmin ? '/all-message' : '/messages', badge: unread },
	]
}

const getProfileNav = (role: UserRole | null): NavItem[] => [
	{ label: 'Мой профиль', to: '/profile' },
	...(role === 'admin'
		? [
				{ label: 'Пользователи', to: '/admin/users' },
				{ label: 'Родители', to: '/admin/parent-links' },
			]
		: []),
]

const Avatar = ({ src, name, size = 'md' }: { src?: string; name: string; size?: 'md' | 'lg' }) => (
	<span className={`${styles.avatar} ${size === 'lg' ? styles.avatarLg : ''}`}>
		{src ? <img src={src} alt={name} /> : <span>{(name.trim()[0] ?? '?').toUpperCase()}</span>}
	</span>
)

const Badge = ({ count }: { count?: number }) =>
	count && count > 0 ? <span className={styles.badge}>{count > 99 ? '99+' : count}</span> : null

export const Header: React.FC<HeaderProps> = ({
	isAuthenticated = false,
	userName = 'Пользователь',
	userAvatar,
	userRole = null,
	onLogin,
	onLogout,
}) => {
	const [isMenuOpen, setIsMenuOpen] = useState(false)
	const [isProfileOpen, setIsProfileOpen] = useState(false)
	const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
	const [loginModalMode, setLoginModalMode] = useState<'login' | 'register'>('login')
	const [isScrolled, setIsScrolled] = useState(false)

	const profileRef = useRef<HTMLDivElement>(null)
	const navigate = useNavigate()
	const location = useLocation()
	const { sseData } = useSSE()

	const role = (userRole ?? null) as UserRole | null
	const displayName = userName.trim() || 'Пользователь'
	const mainNav = getMainNav(role, sseData.globalNotificationCount)
	const profileNav = getProfileNav(role)

	const openAuth = (mode: 'login' | 'register') => {
		setIsMenuOpen(false)
		setIsProfileOpen(false)
		setLoginModalMode(mode)
		setIsLoginModalOpen(true)
	}

	// Закрываем меню при переходе на другую страницу.
	useEffect(() => {
		setIsMenuOpen(false)
		setIsProfileOpen(false)
	}, [location.pathname])

	useEffect(() => {
		const onScroll = () => setIsScrolled(window.scrollY > 4)
		onScroll()
		window.addEventListener('scroll', onScroll, { passive: true })
		return () => window.removeEventListener('scroll', onScroll)
	}, [])

	useEffect(() => {
		if (!isProfileOpen) return

		const onPointerDown = (event: MouseEvent) => {
			if (!profileRef.current?.contains(event.target as Node)) setIsProfileOpen(false)
		}
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') setIsProfileOpen(false)
		}

		document.addEventListener('mousedown', onPointerDown)
		document.addEventListener('keydown', onKeyDown)
		return () => {
			document.removeEventListener('mousedown', onPointerDown)
			document.removeEventListener('keydown', onKeyDown)
		}
	}, [isProfileOpen])

	useEffect(() => {
		document.body.style.overflow = isMenuOpen ? 'hidden' : ''
		return () => {
			document.body.style.overflow = ''
		}
	}, [isMenuOpen])

	useEffect(() => {
		if (!isAuthenticated && hasPendingRegistrationVerification()) {
			openAuth('register')
		}
	}, [isAuthenticated])

	useEffect(() => {
		const handleOpenAuthModal = (event: Event) => {
			const mode = (event as CustomEvent<{ mode?: 'login' | 'register' }>).detail?.mode ?? 'login'
			openAuth(mode)
		}

		window.addEventListener('openAuthModal', handleOpenAuthModal)
		return () => window.removeEventListener('openAuthModal', handleOpenAuthModal)
	}, [])

	const handleLoginSuccess = (authData: LoginV2Response) => {
		setIsLoginModalOpen(false)
		return onLogin?.(authData)
	}

	const handleLogout = () => {
		setIsMenuOpen(false)
		setIsProfileOpen(false)
		onLogout?.()
	}

	const scrollToSection = (sectionId: string) => {
		setIsMenuOpen(false)
		if (location.pathname !== '/') {
			navigate('/')
			setTimeout(() => document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' }), 100)
			return
		}
		document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
	}

	const navLinkClass = ({ isActive }: { isActive: boolean }) =>
		`${styles.navLink} ${isActive ? styles.navLinkActive : ''}`

	const drawerLinkClass = ({ isActive }: { isActive: boolean }) =>
		`${styles.drawerLink} ${isActive ? styles.drawerLinkActive : ''}`

	return (
		<>
			<header className={`${styles.header} ${isScrolled ? styles.headerScrolled : ''}`}>
				<div className={styles.container}>
					<button type='button' className={styles.brand} onClick={() => navigate('/')}>
						<span className={styles.brandMark}>
							<img src={logoImage} alt='' />
						</span>
						<span className={styles.brandName}>Уголок репетитора</span>
					</button>

					<nav className={styles.nav} aria-label='Основная навигация'>
						{isAuthenticated
							? mainNav.map(item => (
									<NavLink key={item.to} to={item.to} end={item.to === '/admin'} className={navLinkClass}>
										{item.label}
										<Badge count={item.badge} />
									</NavLink>
								))
							: LANDING_SECTIONS.map(section => (
									<button
										key={section.id}
										type='button'
										className={styles.navLink}
										onClick={() => scrollToSection(section.id)}
									>
										{section.label}
									</button>
								))}
					</nav>

					<div className={styles.actions}>
						<ThemeToggle />

						{isAuthenticated ? (
							<div className={styles.profile} ref={profileRef}>
								<button
									type='button'
									className={styles.profileTrigger}
									onClick={() => setIsProfileOpen(open => !open)}
									aria-expanded={isProfileOpen}
									aria-haspopup='menu'
									aria-label='Меню профиля'
								>
									<Avatar src={userAvatar} name={displayName} />
								</button>

								{isProfileOpen && (
									<div className={styles.profileMenu} role='menu'>
										<div className={styles.profileHeader}>
											<Avatar src={userAvatar} name={displayName} size='lg' />
											<div className={styles.profileText}>
												<span className={styles.profileName}>{displayName}</span>
												{role && <span className={styles.profileRole}>{ROLE_LABELS[role]}</span>}
											</div>
										</div>

										<div className={styles.menuDivider} />

										{profileNav.map(item => (
											<NavLink key={item.to} to={item.to} className={styles.menuItem} role='menuitem'>
												{item.label}
											</NavLink>
										))}

										<div className={styles.menuDivider} />

										<button
											type='button'
											className={`${styles.menuItem} ${styles.menuItemDanger}`}
											onClick={handleLogout}
											role='menuitem'
										>
											Выйти
										</button>
									</div>
								)}
							</div>
						) : (
							<div className={styles.authButtons}>
								<button type='button' className={styles.ghostButton} onClick={() => openAuth('login')}>
									Войти
								</button>
								<button type='button' className={styles.primaryButton} onClick={() => openAuth('register')}>
									Регистрация
								</button>
							</div>
						)}

						<button
							type='button'
							className={`${styles.burger} ${isMenuOpen ? styles.burgerOpen : ''}`}
							onClick={() => setIsMenuOpen(open => !open)}
							aria-label={isMenuOpen ? 'Закрыть меню' : 'Открыть меню'}
							aria-expanded={isMenuOpen}
						>
							<span />
							<span />
							<span />
						</button>
					</div>
				</div>
			</header>

			{/* Вне <header>: у шапки есть backdrop-filter, и fixed-элементы внутри неё обрезались бы её размерами. */}
			<div
				className={`${styles.drawerOverlay} ${isMenuOpen ? styles.drawerOverlayVisible : ''}`}
				onClick={() => setIsMenuOpen(false)}
				aria-hidden='true'
			/>

			<aside className={`${styles.drawer} ${isMenuOpen ? styles.drawerOpen : ''}`} aria-hidden={!isMenuOpen}>
				{isAuthenticated ? (
					<>
						<div className={styles.drawerUser}>
							<Avatar src={userAvatar} name={displayName} size='lg' />
							<div className={styles.profileText}>
								<span className={styles.profileName}>{displayName}</span>
								{role && <span className={styles.profileRole}>{ROLE_LABELS[role]}</span>}
							</div>
						</div>

						<nav className={styles.drawerNav}>
							{mainNav.map(item => (
								<NavLink key={item.to} to={item.to} end={item.to === '/admin'} className={drawerLinkClass}>
									{item.label}
									<Badge count={item.badge} />
								</NavLink>
							))}

							<div className={styles.menuDivider} />

							{profileNav.map(item => (
								<NavLink key={item.to} to={item.to} className={drawerLinkClass}>
									{item.label}
								</NavLink>
							))}
						</nav>

						<button type='button' className={styles.drawerLogout} onClick={handleLogout}>
							Выйти
						</button>
					</>
				) : (
					<>
						<div className={styles.drawerAuth}>
							<button type='button' className={styles.primaryButton} onClick={() => openAuth('register')}>
								Регистрация
							</button>
							<button type='button' className={styles.ghostButton} onClick={() => openAuth('login')}>
								Войти
							</button>
						</div>

						<nav className={styles.drawerNav}>
							{LANDING_SECTIONS.map(section => (
								<button
									key={section.id}
									type='button'
									className={styles.drawerLink}
									onClick={() => scrollToSection(section.id)}
								>
									{section.label}
								</button>
							))}
						</nav>
					</>
				)}
			</aside>

			<LoginModal
				isOpen={isLoginModalOpen}
				onClose={() => setIsLoginModalOpen(false)}
				onLogin={handleLoginSuccess}
				initialMode={loginModalMode}
			/>
		</>
	)
}
