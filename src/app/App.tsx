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
import {
	AuthUnauthorizedError,
	getUserInfo,
	type LoginV2Response,
	type UserDetailedInfo,
} from '@api/auth'
import { AlertProvider } from '@components/ui/alert/AlertContext'
import { AuthProvider } from '../shared/auth/AuthContext'
import { useAuth } from '../shared/auth/AuthContext'
import { ChatProvider } from '../shared/chat/ChatContext'
import { SSEProvider } from '../shared/sse/SSEComponent/SSEContext'
import { NotificationProvider } from '@components/notification/NotificationToast'
import { useLocation } from 'react-router-dom'
import { ProtectedRoute } from '@components/auth/ProtectedRoute'
import { clearAuthSession, saveAuthSession } from '@auth/authStorage'

interface AppContentProps {
	isAuthenticated: boolean
	userRole: 'tutor' | 'student_or_parent' | 'admin' | null
	navigateToProfile: (userId: string) => void
	navigateToChat: (chatId: string) => void
}

const createFallbackUserInfo = (
	userId: string | null,
	role: string | null,
): UserDetailedInfo | null => {
	if (!userId || !role) return null

	return {
		id: userId,
		firstName: '',
		lastName: '',
		photoUrl: '',
		username: '',
		email: null,
		role: { id: role },
	}
}

const AppContent = ({
	isAuthenticated,
	userRole,
	navigateToProfile,
	navigateToChat,
}: AppContentProps) => {
	const defaultAuthenticatedRoute =
		userRole === 'admin' ? '/admin' : '/schedule'

	const routes = [
		{
			path: '/',
			element: isAuthenticated ? (
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
				<ProtectedRoute isAuthenticated={isAuthenticated} userRole={userRole}>
					<UserProfilePage />
				</ProtectedRoute>
			),
		},
		{
			path: '/schedule',
			element: (
				<ProtectedRoute isAuthenticated={isAuthenticated} userRole={userRole}>
					<SchedulePage />
				</ProtectedRoute>
			),
		},
		{
			path: '/statistic',
			element: (
				<ProtectedRoute
					isAuthenticated={isAuthenticated}
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
				<ProtectedRoute isAuthenticated={isAuthenticated} userRole={userRole}>
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
				<ProtectedRoute isAuthenticated={isAuthenticated} userRole={userRole}>
					<UserProfilePage />
				</ProtectedRoute>
			),
		},
		{
			path: '/messages',
			element: (
				<ProtectedRoute isAuthenticated={isAuthenticated} userRole={userRole}>
					<MessagesPage />
				</ProtectedRoute>
			),
		},
		{
			path: '/messages/:chatId',
			element: (
				<ProtectedRoute isAuthenticated={isAuthenticated} userRole={userRole}>
					<MessagesPage />
				</ProtectedRoute>
			),
		},
		{
			path: '/admin',
			element: (
				<ProtectedRoute
					isAuthenticated={isAuthenticated}
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
					isAuthenticated={isAuthenticated}
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
					isAuthenticated={isAuthenticated}
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
					isAuthenticated={isAuthenticated}
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
					isAuthenticated={isAuthenticated}
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
					isAuthenticated={isAuthenticated}
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
					isAuthenticated={isAuthenticated}
					userRole={userRole}
					allowedRoles={['admin']}
				>
					<ParentStudentLinkPage />
				</ProtectedRoute>
			),
		},
		{
			path: '*',
			element: (
				<div className='app-not-found'>
					<h1>404</h1>
					<p>Такой страницы нет. Проверьте адрес или вернитесь на главную.</p>
				</div>
			),
		},
	]

	const element = useRoutes(routes)
	return <div className='app-content-container'>{element}</div>
}

export const AppLogic = () => {
	const location = useLocation()
	const isChatPage = location.pathname.startsWith('/messages')
	const navigate = useNavigate()
	const { token, userId, role, userInfo, setUserInfo, syncAuthData } = useAuth()
	const isAuthenticated = !!token
	const userRole = role as 'tutor' | 'student_or_parent' | 'admin' | null

	const [isLoading, setIsLoading] = useState(true)
	const [isAuthCheckDeferred, setIsAuthCheckDeferred] = useState(false)

	useEffect(() => {
		const setVh = () => {
			document.documentElement.style.setProperty(
				'--vh',
				`${window.innerHeight * 0.01}px`,
			)
		}
		setVh()
		window.addEventListener('resize', setVh)
		return () => window.removeEventListener('resize', setVh)
	}, [])

	useEffect(() => {
		if (isChatPage) document.body.classList.add('chat-mode-active')
		else document.body.classList.remove('chat-mode-active')
	}, [isChatPage])

	useEffect(() => {
		const initAuth = async () => {
			if (!token) {
				setIsLoading(false)
				setIsAuthCheckDeferred(false)
				return
			}
			if (userInfo) {
				setIsLoading(false)
			}
			try {
				const fetchedUserInfo = await getUserInfo()
				if (fetchedUserInfo) {
					setUserInfo(fetchedUserInfo) // 🔹 Исправлено: прямой вызов
					setIsAuthCheckDeferred(false)
				} else {
					clearAuthSession()
					setUserInfo(null)
					syncAuthData()
				}
			} catch (error) {
				if (error instanceof AuthUnauthorizedError) {
					clearAuthSession()
					setUserInfo(null)
					setIsAuthCheckDeferred(false)
					syncAuthData()
					navigate('/', { replace: true })
					return
				}

				console.warn('[auth] Auth check temporarily failed, keeping session', error)

				if (!userInfo) {
					const fallbackUserInfo = createFallbackUserInfo(userId, role)

					if (fallbackUserInfo) {
						setUserInfo(fallbackUserInfo)
					} else {
						setIsAuthCheckDeferred(true)
					}
				}
			} finally {
				setIsLoading(false)
			}
		}
		initAuth()
	}, [token, userId, role, setUserInfo, syncAuthData, navigate])

	const handleLogin = useCallback(
		(authData: LoginV2Response) => {
			const nextUserInfo: UserDetailedInfo = {
				id: authData.id,
				firstName: authData.firstName,
				lastName: authData.lastName,
				photoUrl: authData.photoUrl,
				username: authData.username,
				email: authData.email ?? null,
				role: { id: authData.role },
			}

			saveAuthSession({
				token: authData.accessToken,
				userId: authData.id,
				role: authData.role,
				userInfo: nextUserInfo,
			})
			setUserInfo(nextUserInfo)
			setIsAuthCheckDeferred(false)
			syncAuthData()
			navigate(authData.role === 'admin' ? '/admin' : '/schedule', {
				replace: true,
			})
		},
		[navigate, setUserInfo, syncAuthData],
	)

	const handleLogout = async () => {
		setUserInfo(null)
		setIsLoading(false)
		setIsAuthCheckDeferred(false)

		clearAuthSession()
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

	if (isLoading || (isAuthenticated && !userInfo && !isAuthCheckDeferred)) {
		return (
			<div className='app-loader' role='status'>
				<div className='app-loader__spinner' />
				<div>Загрузка...</div>
			</div>
		)
	}

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
				userRole={userRole}
				navigateToProfile={handleNavigateToProfile}
				navigateToChat={handleNavigateToChat}
			/>
			{!isChatPage && <Footer isAuthenticated={isAuthenticated} />}
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
