// src/app/App.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRoutes, Navigate, useNavigate } from 'react-router'
import { Header } from '@components/layout/Header'
import { Footer } from '@components/layout/Footer'
import LandingPage from '../pages/LandingPage/LandingPage'
import { SchedulePage } from '../pages/SchedulePage/SchedulePage'
import { AdminPage } from '../pages/AdminPage/AdminPage'
import MessagesPage from '@pages/MessagesPage/MessagesPage'
import AdminMessagePage from '@pages/AdminPage/AdminMessagePage/AdminMessagePage'
import LegalInfoPage from '@pages/LegalInfoPage/LegalInfoPage'
import PrivacyPolicyPage from '@pages/PrivacyPolicyPage/PrivacyPolicyPage'
import TermsOfServicePage from '@pages/TermsOfServicePage/TermsOfServicePage'
import MyPersonPage from '@pages/MyPersonPage/MyPersonPage'
import AdminStatisticPage from '@pages/AdminPage/AdminStatisticPage'
import { UserListPage } from '@pages/AdminPage/UserListPage/UserListPage'
import { ParentStudentLinkPage } from '@pages/AdminPage/ParentStudentLinkPage'
import UserProfilePage from '@pages/UserProfilePage/UserProfilePage'
import { PersonStatisticPage } from '@pages/PersonStatisticPage/PersonStatisticPage'
import { TutorStudentLinkPage } from '../pages/AdminPage/TutorStudentLinkPage'
// @ts-ignore
import loadingGif from '@images/loading.gif'
import { loginWithTelegram, getUserInfo, UserDetailedInfo } from '@api/auth'
import type { TelegramUser } from '@components/auth/TelegramLoginButton'
import '../styles/global.scss'
import { AlertProvider } from '@components/ui/alert/AlertContext'
import { useAlert } from '@components/ui/alert/AlertContext'
import { AuthProvider } from '../shared/auth/AuthContext'
import { useAuth } from '../shared/auth/AuthContext'
import { ChatProvider } from '../shared/chat/ChatContext'
import { SSEProvider } from '../shared/sse/SSEComponent/SSEContext'
import { NotificationProvider } from '@components/notification/NotificationToast'
import { useLocation } from 'react-router-dom'
import { ProtectedRoute } from '@components/auth/ProtectedRoute'
import { LoginModal } from '@components/layout/Header/LoginModal'

interface AppContentProps {
	isAuthenticated: boolean
	onLogin: (
		role: 'tutor' | 'student_or_parent',
		telegramData: TelegramUser,
	) => void | Promise<void>
	userRole: 'tutor' | 'student_or_parent' | 'admin' | null
	navigateToProfile: (userId: string) => void
	navigateToChat: (chatId: string) => void
}

const setAuthData = (
	userInfo: UserDetailedInfo,
	setAuthInfo: (data: UserDetailedInfo | null) => void,
) => {
	setAuthInfo(userInfo)
}

const AppContent = ({
	isAuthenticated,
	userRole,
	navigateToProfile,
	navigateToChat,
}: AppContentProps) => {
	const defaultAuthenticatedRoute = '/schedule'
	const isMigrationPending =
		typeof window !== 'undefined'
			? localStorage.getItem('migration_pending') === 'true'
			: false

	const routes = [
		{
			path: '/',
			element:
				isAuthenticated && !isMigrationPending ? (
					<Navigate to={defaultAuthenticatedRoute} replace />
				) : (
					<LandingPage />
				),
		},
		{ path: '/legal-info', element: <LegalInfoPage /> },
		{ path: '/privacy-policy', element: <PrivacyPolicyPage /> },
		{ path: '/terms-of-service', element: <TermsOfServicePage /> },
		{
			path: '/profile',
			element: (
				<ProtectedRoute
					isAuthenticated={isAuthenticated && !isMigrationPending}
					userRole={userRole}
				>
					<UserProfilePage />
				</ProtectedRoute>
			),
		},
		{
			path: '/schedule',
			element: (
				<ProtectedRoute
					isAuthenticated={isAuthenticated && !isMigrationPending}
					userRole={userRole}
				>
					<SchedulePage />
				</ProtectedRoute>
			),
		},
		{
			path: '/statistic',
			element: (
				<ProtectedRoute
					isAuthenticated={isAuthenticated && !isMigrationPending}
					userRole={userRole}
					allowedRoles={['tutor', 'student_or_parent']}
				>
					<PersonStatisticPage
						userRole={userRole as 'tutor' | 'student_or_parent'}
					/>
				</ProtectedRoute>
			),
		},
		{
			path: '/students',
			element: (
				<ProtectedRoute
					isAuthenticated={isAuthenticated && !isMigrationPending}
					userRole={userRole}
				>
					<MyPersonPage
						userRole={userRole}
						navigateToProfile={navigateToProfile}
						navigateToChat={navigateToChat}
					/>
				</ProtectedRoute>
			),
		},
		{
			path: '/user/profile/:userId',
			element: (
				<ProtectedRoute
					isAuthenticated={isAuthenticated && !isMigrationPending}
					userRole={userRole}
				>
					<UserProfilePage />
				</ProtectedRoute>
			),
		},
		{
			path: '/messages',
			element: (
				<ProtectedRoute
					isAuthenticated={isAuthenticated && !isMigrationPending}
					userRole={userRole}
				>
					<MessagesPage />
				</ProtectedRoute>
			),
		},
		{
			path: '/messages/:chatId',
			element: (
				<ProtectedRoute
					isAuthenticated={isAuthenticated && !isMigrationPending}
					userRole={userRole}
				>
					<MessagesPage />
				</ProtectedRoute>
			),
		},
		{
			path: '/admin',
			element: (
				<ProtectedRoute
					isAuthenticated={isAuthenticated && !isMigrationPending}
					userRole={userRole}
					allowedRoles={['admin']}
				>
					<AdminPage />
				</ProtectedRoute>
			),
		},
		{
			path: '/all-message',
			element: (
				<ProtectedRoute
					isAuthenticated={isAuthenticated && !isMigrationPending}
					userRole={userRole}
					allowedRoles={['admin']}
				>
					<AdminMessagePage />
				</ProtectedRoute>
			),
		},
		{
			path: '/all-message/:chatId',
			element: (
				<ProtectedRoute
					isAuthenticated={isAuthenticated && !isMigrationPending}
					userRole={userRole}
					allowedRoles={['admin']}
				>
					<AdminMessagePage />
				</ProtectedRoute>
			),
		},
		{
			path: '/all-statistic',
			element: (
				<ProtectedRoute
					isAuthenticated={isAuthenticated && !isMigrationPending}
					userRole={userRole}
					allowedRoles={['admin']}
				>
					<AdminStatisticPage />
				</ProtectedRoute>
			),
		},
		{
			path: '/tutor-student-link',
			element: (
				<ProtectedRoute
					isAuthenticated={isAuthenticated && !isMigrationPending}
					userRole={userRole}
					allowedRoles={['admin']}
				>
					<TutorStudentLinkPage />
				</ProtectedRoute>
			),
		},
		{
			path: '/admin/users',
			element: (
				<ProtectedRoute
					isAuthenticated={isAuthenticated && !isMigrationPending}
					userRole={userRole}
					allowedRoles={['admin']}
				>
					<UserListPage />
				</ProtectedRoute>
			),
		},
		{
			path: '/admin/parent-links',
			element: (
				<ProtectedRoute
					isAuthenticated={isAuthenticated && !isMigrationPending}
					userRole={userRole}
					allowedRoles={['admin']}
				>
					<ParentStudentLinkPage />
				</ProtectedRoute>
			),
		},
		{ path: '*', element: <div>404 Page Not Found</div> },
	]

	const element = useRoutes(routes)
	return <div className='app-content-container'>{element}</div>
}

export const AppLogic = () => {
	const location = useLocation()
	const isChatPage =
		location.pathname.startsWith('/messages/') &&
		location.pathname.length > '/messages/'.length
	const navigate = useNavigate()
	const { token, role, userInfo, setUserInfo, syncAuthData } = useAuth()
	const { showAlert } = useAlert()
	const isAuthenticated = !!token
	const userRole = role as 'tutor' | 'student_or_parent' | 'admin' | null

	// 🔹 ВСЕ useState — В НАЧАЛЕ
	const [isLoading, setIsLoading] = useState(true)
	const [isGlobalModalOpen, setIsGlobalModalOpen] = useState(false)

	// 🔹 ВСЕ useEffect — В НАЧАЛЕ
	useEffect(() => {
		const setVh = () => {
			const vh = window.innerHeight * 0.01
			document.documentElement.style.setProperty('--vh', `${vh}px`)
		}
		setVh()
		window.addEventListener('resize', setVh)
		return () => window.removeEventListener('resize', setVh)
	}, [])

	useEffect(() => {
		if (isChatPage) {
			document.body.classList.add('chat-mode-active')
		} else {
			document.body.classList.remove('chat-mode-active')
		}
	}, [isChatPage])

	useEffect(() => {
		const initAuth = async () => {
			if (!token) {
				setIsLoading(false)
				return
			}
			if (userInfo) {
				setIsLoading(false)
				return
			}
			try {
				const fetchedUserInfo = await getUserInfo()
				if (fetchedUserInfo) {
					setAuthData(fetchedUserInfo, setUserInfo)
				} else {
					localStorage.clear()
					syncAuthData()
				}
			} catch (error) {
				console.error('[v0] Auth check failed:', error)
				localStorage.clear()
				syncAuthData()
				navigate('/', { replace: true })
			} finally {
				setIsLoading(false)
			}
		}
		initAuth()
	}, [token, setUserInfo, syncAuthData, navigate])

	// 🔹 Авто-открытие модалки при миграции
	useEffect(() => {
		const hasAuthToken = localStorage.getItem('authToken')
		const isMigrationPending =
			localStorage.getItem('migration_pending') === 'true'
		if (hasAuthToken && isMigrationPending) {
			const savedEmail = localStorage.getItem('migration_email')
			const savedShowCode = localStorage.getItem(
				'migration_show_code_verification',
			)
			const savedTimer = localStorage.getItem('migration_code_timer')
			setIsGlobalModalOpen(true)
			if (typeof window !== 'undefined') {
				window.dispatchEvent(
					new CustomEvent('restoreMigrationState', {
						detail: {
							email: savedEmail,
							showCodeVerification: savedShowCode === 'true',
							timer: savedTimer ? parseInt(savedTimer, 10) : null,
						},
					}),
				)
			}
		}
	}, [])

	// 🔹 Слушатель события от ProtectedRoute
	useEffect(() => {
		const handleShowMigration = () => setIsGlobalModalOpen(true)
		window.addEventListener('showMigrationModal', handleShowMigration)
		return () =>
			window.removeEventListener('showMigrationModal', handleShowMigration)
	}, [])

	// 🔹 ВСЕ useCallback — В НАЧАЛЕ
	const handleLogin = useCallback(
		async (
			selectedRole: 'tutor' | 'student_or_parent' | 'admin',
			telegramData: TelegramUser,
		) => {
			try {
				const response = await loginWithTelegram(telegramData, selectedRole)
				localStorage.setItem('authToken', response.accessToken)
				localStorage.setItem('id', response.id)
				localStorage.setItem('role', response.role)
				syncAuthData()
				const targetRole = response.role as
					| 'tutor'
					| 'student_or_parent'
					| 'admin'
				const targetPath = targetRole === 'admin' ? '/admin' : '/schedule'
				navigate(targetPath, { replace: true })
			} catch (error) {
				console.error('[v0] Login failed:', error)
				showAlert('Ошибка авторизации. Попробуйте еще раз.', 'error')
			}
		},
		[showAlert, navigate, syncAuthData],
	)

	const handleLogout = async () => {
		setUserInfo(null)
		setIsLoading(false)
		localStorage.removeItem('authToken')
		localStorage.removeItem('id')
		localStorage.removeItem('role')
		syncAuthData()
		navigate('/', { replace: true })
	}

	const handleNavigateToProfile = useCallback(
		(userId: string) => navigate(`/user/profile/${userId}`),
		[navigate],
	)
	const handleNavigateToChat = useCallback(
		(chatId: string) => navigate(`/messages/${chatId}`),
		[navigate],
	)

	// ========================================================================
	// 🔹 РАННИЙ ВОЗВРАТ — ПОСЛЕ ВСЕХ ХУКОВ
	// ========================================================================
	if (isLoading || (isAuthenticated && !userInfo)) {
		return (
			<div
				style={{
					display: 'flex',
					flexDirection: 'column',
					justifyContent: 'center',
					alignItems: 'center',
					height: '100vh',
					fontSize: '18px',
					color: '#0066ff',
				}}
			>
				<img
					src={loadingGif}
					alt='Загрузка...'
					style={{ width: '128px', height: '128px', marginBottom: '15px' }}
				/>
				<div>Загрузка...</div>
			</div>
		)
	}

	// ========================================================================
	// 🔹 RETURN JSX
	// ========================================================================
	const isMigrationPending =
		typeof window !== 'undefined'
			? localStorage.getItem('migration_pending') === 'true'
			: false

	return (
		<div className='app-container'>
			<Header
				isAuthenticated={isAuthenticated}
				userName={
					userInfo ? `${userInfo.firstName} ${userInfo.lastName || ''}` : ''
				}
				userAvatar={userInfo ? userInfo.photoUrl : ''}
				userRole={userRole}
				onLogin={handleLogin}
				onLogout={handleLogout}
			/>
			<AppContent
				isAuthenticated={isAuthenticated}
				onLogin={handleLogin}
				userRole={userRole}
				navigateToProfile={handleNavigateToProfile}
				navigateToChat={handleNavigateToChat}
			/>
			{!isChatPage && <Footer isAuthenticated={isAuthenticated} />}
			<LoginModal
				isOpen={isGlobalModalOpen}
				onClose={() => {
					const pending = localStorage.getItem('migration_pending') === 'true'
					if (!pending) setIsGlobalModalOpen(false)
				}}
				onLogin={handleLogin}
				isClosable={!isMigrationPending}
			/>
		</div>
	)
}

export const App = () => (
	<AuthProvider>
		<AlertProvider>
			<ChatProvider>
				<NotificationProvider>
					<SSEProvider>
						<AppLogic />
					</SSEProvider>
				</NotificationProvider>
			</ChatProvider>
		</AlertProvider>
	</AuthProvider>
)
