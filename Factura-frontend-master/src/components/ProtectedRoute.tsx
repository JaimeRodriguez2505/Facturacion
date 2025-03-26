"use client"

import type React from "react"
import { Navigate, useLocation } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { useCompany } from "../contexts/CompanyContext"
import CircularProgress from "@mui/material/CircularProgress"
import Box from "@mui/material/Box"

interface ProtectedRouteProps {
  children: React.ReactNode
  requireCompany?: boolean
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireCompany = false }) => {
  const { user, loading } = useAuth()
  const { companies, loading: companyLoading } = useCompany()
  const location = useLocation()

  console.log("ProtectedRoute - User:", user)
  console.log("ProtectedRoute - Loading:", loading)
  console.log("ProtectedRoute - Companies:", companies)
  console.log("ProtectedRoute - Company Loading:", companyLoading)

  if (loading || companyLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    )
  }

  if (!user) {
    console.log("ProtectedRoute - No user, redirecting to login")
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Si se requiere una empresa y no hay empresas registradas, redirigir a la página de registro de empresa
  if (requireCompany && companies.length === 0) {
    console.log("ProtectedRoute - No companies, redirecting to company registration")
    return <Navigate to="/companies/new" state={{ from: location }} replace />
  }

  console.log("ProtectedRoute - User authenticated, rendering children")
  return <>{children}</>
}

export default ProtectedRoute
