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

  // Eliminamos los logs excesivos que causan ruido en la consola

  if (loading || companyLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        width="100%"
        position="fixed"
        top={0}
        left={0}
        zIndex={9999}
        bgcolor="rgba(255, 255, 255, 0.7)"
      >
        <CircularProgress size={60} />
      </Box>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Si se requiere una empresa y no hay empresas registradas, redirigir a la página de registro de empresa
  if (requireCompany && companies.length === 0) {
    return <Navigate to="/companies/new" state={{ from: location }} replace />
  }

  return <>{children}</>
}

export default ProtectedRoute

