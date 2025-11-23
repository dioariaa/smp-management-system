import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import LoadingSpinner from './LoadingSpinner'

export const ProtectedRoute = ({ children }) => {
  const { user, isLoading } = useAuthStore()

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}

export const RoleRoute = ({ allowedRoles, children }) => {
  const { role } = useAuthStore()

  if (!role) {
    return <Navigate to="/login" replace />
  }

  if (!allowedRoles.includes(role)) {
    // Sudah login tapi role tidak punya akses → balikin ke dashboard role-nya
    return <Navigate to={`/${role}`} replace />
  }

  return children
}
