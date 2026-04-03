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
	const isMigrationPending =
		typeof window !== 'undefined'
			? localStorage.getItem('migration_pending') === 'true'
			: false

	if (!isAuthenticated) {
		return <Navigate to='/' state={{ from: location }} replace />
	}

	if (isMigrationPending) {
		if (typeof window !== 'undefined') {
			window.dispatchEvent(new CustomEvent('showMigrationModal'))
		}
		return <Navigate to='/' replace />
	}

	if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
		return <Navigate to='/schedule' replace />
	}

	return <>{children}</>
}
