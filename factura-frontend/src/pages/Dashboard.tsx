"use client"

import type React from "react"
import { useState, useEffect, useCallback, useMemo } from "react"
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Alert,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  LinearProgress,
  Fade,
  Zoom,
} from "@mui/material"
import {
  Receipt,
  Business,
  Add,
  DarkMode,
  LightMode,
  TrendingUp,
  CalendarToday,
  CheckCircle,
  Warning,
  Error,
  Block,
  ArrowForward,
  Refresh,
  Dashboard as DashboardIcon,
  PieChart,
  AttachMoney,
} from "@mui/icons-material"
import MainLayout from "../components/layout/MainLayout"
import { useCompany } from "../contexts/CompanyContext"
import { useTheme as useAppTheme } from "../contexts/ThemeContext"
import { useNavigate } from "react-router-dom"
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts"
import { facturaService } from "../service/facturaService"
import LoadingOverlay from "../components/LoadingOverlay"

// Importar estilos específicos para esta página
import "../css/Dashboard.css"

const COLORS = ["#4caf50", "#ff9800", "#f44336", "#9e9e9e"]

const Dashboard: React.FC = () => {
  const { companies, selectedCompany } = useCompany()
  const { darkMode, toggleDarkMode } = useAppTheme()
  const navigate = useNavigate()
  const [refreshing, setRefreshing] = useState(false)
  const [recentInvoices, setRecentInvoices] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [animateRefresh, setAnimateRefresh] = useState(false)
  const [facturasStats, setFacturasStats] = useState({
    total: 0,
    totalAmount: 0,
    pagadas: 0,
    pendientes: 0,
    vencidas: 0,
    anuladas: 0,
  })

  // Función para cargar facturas recientes y estadísticas
  const fetchDashboardData = useCallback(async () => {
    // Si ya estamos cargando o ya hemos inicializado, no hacer nada
    if (isLoading || isInitialized || !selectedCompany) return

    try {
      setIsLoading(true)
      const response = await facturaService.getFacturas()

      if (response.success && response.facturas) {
        const facturas = response.facturas

        // Ordenar por fecha de emisión (más recientes primero) y tomar las primeras 5
        const recentOnes = [...facturas]
          .sort((a, b) => new Date(b.fecha_emision).getTime() - new Date(a.fecha_emision).getTime())
          .slice(0, 5)
        setRecentInvoices(recentOnes)

        // Calcular estadísticas
        const stats = {
          total: facturas.length,
          totalAmount: facturas.reduce((sum: number, factura: { total: any }) => sum + Number(factura.total), 0),
          pagadas: facturas.filter((f: { estado: string }) => f.estado === "Pagada").length,
          pendientes: facturas.filter((f: { estado: string }) => f.estado === "Pendiente").length,
          vencidas: facturas.filter((f: { estado: string }) => f.estado === "Vencida").length,
          anuladas: facturas.filter((f: { estado: string }) => f.estado === "Anulada").length,
        }

        setFacturasStats(stats)
        setIsInitialized(true)
      }
    } catch (error) {
      console.error("Error al cargar datos del dashboard:", error)
    } finally {
      setIsLoading(false)
    }
  }, [selectedCompany, isLoading, isInitialized])

  // Simulate data refresh
  const handleRefresh = () => {
    setRefreshing(true)
    setAnimateRefresh(true)
    setIsInitialized(false) // Resetear para permitir una nueva carga
    fetchDashboardData().finally(() => {
      setRefreshing(false)
      setTimeout(() => setAnimateRefresh(false), 500)
    })
  }

  // Fix the navigation to the new invoice page
  const handleCreateInvoice = () => {
    if (selectedCompany) {
      navigate("/facturas/nueva")
    } else {
      navigate("/companies")
    }
  }

  useEffect(() => {
    if (selectedCompany && !isInitialized && !isLoading) {
      fetchDashboardData()
    }
  }, [selectedCompany, fetchDashboardData, isInitialized, isLoading])

  // Preparar datos para el gráfico de estado de facturas
  const invoiceStatusData = useMemo(
    () => [
      { name: "Pagadas", value: facturasStats.pagadas, color: "#4caf50" },
      { name: "Pendientes", value: facturasStats.pendientes, color: "#ff9800" },
      { name: "Vencidas", value: facturasStats.vencidas, color: "#f44336" },
      { name: "Anuladas", value: facturasStats.anuladas, color: "#9e9e9e" },
    ],
    [facturasStats],
  )

  // Obtener el icono según el estado
  const getStatusIcon = (estado: string) => {
    switch (estado) {
      case "Pagada":
        return <CheckCircle className="dashboard-recent-item-status-icon" />
      case "Pendiente":
        return <Warning className="dashboard-recent-item-status-icon" />
      case "Vencida":
        return <Error className="dashboard-recent-item-status-icon" />
      case "Anulada":
        return <Block className="dashboard-recent-item-status-icon" />
      default:
        return null
    }
  }

  // Si no hay empresas, mostrar un mensaje para crear una
  if (companies.length === 0) {
    return (
      <MainLayout>
        <Box className="dashboard-container" sx={{ flexGrow: 1, p: 3 }}>
          {/* Botón para alternar modo oscuro */}
          <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
            <Tooltip title={darkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}>
              <IconButton
                onClick={toggleDarkMode}
                sx={{
                  color: darkMode ? "white" : "black",
                  backgroundColor: darkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
                  "&:hover": {
                    backgroundColor: darkMode ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)",
                  },
                }}
              >
                {darkMode ? <LightMode /> : <DarkMode />}
              </IconButton>
            </Tooltip>
          </Box>

          <Zoom in={true}>
            <div className="dashboard-empty-state">
              <Business className="dashboard-empty-icon" />
              <Typography variant="h4" className="dashboard-empty-title">
                Bienvenido al Sistema de Facturación
              </Typography>
              <Typography variant="body1" className="dashboard-empty-description">
                Para comenzar a generar facturas, primero debes registrar una empresa. Esto te permitirá gestionar tus
                documentos electrónicos de manera eficiente.
              </Typography>
              <Button
                variant="contained"
                color="primary"
                size="large"
                startIcon={<Add />}
                onClick={() => navigate("/companies/new")}
                className="dashboard-empty-button"
              >
                Registrar Empresa
              </Button>
            </div>
          </Zoom>
        </Box>
      </MainLayout>
    )
  }

  // Si hay empresas pero no hay una seleccionada
  if (!selectedCompany) {
    return (
      <MainLayout>
        <Box className="dashboard-container" sx={{ flexGrow: 1, p: 3 }}>
          {/* Botón para alternar modo oscuro */}
          <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
            <Tooltip title={darkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}>
              <IconButton
                onClick={toggleDarkMode}
                sx={{
                  color: darkMode ? "white" : "black",
                  backgroundColor: darkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
                  "&:hover": {
                    backgroundColor: darkMode ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)",
                  },
                }}
              >
                {darkMode ? <LightMode /> : <DarkMode />}
              </IconButton>
            </Tooltip>
          </Box>

          <Fade in={true}>
            <Alert severity="info" sx={{ mb: 3 }} className="alert-animation">
              Selecciona una empresa para comenzar a trabajar
            </Alert>
          </Fade>

          <Grid container spacing={3}>
            {companies.map((company) => (
              <Grid item xs={12} md={4} key={company.ruc}>
                <Paper
                  elevation={3}
                  className="dashboard-company-card"
                  onClick={() => navigate(`/companies/${company.ruc}`)}
                >
                  <Box sx={{ p: 3 }}>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                      <Avatar
                        className="dashboard-company-avatar"
                        sx={{
                          width: 56,
                          height: 56,
                          bgcolor: "primary.main",
                          mr: 2,
                        }}
                      >
                        <Business sx={{ fontSize: 32 }} />
                      </Avatar>
                      <Box>
                        <Typography variant="h5" component="div" className="dashboard-company-name">
                          {company.razon_social}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" className="dashboard-company-info">
                          RUC: {company.ruc}
                        </Typography>
                      </Box>
                    </Box>
                    <Typography variant="body2" color="text.secondary" className="dashboard-company-info">
                      {company.direccion}
                    </Typography>
                    <Box className="dashboard-company-buttons">
                      <Button variant="contained" fullWidth>
                        Seleccionar
                      </Button>
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>
      </MainLayout>
    )
  }

  // Dashboard normal con empresa seleccionada
  return (
    <MainLayout>
      {isLoading && !refreshing && <LoadingOverlay message="Cargando datos..." />}

      <Box className="dashboard-container" sx={{ flexGrow: 1, p: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
          <Box className="dashboard-header">
            <DashboardIcon className="dashboard-header-icon" />
            <Typography variant="h4" className="dashboard-title">
              Dashboard
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Button
              variant="outlined"
              className="btn-actualizar"
              onClick={handleRefresh}
              disabled={refreshing}
              size="small"
            >
              <Refresh className={`refresh-icon ${animateRefresh ? "animate-spin" : ""}`} sx={{ mr: 1 }} />
              {refreshing ? "Actualizando..." : "Actualizar"}
            </Button>
            <Tooltip title={darkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}>
              <IconButton
                onClick={toggleDarkMode}
                sx={{
                  color: darkMode ? "white" : "black",
                  backgroundColor: darkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
                  "&:hover": {
                    backgroundColor: darkMode ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)",
                  },
                }}
              >
                {darkMode ? <LightMode /> : <DarkMode />}
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {refreshing && <LinearProgress sx={{ mb: 3 }} />}

        {/* Información de la empresa */}
        <Paper elevation={3} className="dashboard-company-card" sx={{ p: 3, mb: 4, mt: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <Avatar
              className="dashboard-company-avatar"
              sx={{
                width: 56,
                height: 56,
                bgcolor: "primary.main",
                mr: 2,
              }}
            >
              <Business sx={{ fontSize: 32 }} />
            </Avatar>
            <Box>
              <Typography variant="h5" component="div" className="dashboard-company-name" fontWeight="bold">
                {selectedCompany.razon_social}
              </Typography>
              <Typography variant="body2" color="text.secondary" className="dashboard-company-info">
                RUC: {selectedCompany.ruc} • {selectedCompany.direccion}
              </Typography>
            </Box>
            <Box sx={{ ml: "auto", display: "flex", gap: 1 }} className="dashboard-company-buttons">
              <Button variant="outlined" color="primary" onClick={() => navigate(`/companies/${selectedCompany.ruc}`)}>
                Ver Detalles
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleCreateInvoice}
                startIcon={<Add />}
                className="dashboard-empty-button"
              >
                Nueva Factura
              </Button>
            </Box>
          </Box>
        </Paper>

        {/* Tarjetas de resumen */}
        <div className="dashboard-stats-container">
          <Card elevation={2} className="dashboard-stat-card">
            <CardContent>
              <Box className="dashboard-stat-header">
                <Typography className="dashboard-stat-title">Ventas Totales</Typography>
                <Avatar className="dashboard-stat-avatar" sx={{ bgcolor: "primary.light" }}>
                  <AttachMoney />
                </Avatar>
              </Box>
              <Typography variant="h4" component="div" className="dashboard-stat-value">
                S/. {facturasStats.totalAmount.toFixed(2)}
              </Typography>
              <Box className="dashboard-stat-trend">
                <TrendingUp className="dashboard-stat-trend-icon" />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                  Total de ventas
                </Typography>
              </Box>
            </CardContent>
          </Card>

          <Card elevation={2} className="dashboard-stat-card">
            <CardContent>
              <Box className="dashboard-stat-header">
                <Typography className="dashboard-stat-title">Facturas</Typography>
                <Avatar className="dashboard-stat-avatar" sx={{ bgcolor: "success.light" }}>
                  <Receipt />
                </Avatar>
              </Box>
              <Typography variant="h4" component="div" className="dashboard-stat-value">
                {facturasStats.total}
              </Typography>
              <Box className="dashboard-stat-trend">
                <Typography variant="body2" color="text.secondary">
                  Total de facturas emitidas
                </Typography>
              </Box>
            </CardContent>
          </Card>

          <Card elevation={2} className="dashboard-stat-card">
            <CardContent>
              <Box className="dashboard-stat-header">
                <Typography className="dashboard-stat-title">Facturas Pagadas</Typography>
                <Avatar className="dashboard-stat-avatar" sx={{ bgcolor: "success.main" }}>
                  <CheckCircle />
                </Avatar>
              </Box>
              <Typography variant="h4" component="div" className="dashboard-stat-value">
                {facturasStats.pagadas}
              </Typography>
              <Box className="dashboard-stat-trend">
                <Typography variant="body2" color="text.secondary">
                  Facturas con estado "Pagada"
                </Typography>
              </Box>
            </CardContent>
          </Card>

          <Card elevation={2} className="dashboard-stat-card">
            <CardContent>
              <Box className="dashboard-stat-header">
                <Typography className="dashboard-stat-title">Facturas Pendientes</Typography>
                <Avatar className="dashboard-stat-avatar" sx={{ bgcolor: "warning.main" }}>
                  <Warning />
                </Avatar>
              </Box>
              <Typography variant="h4" component="div" className="dashboard-stat-value">
                {facturasStats.pendientes}
              </Typography>
              <Box className="dashboard-stat-trend">
                <Typography variant="body2" color="text.secondary">
                  Facturas con estado "Pendiente"
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </div>

        {/* Gráfico de estado de facturas y Facturas Recientes */}
        <div className="dashboard-charts-container">
          <Card elevation={2} className="dashboard-chart-card">
            <CardHeader
              title={<Typography className="dashboard-chart-title">Estado de Facturas</Typography>}
              subheader="Distribución por estado"
              action={
                <IconButton>
                  <PieChart />
                </IconButton>
              }
            />
            <CardContent>
              <Box className="dashboard-chart-content">
                {facturasStats.total > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height="80%">
                      <RechartsPieChart>
                        <Pie
                          data={invoiceStatusData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {invoiceStatusData.map((_entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                    <div className="dashboard-chart-legend">
                      {invoiceStatusData.map((entry, index) => (
                        <div key={index} className="dashboard-chart-legend-item">
                          <div className="dashboard-chart-legend-color" style={{ backgroundColor: COLORS[index] }} />
                          <Typography variant="body2" className="dashboard-chart-legend-label">
                            {entry.name}
                          </Typography>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
                    <Typography variant="body1" color="text.secondary">
                      No hay datos disponibles
                    </Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>

          <Card elevation={2} className="dashboard-recent-container">
            <div className="dashboard-recent-header">
              <Typography className="dashboard-recent-title">Facturas Recientes</Typography>
              <Button
                className="dashboard-recent-view-all"
                onClick={() => navigate("/facturas")}
                endIcon={<ArrowForward className="dashboard-recent-view-all-icon" />}
                size="small"
              >
                Ver todas
              </Button>
            </div>
            <List className="dashboard-recent-list">
              {recentInvoices.length === 0 ? (
                <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", p: 3 }}>
                  <Typography variant="body2" color="text.secondary" align="center">
                    No hay facturas recientes
                  </Typography>
                </Box>
              ) : (
                recentInvoices.map((invoice) => (
                  <ListItem
                    key={invoice.id}
                    className="dashboard-recent-item"
                    onClick={() => navigate(`/facturas/${invoice.id}`)}
                    sx={{ cursor: "pointer" }}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      {invoice.estado === "Pagada" ? (
                        <CheckCircle color="success" />
                      ) : invoice.estado === "Pendiente" ? (
                        <Warning color="warning" />
                      ) : invoice.estado === "Vencida" ? (
                        <Error color="error" />
                      ) : (
                        <Block />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <div className="dashboard-recent-item-content">
                          <div className="dashboard-recent-item-info">
                            <Typography className="dashboard-recent-item-title">
                              {invoice.serie}-{invoice.correlativo} - {invoice.nombre_cliente}
                            </Typography>
                            <div className="dashboard-recent-item-subtitle">
                              <CalendarToday className="dashboard-recent-item-date-icon" />
                              <Typography component="span" variant="caption" color="text.secondary">
                                {new Date(invoice.fecha_emision).toLocaleDateString()}
                              </Typography>
                            </div>
                          </div>
                          <div className="dashboard-recent-item-status-container">
                            <Typography className="dashboard-recent-item-amount">
                              S/ {Number(invoice.total).toFixed(2)}
                            </Typography>
                            <div className={`dashboard-recent-item-status ${invoice.estado.toLowerCase()}`}>
                              {getStatusIcon(invoice.estado)}
                              {invoice.estado}
                            </div>
                          </div>
                        </div>
                      }
                    />
                  </ListItem>
                ))
              )}
            </List>
          </Card>
        </div>

        {/* Acciones rápidas */}
        <Card elevation={2} className="dashboard-actions-container">
          <div className="dashboard-actions-header">
            <Typography className="dashboard-actions-title">Acciones Rápidas</Typography>
          </div>
          <div className="dashboard-actions-content">
            <Button
              variant="outlined"
              className="dashboard-action-button"
              startIcon={<Receipt className="dashboard-action-button-icon" />}
              onClick={() => navigate("/facturas/nueva")}
            >
              Nueva Factura
            </Button>
            <Button
              variant="outlined"
              className="dashboard-action-button"
              startIcon={<ArrowForward className="dashboard-action-button-icon" />}
              onClick={() => navigate("/facturas")}
            >
              Ver Facturas
            </Button>
            <Button
              variant="outlined"
              className="dashboard-action-button"
              startIcon={<Business className="dashboard-action-button-icon" />}
              onClick={() => navigate(`/companies/${selectedCompany.ruc}`)}
            >
              Detalles de Empresa
            </Button>
            <Button
              variant="outlined"
              className="dashboard-action-button"
              startIcon={<Add className="dashboard-action-button-icon" />}
              onClick={() => navigate("/companies/new")}
            >
              Nueva Empresa
            </Button>
          </div>
        </Card>
      </Box>
    </MainLayout>
  )
}

export default Dashboard

