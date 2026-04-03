// src/shared/components/auth/ProtectedRoute.tsx
import { Navigate, useLocation } from 'react-router'
import type { ReactNode } from 'react'

interface ProtectedRouteProps {
	children: ReactNode
	isAuthenticated: boolean
	userRole?: 'tutor' | 'student_or_parent' | 'admin' | null
	allowedRoles?: ('tutor' | 'student_or_parent' | 'admin')[]
}

export const ProtectedRoute = ({
	children,
	isAuthenticated,
	userRole,
	allowedRoles,
}: ProtectedRouteProps) => {
	const location = useLocation()

	// ❌ Не авторизован → редирект на лендинг
	if (!isAuthenticated) {
		return <Navigate to='/' state={{ from: location }} replace />
	}

	// 🔐 Проверка ролей (если указаны разрешённые)
	if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
		return <Navigate to='/schedule' replace />
	}

	// ✅ Все проверки пройдены.
	// Если migration_pending === true, пользователь всё равно попадёт сюда,
	// но модалка будет висеть поверх и блокировать взаимодействие.
	return <>{children}</>
}
